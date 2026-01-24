import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

// Import the full CategoriesScreen
export { default as CategoriesScreen } from '../screens/tabScreen/CategoriesScreen';



export const MessagesScreen = () => (
  <SafeAreaView className="flex-1 bg-white">
    <View className="flex-1 items-center justify-center">
      <Icon name="chatbubbles-outline" size={64} color="#EC4899" />
      <Text className="text-xl font-bold text-gray-900 mt-4">Messages</Text>
      <Text className="text-gray-500 mt-2">Chat with vendors</Text>
    </View>
  </SafeAreaView>
);

