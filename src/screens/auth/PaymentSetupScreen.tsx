import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import Icon from 'react-native-vector-icons/Ionicons';

type PaymentSetupScreenProps = NativeStackScreenProps<AuthStackParamList, 'PaymentSetup'>;

const PaymentSetupScreen = ({ navigation }: PaymentSetupScreenProps) => {
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');

  const handleSubmit = () => {
    // Navigate to success screen
    navigation.navigate('RegistrationSuccess');
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

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">
            Vendor Setup
          </Text>
          <Text className="text-2xl font-bold text-pink-500 text-center mb-2">
            Let`s get you in
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Provide us your bank details for payment
          </Text>

          {/* Account Name */}
          <Text className="text-sm text-gray-700 mb-2">Account Name</Text>
          <TextInput
            className="border border-gray-200 rounded-lg px-4 py-3 mb-4 text-base text-gray-900"
            placeholder="Enter account name"
            placeholderTextColor="#9CA3AF"
            value={accountName}
            onChangeText={setAccountName}
          />

          {/* Account Number */}
          <Text className="text-sm text-gray-700 mb-2">Account Number</Text>
          <TextInput
            className="border border-gray-200 rounded-lg px-4 py-3 mb-4 text-base text-gray-900"
            placeholder="Enter account number"
            placeholderTextColor="#9CA3AF"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="number-pad"
          />

          {/* Bank Name */}
          <Text className="text-sm text-gray-700 mb-2">Bank Name</Text>
          <View className="border border-gray-200 rounded-lg px-4 py-3 mb-4 flex-row justify-between items-center">
            <Text className="text-base text-gray-400">Select Bank</Text>
            <Icon name="chevron-down" size={20} color="#9CA3AF" />
          </View>

          {/* Business Phone Number */}
          <Text className="text-sm text-gray-700 mb-2">Business Phone Number</Text>
          <TextInput
            className="border border-gray-200 rounded-lg px-4 py-3 mb-4 text-base text-gray-900"
            placeholder="Enter business phone"
            placeholderTextColor="#9CA3AF"
            value={businessPhone}
            onChangeText={setBusinessPhone}
            keyboardType="phone-pad"
          />

          {/* Website/Social Media Link */}
          <Text className="text-sm text-gray-700 mb-2">
            Website / Social Media Link (Optional)
          </Text>
          <TextInput
            className="border border-gray-200 rounded-lg px-4 py-3 mb-6 text-base text-gray-900"
            placeholder="Enter link"
            placeholderTextColor="#9CA3AF"
            value={websiteLink}
            onChangeText={setWebsiteLink}
            keyboardType="url"
            autoCapitalize="none"
          />

          {/* Submit Button */}
          <TouchableOpacity 
            className="bg-pink-500 py-4 rounded-lg mb-6"
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-semibold text-center">
              Submit
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PaymentSetupScreen;