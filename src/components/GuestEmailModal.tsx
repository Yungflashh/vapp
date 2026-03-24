import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { guestRegister } from '@/services/auth.service';
import { useAuth } from '@/context/AuthContext';
import { syncGuestDataToBackend } from '@/services/guest-storage.service';

interface GuestEmailModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onGoToSignIn: () => void;
}

const GuestEmailModal = ({ visible, onClose, onSuccess, onGoToSignIn }: GuestEmailModalProps) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      Toast.show({ type: 'info', text1: 'Invalid Email', text2: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await guestRegister(trimmed);
      if (response.success) {
        // Sync local guest data (cart, wishlist, addresses) to backend
        await syncGuestDataToBackend();
        // Transition from guest to authenticated
        await login();
        Toast.show({ type: 'success', text1: 'Welcome!', text2: 'Processing your order...' });
        onSuccess();
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Something went wrong';
      if (msg.includes('already registered')) {
        Toast.show({ type: 'info', text1: 'Email Already Registered', text2: 'Please sign in to your existing account' });
        onClose();
        onGoToSignIn();
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: msg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="bg-white rounded-2xl mx-6 p-6 w-[85%] max-w-[340px]">
          <View className="items-center mb-4">
            <View className="w-14 h-14 rounded-full bg-pink-50 justify-center items-center mb-3">
              <Icon name="mail-outline" size={28} color="#CC3366" />
            </View>
            <Text className="text-lg font-bold text-gray-900 text-center mb-2">
              Enter Your Email
            </Text>
            <Text className="text-sm text-gray-500 text-center leading-5">
              Just your email to start shopping. You can complete your profile anytime later.
            </Text>
          </View>

          <TextInput
            className="bg-gray-50 rounded-xl px-4 py-3.5 text-base text-gray-900 border border-gray-200 mb-4"
            placeholder="your@email.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
          />

          <TouchableOpacity
            className="bg-pink-500 py-3.5 rounded-xl mb-3"
            onPress={handleContinue}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white text-base font-semibold text-center">
                Continue Shopping
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="py-2 mb-1"
            onPress={() => { onClose(); onGoToSignIn(); }}
            activeOpacity={0.8}
          >
            <Text className="text-pink-500 text-sm font-medium text-center">
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="py-2" onPress={onClose} activeOpacity={0.8}>
            <Text className="text-gray-400 text-sm font-medium text-center">
              Continue browsing
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default GuestEmailModal;
