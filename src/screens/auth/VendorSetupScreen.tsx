import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import Icon from 'react-native-vector-icons/Ionicons';

type VendorSetupScreenProps = NativeStackScreenProps<AuthStackParamList, 'VendorSetup'>;

const VendorSetupScreen = ({ navigation }: VendorSetupScreenProps) => {
  const [shopName, setShopName] = useState('');
  const [storeUrl, setStoreUrl] = useState('www.vendorspotng.com/');
  const [shopDescription, setShopDescription] = useState('');
  const [shopCategory, setShopCategory] = useState('');
  const [country, setCountry] = useState('Nigeria (Default)');

  const handleContinue = () => {
    // Navigate to payment setup
    navigation.navigate('PaymentSetup');
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
            You are almost done
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Tell us about your business
          </Text>

          {/* Shop Name */}
          <Text className="text-sm text-gray-700 mb-2">Shop Name</Text>
          <TextInput
            className="border border-gray-200 rounded-lg px-4 py-3 mb-4 text-base text-gray-900"
            placeholder="Enter shop name"
            placeholderTextColor="#9CA3AF"
            value={shopName}
            onChangeText={setShopName}
          />

          {/* Store URL */}
          <Text className="text-sm text-gray-700 mb-2">Store URL</Text>
          <View className="border border-gray-200 rounded-lg px-4 py-3 mb-4 bg-gray-50">
            <Text className="text-base text-gray-900">{storeUrl}</Text>
          </View>

          {/* Shop Description */}
          <Text className="text-sm text-gray-700 mb-2">
            Shop Description (Tell us what you sell)
          </Text>
          <TextInput
            className="border border-gray-200 rounded-lg px-4 py-3 mb-4 text-base text-gray-900"
            placeholder="Describe your shop"
            placeholderTextColor="#9CA3AF"
            value={shopDescription}
            onChangeText={setShopDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Shop Category */}
          <Text className="text-sm text-gray-700 mb-2">Shop Category</Text>
          <View className="border border-gray-200 rounded-lg px-4 py-3 mb-4 flex-row justify-between items-center">
            <Text className="text-base text-gray-400">Select Category</Text>
            <Icon name="chevron-down" size={20} color="#9CA3AF" />
          </View>

          {/* Country */}
          <Text className="text-sm text-gray-700 mb-2">Country</Text>
          <View className="border border-gray-200 rounded-lg px-4 py-3 mb-6 flex-row justify-between items-center">
            <Text className="text-base text-gray-900">{country}</Text>
            <Icon name="chevron-down" size={20} color="#9CA3AF" />
          </View>

          {/* Continue Button */}
          <TouchableOpacity 
            className="bg-pink-500 py-4 rounded-lg mb-6"
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-semibold text-center">
              Continue
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VendorSetupScreen;