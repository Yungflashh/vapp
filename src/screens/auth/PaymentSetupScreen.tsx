import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { updatePayoutDetails, getNigerianBanks } from '@/services/vendor.service';

type PaymentSetupScreenProps = NativeStackScreenProps<AuthStackParamList, 'PaymentSetup'>;

const PaymentSetupScreen = ({ navigation }: PaymentSetupScreenProps) => {
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Get Nigerian banks with codes
  const banks = getNigerianBanks();

  const validateForm = (): boolean => {
    if (!accountName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter account name',
      });
      return false;
    }

    if (!accountNumber.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter account number',
      });
      return false;
    }

    // Validate account number (usually 10 digits in Nigeria)
    if (!/^\d{10}$/.test(accountNumber)) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Account number must be 10 digits',
      });
      return false;
    }

    if (!bankName || !bankCode) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select your bank',
      });
      return false;
    }

    return true;
  };

  const handleBankSelection = (bank: typeof banks[0]) => {
    setBankName(bank.name);
    setBankCode(bank.code);
    console.log('Bank selected:', bank);
  };

  const handleContinue = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payoutData = {
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        bankName,
        bankCode,
      };

      console.log('💳 Updating payout details:', payoutData);

      // Call the payout details update API (correct endpoint)
      const response = await updatePayoutDetails(payoutData);

      console.log('✅ Payout details updated:', response.data);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Payment information saved successfully!',
      });

      // Small delay to show toast
      setTimeout(() => {
        // Navigate to registration success screen
        navigation.navigate('RegistrationSuccess');
      }, 1000);
    } catch (error: any) {
      console.error('❌ Payment setup error:', error);

      let errorMessage = 'Failed to save payment information. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Toast.show({
        type: 'error',
        text1: 'Setup Failed',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
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
          {/* Back Button */}
          <TouchableOpacity 
            className="w-10 h-10 justify-center mb-4"
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">
            Payment Setup
          </Text>
          <Text className="text-2xl font-bold text-pink-500 text-center mb-2">
            Last Step!
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Add your payment information to receive funds
          </Text>

          {/* Bank Name */}
          <Text className="text-sm text-gray-700 mb-2">
            Bank Name <Text className="text-red-500">*</Text>
          </Text>
          <TouchableOpacity
            className="border border-gray-200 rounded-lg px-4 py-3 mb-4 flex-row justify-between items-center"
            onPress={() => {
              if (loading) return;
              // Show bank picker
              Alert.alert(
                'Select Bank',
                'Choose your bank',
                [
                  ...banks.map((bank) => ({
                    text: bank.name,
                    onPress: () => handleBankSelection(bank),
                  })),
                  { text: 'Cancel', style: 'cancel' },
                ],
                { cancelable: true }
              );
            }}
            disabled={loading}
          >
            <Text className={`text-base ${bankName ? 'text-gray-900' : 'text-gray-400'}`}>
              {bankName || 'Select Bank'}
            </Text>
            <Icon name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Show bank code for verification */}
          {bankCode && (
            <Text className="text-xs text-gray-500 -mt-2 mb-4 ml-1">
              Bank Code: {bankCode}
            </Text>
          )}

          {/* Account Number */}
          <Text className="text-sm text-gray-700 mb-2">
            Account Number <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="border border-gray-200 rounded-lg px-4 py-3 mb-4 text-base text-gray-900"
            placeholder="10-digit account number"
            placeholderTextColor="#9CA3AF"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="number-pad"
            maxLength={10}
            editable={!loading}
          />

          {/* Account Name */}
          <Text className="text-sm text-gray-700 mb-2">
            Account Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="border border-gray-200 rounded-lg px-4 py-3 mb-6 text-base text-gray-900"
            placeholder="Enter account name"
            placeholderTextColor="#9CA3AF"
            value={accountName}
            onChangeText={setAccountName}
            editable={!loading}
            autoCapitalize="words"
          />

          {/* Info Box */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <View className="flex-row">
              <Icon name="information-circle" size={20} color="#3B82F6" />
              <Text className="flex-1 ml-2 text-sm text-gray-700">
                Your payment information is encrypted and secure. You'll receive payments directly to this account when customers purchase from your shop.
              </Text>
            </View>
          </View>

          {/* Complete Setup Button */}
          <TouchableOpacity 
            className={`py-4 rounded-lg mb-4 ${loading ? 'bg-pink-300' : 'bg-pink-500'}`}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold text-center">
                Complete Setup
              </Text>
            )}
          </TouchableOpacity>

          {/* Skip Button (Optional) */}
          <TouchableOpacity 
            className="mb-6"
            onPress={() => {
              Alert.alert(
                'Skip Payment Setup',
                'You can add payment information later from your profile. Note: You won\'t be able to receive payments until this is completed.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Skip',
                    onPress: () => {
                      navigation.navigate('RegistrationSuccess');
                    },
                  },
                ]
              );
            }}
            disabled={loading}
          >
            <Text className="text-sm text-gray-500 text-center">
              I'll add this later
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Toast */}
      <Toast />
    </SafeAreaView>
  );
};

export default PaymentSetupScreen;