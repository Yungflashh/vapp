import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { login as authLogin } from '@/services/auth.service';
import { getMyVendorProfile } from '@/services/vendor.service';
import { appleLogin } from '@/services/Oauth.service';
import { useAuth } from '@/context/AuthContext';
import * as AppleAuthentication from 'expo-apple-authentication';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const { login } = useAuth();

  // Check if Apple Sign In is available
  useEffect(() => {
    const checkAppleAuth = async () => {
      const available = await AppleAuthentication.isAvailableAsync();
      setIsAppleAvailable(available);
    };
    
    if (Platform.OS === 'ios') {
      checkAppleAuth();
    }
  }, []);

  const checkVendorSetupStatus = async (userRole: string) => {
    if (userRole !== 'vendor') {
      return true;
    }

    try {
      const response = await getMyVendorProfile();
      
      if (response.success && response.data.vendorProfile) {
        const profile = response.data.vendorProfile;
        
        const hasBusinessInfo = !!(
          profile.businessName &&
          profile.businessDescription &&
          profile.businessAddress?.street &&
          profile.businessAddress?.city &&
          profile.businessAddress?.state &&
          profile.businessPhone &&
          profile.businessEmail
        );
        
        const hasPayoutDetails = !!(
          profile.payoutDetails?.bankName &&
          profile.payoutDetails?.accountNumber &&
          profile.payoutDetails?.accountName &&
          profile.payoutDetails?.bankCode
        );
        
        return hasBusinessInfo && hasPayoutDetails;
      }
      
      return false;
    } catch (error: any) {
      // It's better to log this error to a proper monitoring service
      return false;
    }
  };

  const handleLogin = async () => {
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
      const response = await authLogin({ email, password });
      
      if (response.success) {
        const user = response.data.user;
        
        Toast.show({
          type: 'success',
          text1: 'Welcome back!',
          text2: `${user.firstName} ${user.lastName}`,
        });
        
        const isVendorSetupComplete = await checkVendorSetupStatus(user.role);
        
        if (user.role === 'vendor' && !isVendorSetupComplete) {
          Toast.show({
            type: 'info',
            text1: 'Complete Your Setup',
            text2: 'Please complete your vendor profile to continue',
            visibilityTime: 4000,
          });
          
          setTimeout(() => {
            login();
          }, 1000);
        } else {
          setTimeout(() => {
            login();
          }, 500);
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: response.message || 'Unable to login',
        });
      }
    } catch (error: any) {
      if (error.response) {
        const message = error.response.data?.message || 'Invalid credentials';
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
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

  const handleAppleLogin = async () => {
    setIsLoading(true);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      const response = await appleLogin({
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode || undefined,
        user: {
          givenName: credential.fullName?.givenName || undefined,
          familyName: credential.fullName?.familyName || undefined,
          email: credential.email || undefined,
        },
        role: 'customer',
      });
      
      if (response.success) {
        const user = response.data.user;
        
        Toast.show({
          type: 'success',
          text1: 'Welcome!',
          text2: `${user.firstName} ${user.lastName}`,
        });
        
        const isVendorSetupComplete = await checkVendorSetupStatus(user.role);
        
        if (user.role === 'vendor' && !isVendorSetupComplete) {
          Toast.show({
            type: 'info',
            text1: 'Complete Your Setup',
            text2: 'Please complete your vendor profile to continue',
            visibilityTime: 4000,
          });
          
          setTimeout(() => {
            login();
          }, 1000);
        } else {
          setTimeout(() => {
            login();
          }, 500);
        }
      }
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        Toast.show({
          type: 'info',
          text1: 'Sign In Canceled',
          text2: 'You canceled the sign in process',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Apple Login Failed',
          text2: error.response?.data?.message || 'Unable to login with Apple',
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
          <Text className="text-2xl font-bold text-pink-500 mb-2 mt-8">
            Welcome back
          </Text>
          <Text className="text-sm text-gray-500 leading-5 mb-8">
            Access your store, track orders, and keep your business running smoothly.
          </Text>

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
              editable={!isLoading}
            />
          </View>

          <View className="flex-row items-center border border-gray-200 rounded-lg px-4 py-3 mb-4">
            <Icon name="lock-closed-outline" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Icon 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#9CA3AF" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            className="items-end mb-6" 
            disabled={isLoading}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text className="text-sm text-gray-500">Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className={`py-4 rounded-lg mb-6 ${isLoading ? 'bg-pink-300' : 'bg-pink-500'}`}
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

          {Platform.OS === 'ios' && isAppleAvailable && (
            <>
              <View className="flex-row items-center mb-6">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="text-sm text-gray-400 mx-4">or sign in with</Text>
                <View className="flex-1 h-px bg-gray-200" />
              </View>

              <TouchableOpacity 
                className="flex-row items-center justify-center border border-gray-200 rounded-lg py-3 mb-6"
                activeOpacity={0.8}
                disabled={isLoading}
                onPress={handleAppleLogin}
              >
                <Icon name="logo-apple" size={20} color="#000000" />
                <Text className="text-base text-gray-900 font-medium ml-3">
                  Sign in with Apple
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View className="flex-row justify-center mt-6 mb-6">
            <Text className="text-sm text-gray-500">Don't have an account? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}
            >
              <Text className="text-sm text-pink-500 font-semibold">Sign up</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-gray-400 text-center leading-[18px] px-4 pb-6">
            By continuing, I agree to the{' '}
            <Text className="text-pink-500">Vendorspot General Terms of Use</Text> &{' '}
            <Text className="text-pink-500">General Privacy Policy</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <Toast />
    </SafeAreaView>
  );
};

export default LoginScreen;