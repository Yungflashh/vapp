import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import api from '@/services/api';

type ResetPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

const ResetPasswordScreen = ({ navigation, route }: ResetPasswordScreenProps) => {
  const { email } = route.params;
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    // Validation
    if (!resetCode || !newPassword || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all fields',
      });
      return;
    }

    if (resetCode.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Code',
        text2: 'Reset code must be 6 characters',
      });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Weak Password',
        text2: 'Password must be at least 6 characters',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Password Mismatch',
        text2: 'Passwords do not match',
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Sending reset password request...');
      console.log('📧 Email:', email);
      console.log('🔑 Code:', resetCode.toUpperCase());
      
      const response = await api.post('/auth/reset-password', {
        code: resetCode.toUpperCase().trim(),
        password: newPassword,
      });
      
      console.log('✅ Password reset response:', response.data);
      
      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Password Reset Successful! 🎉',
          text2: 'You can now log in with your new password',
          visibilityTime: 3000,
        });
        
        // Navigate to Login screen
        setTimeout(() => {
          navigation.navigate('Login');
        }, 1500);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Reset Failed',
          text2: response.data.message || 'Unable to reset password',
        });
      }
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      let errorTitle = 'Reset Failed';
      let errorMessage = 'An unexpected error occurred';
      
      if (error.response) {
        // Server responded with an error
        const serverMessage = error.response.data?.message;
        console.log('🔍 Server message:', serverMessage);
        
        if (serverMessage) {
          if (serverMessage.toLowerCase().includes('invalid') || 
              serverMessage.toLowerCase().includes('expired')) {
            errorTitle = 'Invalid Code';
            errorMessage = 'The reset code is invalid or has expired. Please request a new one.';
          } else if (serverMessage.toLowerCase().includes('required')) {
            errorTitle = 'Missing Fields';
            errorMessage = 'Please fill in all required fields';
          } else {
            errorMessage = serverMessage;
          }
        }
        
        Toast.show({
          type: 'error',
          text1: errorTitle,
          text2: errorMessage,
          visibilityTime: 5000,
        });
      } else if (error.request) {
        // Request made but no response
        Toast.show({
          type: 'error',
          text1: 'Network Error',
          text2: 'Unable to connect to server. Please check your internet connection.',
          visibilityTime: 5000,
        });
      } else {
        // Something else went wrong
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Something went wrong. Please try again.',
          visibilityTime: 5000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatResetCode = (text: string) => {
    // Convert to uppercase and limit to 6 characters
    return text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity 
            className="flex-row items-center mb-8 mt-4"
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Icon name="arrow-back" size={24} color="#EC4899" />
            <Text className="text-pink-500 text-base font-medium ml-2">Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <Text className="text-2xl font-bold text-pink-500 mb-2">
            Create new password
          </Text>
          <Text className="text-sm text-gray-500 leading-5 mb-2">
            Enter the 6-character reset code from your email and create a new password.
          </Text>
          <Text className="text-xs text-pink-500 mb-8">
            Sent to: {email}
          </Text>

          {/* Reset Code Input */}
          <View className="flex-row items-center border border-gray-200 rounded-lg px-4 py-3 mb-4">
            <Icon name="key-outline" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-900 tracking-wider font-semibold"
              placeholder="ABC123"
              placeholderTextColor="#9CA3AF"
              value={resetCode}
              onChangeText={(text) => setResetCode(formatResetCode(text))}
              autoCapitalize="characters"
              maxLength={6}
              editable={!isLoading}
            />
            {resetCode.length === 6 && (
              <Icon name="checkmark-circle" size={20} color="#10B981" />
            )}
          </View>

          {/* Code Format Helper */}
          <View className="bg-blue-50 rounded-lg p-3 mb-4">
            <View className="flex-row items-center">
              <Icon name="information-circle-outline" size={16} color="#3B82F6" />
              <Text className="text-xs text-blue-700 ml-2">
                Enter the 6-character code from your email (e.g., ABC123)
              </Text>
            </View>
          </View>

          {/* New Password Input */}
          <View className="flex-row items-center border border-gray-200 rounded-lg px-4 py-3 mb-4">
            <Icon name="lock-closed-outline" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="New Password"
              placeholderTextColor="#9CA3AF"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              editable={!isLoading}
            />
            <TouchableOpacity 
              onPress={() => setShowNewPassword(!showNewPassword)}
              disabled={isLoading}
            >
              <Icon 
                name={showNewPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#9CA3AF" 
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <View className="flex-row items-center border border-gray-200 rounded-lg px-4 py-3 mb-6">
            <Icon name="lock-closed-outline" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="Confirm Password"
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!isLoading}
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              <Icon 
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#9CA3AF" 
              />
            </TouchableOpacity>
          </View>

          {/* Password Requirements */}
          <View className="bg-pink-50 rounded-lg p-4 mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Password Requirements:
            </Text>
            <View className="flex-row items-start mb-1">
              <Icon 
                name={resetCode.length === 6 ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={resetCode.length === 6 ? "#10B981" : "#9CA3AF"} 
              />
              <Text className="text-xs text-gray-600 ml-2">
                Valid 6-character reset code
              </Text>
            </View>
            <View className="flex-row items-start mb-1">
              <Icon 
                name={newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={newPassword.length >= 6 ? "#10B981" : "#9CA3AF"} 
              />
              <Text className="text-xs text-gray-600 ml-2">
                At least 6 characters
              </Text>
            </View>
            <View className="flex-row items-start mb-1">
              <Icon 
                name={newPassword && confirmPassword && newPassword === confirmPassword ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={newPassword && confirmPassword && newPassword === confirmPassword ? "#10B981" : "#9CA3AF"} 
              />
              <Text className="text-xs text-gray-600 ml-2">
                Passwords match
              </Text>
            </View>
          </View>

          {/* Reset Password Button */}
          <TouchableOpacity 
            className={`py-4 rounded-lg mb-6 ${isLoading ? 'bg-pink-300' : 'bg-pink-500'}`}
            onPress={handleResetPassword}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold text-center">
                Reset Password
              </Text>
            )}
          </TouchableOpacity>

          {/* Helper Text */}
          <View className="items-center mt-4 mb-8">
            <Text className="text-xs text-gray-400 text-center leading-[18px]">
              Didn't receive the reset code?{' '}
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={isLoading}
            >
              <Text className="text-xs text-pink-500 font-semibold mt-1">
                Request a new one
              </Text>
            </TouchableOpacity>
            
            <View className="mt-4 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <View className="flex-row items-start">
                <Icon name="time-outline" size={16} color="#F59E0B" />
                <Text className="text-xs text-yellow-700 ml-2 flex-1">
                  Reset codes expire after 1 hour for security
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;