import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native';
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
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);

  // Load Nigerian banks (async from Paystack or fallback)
  useEffect(() => {
    const loadBanks = async () => {
      const banksList = await getNigerianBanks();
      setBanks(banksList);
    };
    loadBanks();
  }, []);

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

      // Small delay to show toast, then go to dashboard
      setTimeout(() => {
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'VendorMain' }],
        });
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
              setShowBankPicker(true);
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
            onPress={() => setShowSkipModal(true)}
            disabled={loading}
          >
            <Text className="text-sm text-gray-500 text-center">
              I'll add this later
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Bank Picker Modal */}
      <Modal visible={showBankPicker} transparent animationType="slide" onRequestClose={() => setShowBankPicker(false)}>
        <TouchableOpacity className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setShowBankPicker(false)}>
          <View className="mt-auto bg-white rounded-t-2xl max-h-[70%]">
            <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-900">Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView className="px-6 py-2">
              {banks.map((bank) => (
                <TouchableOpacity
                  key={bank.code}
                  className="py-3.5 border-b border-gray-50"
                  onPress={() => {
                    handleBankSelection(bank);
                    setShowBankPicker(false);
                  }}
                >
                  <Text className={`text-base ${bankName === bank.name ? 'text-pink-500 font-semibold' : 'text-gray-700'}`}>
                    {bank.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Skip Payment Modal */}
      <Modal visible={showSkipModal} transparent animationType="fade" onRequestClose={() => setShowSkipModal(false)}>
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white rounded-2xl mx-6 p-6 w-[85%] max-w-[340px]">
            <View className="items-center mb-4">
              <View className="w-14 h-14 rounded-full bg-yellow-50 justify-center items-center mb-3">
                <Icon name="time-outline" size={28} color="#F59E0B" />
              </View>
              <Text className="text-lg font-bold text-gray-900 text-center mb-2">Skip Payment Setup?</Text>
              <Text className="text-sm text-gray-500 text-center leading-5">
                You can add payment information later from your profile. You won't be able to receive payments until this is completed.
              </Text>
            </View>
            <TouchableOpacity
              className="bg-pink-500 py-3.5 rounded-xl mb-3"
              onPress={() => {
                setShowSkipModal(false);
                (navigation as any).reset({
                  index: 0,
                  routes: [{ name: 'VendorMain' }],
                });
              }}
            >
              <Text className="text-white text-base font-semibold text-center">Skip for Now</Text>
            </TouchableOpacity>
            <TouchableOpacity className="py-3" onPress={() => setShowSkipModal(false)}>
              <Text className="text-gray-400 text-sm font-medium text-center">Continue Setup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};

export default PaymentSetupScreen;