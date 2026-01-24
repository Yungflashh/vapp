import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Custom toast configurations
export const toastConfig = {
  success: ({ text1, text2 }: any) => (
    <View className="bg-white mx-4 px-4 py-3 rounded-lg flex-row items-center shadow-lg border-l-4 border-green-500">
      <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
        <Icon name="checkmark-circle" size={24} color="#10B981" />
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-semibold text-base mb-1">
          {text1}
        </Text>
        {text2 ? (
          <Text className="text-gray-500 text-sm">
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),
  
  error: ({ text1, text2 }: any) => (
    <View className="bg-white mx-4 px-4 py-3 rounded-lg flex-row items-center shadow-lg border-l-4 border-red-500">
      <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-3">
        <Icon name="close-circle" size={24} color="#EF4444" />
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-semibold text-base mb-1">
          {text1}
        </Text>
        {text2 ? (
          <Text className="text-gray-500 text-sm">
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),
  
  info: ({ text1, text2 }: any) => (
    <View className="bg-white mx-4 px-4 py-3 rounded-lg flex-row items-center shadow-lg border-l-4 border-blue-500">
      <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
        <Icon name="information-circle" size={24} color="#3B82F6" />
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-semibold text-base mb-1">
          {text1}
        </Text>
        {text2 ? (
          <Text className="text-gray-500 text-sm">
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),
  
  warning: ({ text1, text2 }: any) => (
    <View className="bg-white mx-4 px-4 py-3 rounded-lg flex-row items-center shadow-lg border-l-4 border-yellow-500">
      <View className="w-10 h-10 bg-yellow-100 rounded-full items-center justify-center mr-3">
        <Icon name="warning" size={24} color="#F59E0B" />
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-semibold text-base mb-1">
          {text1}
        </Text>
        {text2 ? (
          <Text className="text-gray-500 text-sm">
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),
};