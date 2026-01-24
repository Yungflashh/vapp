import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';

type OTPVerificationScreenProps = NativeStackScreenProps<AuthStackParamList, 'OTPVerification'>;

const OTPVerificationScreen = ({ navigation, route }: OTPVerificationScreenProps) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    // Navigate to vendor setup
    navigation.navigate('VendorSetup');
  };

  const handleResend = () => {
    // Resend OTP logic
    console.log('Resend OTP');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text className="text-2xl font-bold text-pink-500 text-center mb-2">
          Enter Verification Code
        </Text>
        <Text className="text-sm text-gray-500 text-center mb-8">
          We just sent a 6-digit code to your email
        </Text>

        {/* OTP Input Boxes */}
        <View className="flex-row justify-center mb-6 gap-3">
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              className="w-12 h-14 border-2 border-gray-200 rounded-lg text-center text-xl font-bold text-gray-900"
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
            />
          ))}
        </View>

        {/* Resend Code */}
        <View className="flex-row justify-center mb-8">
          <Text className="text-sm text-gray-500">
            Didn`t get the code?{' '}
          </Text>
          <TouchableOpacity onPress={handleResend}>
            <Text className="text-sm text-pink-500 font-medium">
              Resend Code in 30s
            </Text>
          </TouchableOpacity>
        </View>

        {/* Verify Button */}
        <TouchableOpacity 
          className="bg-pink-500 py-4 rounded-lg"
          onPress={handleVerify}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-semibold text-center">
            Verify
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OTPVerificationScreen;