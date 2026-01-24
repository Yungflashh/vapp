import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import Icon from 'react-native-vector-icons/Ionicons';

type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const [isVendor, setIsVendor] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hearAbout, setHearAbout] = useState('');

  const handleRegister = () => {
    // Navigate to OTP verification
    navigation.navigate('OTPVerification', { email });
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
            className="w-10 h-10 justify-center mb-4"
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          {/* Profile Image Placeholder */}
          <View className="items-end mb-4">
            <View className="w-16 h-16 rounded-full bg-gray-100 justify-center items-center">
              <Icon name="person" size={32} color="#9CA3AF" />
            </View>
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-pink-500 mb-2">
            Create Your Storefront
          </Text>
          <Text className="text-sm text-gray-500 mb-6">
            Join a trusted marketplace for buyers, sellers, affiliates, and creators.
          </Text>

          {/* Toggle: Vendor / Customer */}
          <View className="flex-row mb-6 border-b border-gray-200">
            <TouchableOpacity 
              className={`flex-1 pb-3 ${isVendor ? 'border-b-2 border-pink-500' : ''}`}
              onPress={() => setIsVendor(true)}
            >
              <Text className={`text-center font-medium ${isVendor ? 'text-pink-500' : 'text-gray-400'}`}>
                I`m a vendor
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className={`flex-1 pb-3 ${!isVendor ? 'border-b-2 border-pink-500' : ''}`}
              onPress={() => setIsVendor(false)}
            >
              <Text className={`text-center font-medium ${!isVendor ? 'text-pink-500' : 'text-gray-400'}`}>
                Sign up as customer
              </Text>
            </TouchableOpacity>
          </View>

          {/* Full Name Input */}
          <View className="flex-row items-center border border-gray-200 rounded-lg px-4 py-3 mb-4">
            <Icon name="person-outline" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="Full Name"
              placeholderTextColor="#9CA3AF"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

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

          {/* Phone Number Input */}
          <View className="flex-row items-center border border-gray-200 rounded-lg px-4 py-3 mb-4">
            <Icon name="call-outline" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="Phone Number"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
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

          {/* Password Strength */}
          <Text className="text-xs text-gray-400 mb-6">
            Password strength: Weak
          </Text>

          {/* How did you hear about us */}
          <View className="border border-gray-200 rounded-lg px-4 py-3 mb-6">
            <Text className="text-sm text-gray-400 mb-2">
              How did you hear about Vendorspot?
            </Text>
            <TextInput
              className="text-base text-gray-900"
              placeholder="Select option"
              placeholderTextColor="#9CA3AF"
              value={hearAbout}
              onChangeText={setHearAbout}
            />
          </View>

          {/* Create Account Button */}
          <TouchableOpacity 
            className="bg-pink-500 py-4 rounded-lg mb-6"
            onPress={handleRegister}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-semibold text-center">
              Create account
            </Text>
          </TouchableOpacity>

          {/* Terms and Conditions */}
          <Text className="text-xs text-gray-400 text-center leading-5 mb-6">
            By continuing, I agree to the{' '}
            <Text className="text-pink-500">Vendorspot General Terms of Use</Text> &{' '}
            <Text className="text-pink-500">General Privacy Policy</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;