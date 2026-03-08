import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface SignInModalProps {
  visible: boolean;
  onClose: () => void;
  onSignIn: () => void;
  message: string;
}

const SignInModal = ({ visible, onClose, onSignIn, message }: SignInModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View className="bg-white rounded-2xl mx-6 p-6 w-[85%] max-w-[340px]">
          <View className="items-center mb-4">
            <View className="w-14 h-14 rounded-full bg-pink-50 justify-center items-center mb-3">
              <Icon name="lock-closed-outline" size={28} color="#CC3366" />
            </View>
            <Text className="text-lg font-bold text-gray-900 text-center mb-2">
              Sign In Required
            </Text>
            <Text className="text-sm text-gray-500 text-center leading-5">
              {message}
            </Text>
          </View>
          <TouchableOpacity
            className="bg-pink-500 py-3.5 rounded-xl mb-3"
            onPress={onSignIn}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-semibold text-center">
              Sign In / Create Account
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="py-3"
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text className="text-gray-400 text-sm font-medium text-center">
              Not now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SignInModal;
