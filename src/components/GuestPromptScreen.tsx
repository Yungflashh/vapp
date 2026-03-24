import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '@/context/AuthContext';

interface GuestPromptScreenProps {
  title: string;
  message: string;
  icon: string;
  subtitle?: string;
}

const GuestPromptScreen = ({ title, message, icon, subtitle }: GuestPromptScreenProps) => {
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
        <Text className="text-sm text-gray-500 text-center leading-5 mb-2">
          {message}
        </Text>
        {subtitle && (
          <Text className="text-xs text-gray-400 text-center leading-4 mb-6">
            {subtitle}
          </Text>
        )}
        {!subtitle && <View className="mb-6" />}
        <TouchableOpacity
          className="bg-pink-500 py-4 px-12 rounded-lg mb-4"
          onPress={exitGuestMode}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-semibold text-center">
            Create Account / Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export const GuestWishlistScreen = () => (
  <GuestPromptScreen
    title="Save Your Favorites"
    message="Create an account to save items to your wishlist and never lose track of products you love."
    subtitle="You can still browse and buy products without an account!"
    icon="heart-outline"
  />
);

export const GuestMessagesScreen = () => (
  <GuestPromptScreen
    title="Chat with Vendors"
    message="Create an account to message vendors directly and get quick responses about products."
    icon="chatbubbles-outline"
  />
);

export const GuestOrdersScreen = () => (
  <GuestPromptScreen
    title="Track Your Orders"
    message="Create an account to view your order history, track deliveries, and manage returns."
    subtitle="Sign in to see all your past and current orders in one place."
    icon="receipt-outline"
  />
);

export const GuestProfileScreen = () => (
  <GuestPromptScreen
    title="Complete Your Profile"
    message="Create an account to manage your profile, view order history, and unlock all features."
    subtitle="You can shop and checkout as a guest, but creating an account gives you the full experience."
    icon="person-outline"
  />
);

export default GuestPromptScreen;
