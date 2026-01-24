import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '@/context/AuthContext';

type RegistrationSuccessScreenProps = NativeStackScreenProps<AuthStackParamList, 'RegistrationSuccess'>;

const RegistrationSuccessScreen = ({ navigation }: RegistrationSuccessScreenProps) => {
  const { login } = useAuth();

  const handleSignIn = () => {
    // Log the user in and navigate to main app
    login();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-10 pb-10 justify-center items-center">
        {/* Vendorspot Logo */}
        <Text className="text-3xl font-bold mb-12">
          <Text className="text-pink-500">V</Text>
          <Text className="text-gray-900">endorspot</Text>
        </Text>

        {/* Success Icon */}
        <View className="w-32 h-32 rounded-full bg-green-100 justify-center items-center mb-8">
          <View className="w-24 h-24 rounded-full bg-green-500 justify-center items-center">
            <Icon name="checkmark" size={48} color="#FFFFFF" />
          </View>
        </View>

        {/* Success Message */}
        <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
          Congratulations!
        </Text>
        <Text className="text-base text-gray-500 text-center mb-2">
          Your store is under review.
        </Text>
        <Text className="text-sm text-gray-400 text-center mb-12">
          Store review normally take 30mins-1hr
        </Text>

        {/* Sign In Button */}
        <TouchableOpacity 
          className="bg-pink-500 py-4 rounded-lg w-full"
          onPress={handleSignIn}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-semibold text-center">
            Sign in
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default RegistrationSuccessScreen;