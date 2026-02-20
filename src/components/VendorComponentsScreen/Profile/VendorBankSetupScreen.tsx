// ============================================================
// VENDOR BANK ACCOUNT SETUP SCREEN
// File: screens/vendor/VendorBankSetupScreen.tsx
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getMyVendorProfile, updatePayoutDetails, getNigerianBanks } from '@/services/vendor.service';
import Toast from 'react-native-toast-message';

interface Bank {
  name: string;
  code: string;
}

const VendorBankSetupScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const banks = getNigerianBanks();
  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const response = await getMyVendorProfile();
      
      if (response.success) {
        const profile = response.data.vendorProfile;
        
        if (profile.payoutDetails) {
          setAccountName(profile.payoutDetails.accountName || '');
          setAccountNumber(profile.payoutDetails.accountNumber || '');
          
          if (profile.payoutDetails.bankCode) {
            const bank = banks.find(b => b.code === profile.payoutDetails.bankCode);
            if (bank) {
              setSelectedBank(bank);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateAccountNumber = (number: string) => {
    // Remove any non-digit characters
    const cleaned = number.replace(/\D/g, '');
    
    // Nigerian account numbers are typically 10 digits
    if (cleaned.length === 10) {
      return cleaned;
    }
    
    return number;
  };

  const handleAccountNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setAccountNumber(cleaned);
    }
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!accountName.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Please enter account name',
        });
        return;
      }

      if (!accountNumber || accountNumber.length !== 10) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Please enter a valid 10-digit account number',
        });
        return;
      }

      if (!selectedBank) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Please select your bank',
        });
        return;
      }

      setSaving(true);
      
      await updatePayoutDetails({
        accountName: accountName.trim(),
        accountNumber: accountNumber,
        bankName: selectedBank.name,
        bankCode: selectedBank.code,
      });
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Bank account details saved successfully',
      });
      
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: error.response?.data?.message || 'Failed to save bank details',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#EC4899" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View className="bg-white px-6 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
        >
          <Icon name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 flex-1">Bank Account Setup</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View className="mx-6 mt-6 bg-blue-50 rounded-2xl p-4">
          <View className="flex-row items-start">
            <Icon name="information-circle" size={20} color="#3B82F6" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-blue-900 mb-2">
                Secure Payment Details
              </Text>
              <Text className="text-xs text-blue-700 leading-5">
                Your bank account details are encrypted and secure. This account will be used to receive your earnings from sales.
              </Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View className="px-6 mt-6 pb-24">
          {/* Account Name */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Account Name</Text>
            <View
              className="bg-white rounded-xl px-4 py-3 flex-row items-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Icon name="person-outline" size={20} color="#9CA3AF" />
              <TextInput
                value={accountName}
                onChangeText={setAccountName}
                placeholder="Enter account name"
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 text-base text-gray-900"
                autoCapitalize="words"
              />
            </View>
            <Text className="text-xs text-gray-500 mt-1 ml-1">
              Must match the name on your bank account
            </Text>
          </View>

          {/* Account Number */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Account Number</Text>
            <View
              className="bg-white rounded-xl px-4 py-3 flex-row items-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Icon name="card-outline" size={20} color="#9CA3AF" />
              <TextInput
                value={accountNumber}
                onChangeText={handleAccountNumberChange}
                placeholder="0000000000"
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 text-base text-gray-900"
                keyboardType="number-pad"
                maxLength={10}
              />
              {accountNumber.length === 10 && (
                <Icon name="checkmark-circle" size={20} color="#10B981" />
              )}
            </View>
            <Text className="text-xs text-gray-500 mt-1 ml-1">
              {accountNumber.length}/10 digits
            </Text>
          </View>

          {/* Bank Selection */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Select Bank</Text>
            <TouchableOpacity
              onPress={() => setShowBankPicker(true)}
              className="bg-white rounded-xl px-4 py-3 flex-row items-center justify-between"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View className="flex-row items-center flex-1">
                <Icon name="business-outline" size={20} color="#9CA3AF" />
                <Text className={`ml-3 text-base ${selectedBank ? 'text-gray-900' : 'text-gray-400'}`}>
                  {selectedBank ? selectedBank.name : 'Choose your bank'}
                </Text>
              </View>
              <Icon name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Security Notice */}
          <View className="bg-green-50 rounded-2xl p-4 flex-row items-start">
            <Icon name="shield-checkmark" size={20} color="#10B981" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-green-900 mb-1">
                Secure & Encrypted
              </Text>
              <Text className="text-xs text-green-700 leading-5">
                All bank details are encrypted and stored securely. We never share your financial information.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white px-6 py-4 border-t border-gray-100">
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !accountName || !accountNumber || !selectedBank}
          className={`py-4 rounded-xl items-center ${
            !accountName || !accountNumber || !selectedBank ? 'bg-gray-300' : 'bg-pink-500'
          }`}
          style={{
            shadowColor: '#EC4899',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: !accountName || !accountNumber || !selectedBank ? 0 : 0.3,
            shadowRadius: 8,
            elevation: !accountName || !accountNumber || !selectedBank ? 0 : 5,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold text-base">Save Bank Details</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Bank Picker Modal */}
      <Modal
        visible={showBankPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBankPicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: '80%' }}>
            {/* Modal Header */}
            <View className="px-6 py-4 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-900">Select Your Bank</Text>
              <TouchableOpacity
                onPress={() => setShowBankPicker(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Icon name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="px-6 py-3 border-b border-gray-100">
              <View className="bg-gray-50 rounded-xl px-4 py-2 flex-row items-center">
                <Icon name="search" size={20} color="#9CA3AF" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search banks..."
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 ml-3 text-base text-gray-900"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Icon name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Bank List */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredBanks.map((bank) => (
                <TouchableOpacity
                  key={bank.code}
                  onPress={() => {
                    setSelectedBank(bank);
                    setShowBankPicker(false);
                    setSearchQuery('');
                  }}
                  className="px-6 py-4 border-b border-gray-50 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-full bg-pink-50 items-center justify-center">
                      <Icon name="business" size={18} color="#EC4899" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-base font-semibold text-gray-900">
                        {bank.name}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-0.5">
                        Code: {bank.code}
                      </Text>
                    </View>
                  </View>
                  
                  {selectedBank?.code === bank.code && (
                    <Icon name="checkmark-circle" size={24} color="#EC4899" />
                  )}
                </TouchableOpacity>
              ))}
              
              {filteredBanks.length === 0 && (
                <View className="py-12 items-center">
                  <Icon name="search-outline" size={48} color="#D1D5DB" />
                  <Text className="text-sm text-gray-500 mt-3">
                    No banks found matching "{searchQuery}"
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};

export default VendorBankSetupScreen;