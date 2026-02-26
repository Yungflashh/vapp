import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, ActivityIndicator, useWindowDimensions, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { forgotPassword } from '@/services/auth.service';

type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = ({ navigation }: ForgotPasswordScreenProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
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

  const handleSendResetLink = async () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please enter your email address',
      });
      return;
    }

    if (!email.includes('@')) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('📧 Requesting password reset for:', email);
      
      const response = await forgotPassword(email);
      
      console.log('✅ Password reset response:', response.data);
      
      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Reset Link Sent',
          text2: 'Check your email for the password reset link',
          visibilityTime: 4000,
        });
        
        setTimeout(() => {
          navigation.navigate('ResetPassword', { email });
        }, 1500);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Request Failed',
          text2: response.data.message || 'Unable to send reset link',
        });
      }
    } catch (error: any) {
      console.error('❌ Forgot password error:', error);
      
      if (error.response) {
        const message = error.response.data?.message || 'Unable to send reset link';
        Toast.show({
          type: 'error',
          text1: 'Request Failed',
          text2: message,
        });
      } else if (error.request) {
        Toast.show({
          type: 'error',
          text1: 'Network Error',
          text2: 'Unable to connect to server. Please check your connection.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'An unexpected error occurred. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
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
          paddingVertical: 16,
          paddingBottom: keyboardHeight > 0 ? keyboardHeight : 16,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Responsive centered container */}
        <View style={{ width: '100%', maxWidth: formMaxWidth }}>
          {/* Back Button */}
          <TouchableOpacity 
            className="flex-row items-center mb-8 mt-4"
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Icon name="arrow-back" size={24} color="#EC4899" />
            <Text className="text-pink-500 text-base font-medium ml-2">Back to Sign in</Text>
          </TouchableOpacity>

          {/* Header */}
          <Text className="text-2xl font-bold text-pink-500 mb-2">
            Reset your password
          </Text>
          <Text className="text-sm text-gray-500 leading-5 mb-8">
            Enter your email and we'll send you a reset link.
          </Text>

          {/* Email Input */}
          <View className="flex-row items-center border border-gray-200 rounded-lg px-4 py-3 mb-6">
            <Icon name="mail-outline" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>

          {/* Send Reset Link Button */}
          <TouchableOpacity 
            className={`py-4 rounded-lg mb-6 ${isLoading ? 'bg-pink-300' : 'bg-pink-500'}`}
            onPress={handleSendResetLink}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold text-center">
                Resend Link
              </Text>
            )}
          </TouchableOpacity>

          {/* Helper Text */}
          <View className="bg-pink-50 rounded-lg p-4 mb-6">
            <View className="flex-row items-start">
              <Icon name="information-circle-outline" size={20} color="#EC4899" />
              <View className="flex-1 ml-3">
                <Text className="text-sm text-gray-700 leading-5">
                  We'll send you an email with a secure link to reset your password. 
                  The link will expire in 1 hour for security purposes.
                </Text>
              </View>
            </View>
          </View>

          {/* Additional Help */}
          <View className="items-center mt-4">
            <Text className="text-xs text-gray-400 text-center leading-[18px]">
              Having trouble? Contact our support team at{' '}
              <Text className="text-pink-500">support@vendorspot.com</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <Toast />
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;