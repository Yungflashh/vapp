import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';

type SplashScreen1Props = NativeStackScreenProps<AuthStackParamList, 'Splash1'>;

const SplashScreen1 = ({ navigation }: SplashScreen1Props) => {
  return (
    <SafeAreaView className="flex-1 bg-white">
    <View className="flex-1 px-6 pt-4 pb-10">
     

      {/* Illustration Container */}
      <View className="flex-1 justify-center items-center mb-8">
        <View className="w-full aspect-square bg-gray-50 rounded-xl justify-center items-center">
          {/* Replace with your actual illustration */}
          <Text className="text-sm text-gray-400 text-center px-4">
            Add your welcome illustration here
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
        Welcome to Vendorspot
      </Text>

      {/* Description */}
      <Text className="text-sm text-gray-500 text-center leading-5 mb-8 px-4">
        Nigeria's most trusted marketplace where verified vendors meet ready buyers. Shop, sell, earn, and deliver with confidence.
      </Text>

      {/* Pagination Dots */}
      <View className="flex-row justify-center items-center mb-8 gap-2">
        <View className="w-6 h-2 rounded-full bg-pink-500" />
        <View className="w-2 h-2 rounded-full bg-gray-200" />
        <View className="w-2 h-2 rounded-full bg-gray-200" />
      </View>

      {/* Sign In Button */}
      <TouchableOpacity
        className="bg-pink-500 py-4 rounded-lg mb-4"
        onPress={() => navigation.navigate('Splash2')}
        activeOpacity={0.8}
      >
        <Text className="text-white text-base font-semibold text-center">
          Sign In
        </Text>
      </TouchableOpacity>

      {/* Create Account Link */}
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text className="text-pink-500 text-sm font-medium text-center">
          Create account
        </Text>
      </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
};

export default SplashScreen1;