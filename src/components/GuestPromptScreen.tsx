import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '@/context/AuthContext';

interface GuestPromptScreenProps {
  title: string;
  message: string;
  icon: string;
}

const GuestPromptScreen = ({ title, message, icon }: GuestPromptScreenProps) => {
  const { exitGuestMode } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-8">
        <View className="w-20 h-20 rounded-full bg-pink-50 justify-center items-center mb-6">
          <Icon name={icon} size={40} color="#CC3366" />
        </View>
        <Text className="text-xl font-bold text-gray-900 text-center mb-3">
          {title}
        </Text>
        <Text className="text-sm text-gray-500 text-center leading-5 mb-8">
          {message}
        </Text>
        <TouchableOpacity
          className="bg-pink-500 py-4 px-12 rounded-lg mb-4"
          onPress={exitGuestMode}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-semibold text-center">
            Sign In / Create Account
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export const GuestWishlistScreen = () => (
  <GuestPromptScreen
    title="Save Your Favorites"
    message="Sign in to save items to your wishlist and never lose track of products you love."
    icon="heart-outline"
  />
);

export const GuestMessagesScreen = () => (
  <GuestPromptScreen
    title="Chat with Vendors"
    message="Sign in to message vendors directly and get quick responses about products."
    icon="chatbubbles-outline"
  />
);

export const GuestProfileScreen = () => (
  <GuestPromptScreen
    title="Your Profile"
    message="Sign in to manage your profile, track orders, and access all features."
    icon="person-outline"
  />
);

export default GuestPromptScreen;
