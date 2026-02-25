import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, useWindowDimensions, Keyboard, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { verifyOTP, resendOTP } from '@/services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OTPVerificationScreenProps = NativeStackScreenProps<AuthStackParamList, 'OTPVerification'>;

const OTPVerificationScreen = ({ navigation, route }: OTPVerificationScreenProps) => {
  const { email, isVendor } = route.params as { email: string; isVendor?: boolean };
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const formMaxWidth = isTablet ? 420 : undefined;

  // Keyboard listener for Android
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter all 6 digits');
      return;
    }

    setLoading(true);

    try {
      console.log('🔢 Verifying OTP:', { email, otp: otpCode });

      const response = await verifyOTP({
        email,
        otp: otpCode,
      });

      console.log('✅ OTP verification successful:', response);

      Alert.alert(
        'Success',
        'Email verified successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              if (isVendor) {
                navigation.navigate('VendorSetup');
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ OTP verification error:', error);

      let errorMessage = 'OTP verification failed. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) {
      return;
    }

    setResending(true);

    try {
      console.log('📧 Resending OTP to:', email);

      const response = await resendOTP(email);

      console.log('✅ OTP resent successfully:', response);

      setCountdown(30);
      setCanResend(false);

      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      Alert.alert('Success', 'A new verification code has been sent to your email');
    } catch (error: any) {
      console.error('❌ Resend OTP error:', error);

      let errorMessage = 'Failed to resend OTP. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Resend Failed', errorMessage);
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingVertical: 40,
          paddingBottom: keyboardHeight > 0 ? keyboardHeight : 40,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Responsive centered container */}
        <View style={{ width: '100%', maxWidth: formMaxWidth }}>
          {/* Title */}
          <Text className="text-2xl font-bold text-pink-500 text-center mb-2">
            Enter Verification Code
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-2">
            We just sent a 6-digit code to
          </Text>
          <Text className="text-sm font-medium text-gray-700 text-center mb-8">
            {email}
          </Text>

          {/* OTP Input Boxes */}
          <View className="flex-row justify-center mb-6 gap-3">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref: TextInput | null) => { inputRefs.current[index] = ref; }}
                className="w-12 h-14 border-2 border-gray-200 rounded-lg text-center text-xl font-bold text-gray-900"
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                editable={!loading}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Resend Code */}
          <View className="flex-row justify-center mb-8">
            <Text className="text-sm text-gray-500">
              Didn't get the code?{' '}
            </Text>
            <TouchableOpacity 
              onPress={handleResend}
              disabled={!canResend || resending}
            >
              {resending ? (
                <ActivityIndicator size="small" color="#EC4899" />
              ) : (
                <Text className={`text-sm font-medium ${canResend ? 'text-pink-500' : 'text-gray-400'}`}>
                  {canResend ? 'Resend Code' : `Resend in ${countdown}s`}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Verify Button */}
          <TouchableOpacity 
            className={`py-4 rounded-lg ${loading ? 'bg-pink-300' : 'bg-pink-500'}`}
            onPress={handleVerify}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold text-center">
                Verify
              </Text>
            )}
          </TouchableOpacity>

          {/* Back to Register */}
          <TouchableOpacity 
            className="mt-6"
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text className="text-sm text-gray-500 text-center">
              Wrong email? <Text className="text-pink-500 font-medium">Go back</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OTPVerificationScreen;