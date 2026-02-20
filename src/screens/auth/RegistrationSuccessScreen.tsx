import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import Icon from 'react-native-vector-icons/Ionicons';

type RegistrationSuccessScreenProps = NativeStackScreenProps<AuthStackParamList, 'RegistrationSuccess'>;

const RegistrationSuccessScreen = ({ navigation }: RegistrationSuccessScreenProps) => {
  // Optional: Auto-navigate after 3 seconds
  useEffect(() => {
    // Uncomment to enable auto-navigation
    // const timer = setTimeout(() => {
    //   handleContinue();
    // }, 3000);
    // return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    // Check if we're in the auth flow or app flow
    // If user is authenticated, they're in app flow
    // Reset to appropriate main screen
    try {
      // Try to navigate to VendorMain (if vendor with complete profile)
      navigation.reset({
        index: 0,
        routes: [{ name: 'VendorMain' as any }],
      });
    } catch (error) {
      // If that fails, try Main (customer) or fall back to Login
      try {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' as any }],
        });
      } catch (e) {
        // Last resort - go to login
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' as any }],
        });
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-center items-center">
        {/* Success Icon */}
        <View className="mb-8">
          <View className="w-32 h-32 rounded-full bg-green-100 justify-center items-center">
            <View className="w-24 h-24 rounded-full bg-green-200 justify-center items-center">
              <Icon name="checkmark-circle" size={80} color="#10B981" />
            </View>
          </View>
        </View>

        {/* Success Message */}
        <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
          Congratulations! 🎉
        </Text>
        <Text className="text-xl font-semibold text-pink-500 text-center mb-4">
          Registration Successful
        </Text>
        <Text className="text-base text-gray-600 text-center mb-8 px-4">
          Your vendor account has been successfully created! You can now start selling your products on Vendorspot.
        </Text>

        {/* Feature Highlights */}
        <View className="w-full mb-8">
          <FeatureItem 
            icon="storefront-outline"
            title="Your Shop is Ready"
            description="Start adding products to your storefront"
          />
          <FeatureItem 
            icon="wallet-outline"
            title="Payment Setup Complete"
            description="Receive payments directly to your account"
          />
          <FeatureItem 
            icon="people-outline"
            title="Reach Customers"
            description="Connect with thousands of buyers"
          />
        </View>

        {/* Continue Button */}
        <TouchableOpacity 
          className="bg-pink-500 py-4 px-8 rounded-lg w-full"
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-semibold text-center">
            Continue to Login
          </Text>
        </TouchableOpacity>

        {/* Help Text */}
        <Text className="text-sm text-gray-400 text-center mt-6">
          Ready to start your journey? Login to access your dashboard
        </Text>
      </View>
    </SafeAreaView>
  );
};

// Feature Item Component
const FeatureItem = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <View className="flex-row items-center mb-4">
    <View className="w-12 h-12 rounded-full bg-pink-100 justify-center items-center mr-4">
      <Icon name={icon} size={24} color="#EC4899" />
    </View>
    <View className="flex-1">
      <Text className="text-base font-semibold text-gray-900">{title}</Text>
      <Text className="text-sm text-gray-600">{description}</Text>
    </View>
    <Icon name="checkmark-circle" size={24} color="#10B981" />
  </View>
);

export default RegistrationSuccessScreen;