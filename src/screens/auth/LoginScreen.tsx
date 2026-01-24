import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { login as apiLogin } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    // Validation
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all fields',
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
      console.log('🔐 Attempting login...');
      
      const response = await apiLogin({ email, password });
      
      console.log('✅ Login response:', response);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Welcome back!',
          text2: `${response.data.user.firstName} ${response.data.user.lastName}`,
        });
        
        // Small delay to show toast before navigating
        setTimeout(() => {
          login();
        }, 500);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: response.message || 'Unable to login',
        });
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // Handle different error types
      if (error.response) {
        // Server responded with error
        const message = error.response.data?.message || 'Invalid credentials';
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: message,
        });
      } else if (error.request) {
        // Network error
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
          {/* Welcome Text */}
          <Text className="text-2xl font-bold text-pink-500 mb-2 mt-8">
            Welcome back
          </Text>
          <Text className="text-sm text-gray-500 leading-5 mb-8">
            Access your store, track orders, and keep your business running smoothly.
          </Text>

          {/* Email Input */}
          <View className="flex-row items-center border border-gray-200 rounded-lg px-4 py-3 mb-4">
            <Icon name="mail-outline" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View className="flex-row items-center border border-gray-200 rounded-lg px-4 py-3 mb-4">
            <Icon name="lock-closed-outline" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#9CA3AF" 
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity className="items-end mb-6">
            <Text className="text-sm text-gray-500">Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity 
            className="bg-pink-500 py-4 rounded-lg mb-6"
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold text-center">
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="text-sm text-gray-400 mx-4">or sign in with</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity 
            className="flex-row items-center justify-center border border-gray-200 rounded-lg py-3 mb-3"
            activeOpacity={0.8}
          >
            <MaterialIcon name="google" size={20} color="#DB4437" />
            <Text className="text-base text-gray-900 font-medium ml-3">
              Sign in with Google
            </Text>
          </TouchableOpacity>

          {/* Apple Sign In Button */}
          <TouchableOpacity 
            className="flex-row items-center justify-center border border-gray-200 rounded-lg py-3 mb-6"
            activeOpacity={0.8}
          >
            <Icon name="logo-apple" size={20} color="#000000" />
            <Text className="text-base text-gray-900 font-medium ml-3">
              Sign in with Apple
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View className="flex-row justify-center mt-6 mb-6">
            <Text className="text-sm text-gray-500">Don`t have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text className="text-sm text-pink-500 font-semibold">Sign up</Text>
            </TouchableOpacity>
          </View>

          {/* Terms and Conditions */}
          <Text className="text-xs text-gray-400 text-center leading-[18px] px-4 pb-6">
            By continuing, I agree to the{' '}
            <Text className="text-pink-500">Vendorspot General Terms of Use</Text> &{' '}
            <Text className="text-pink-500">General Privacy Policy</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;