import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/index';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '@/context/AuthContext';

type RegistrationSuccessScreenProps = NativeStackScreenProps<RootStackParamList, 'RegistrationSuccess'>;

const RegistrationSuccessScreen = ({ navigation }: RegistrationSuccessScreenProps) => {
  const { refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    try {
      setIsLoading(true);
      console.log('🎉 Registration success - refreshing user data...');
      
      // Refresh user data - this triggers AppNavigator's useEffect
      await refreshUser();
      
      console.log('✅ User data refreshed, AppNavigator will re-render with VendorMain');
      
      // Small delay to allow AppNavigator to re-render
      setTimeout(() => {
        setIsLoading(false);
        // The AppNavigator will automatically show VendorMain now
      }, 500);
      
    } catch (error) {
      console.error('❌ Error during continue:', error);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-center">
        {/* Success Icon */}
        <View className="items-center mb-8">
          <View className="w-32 h-32 rounded-full bg-green-100 items-center justify-center mb-6">
            <Icon name="checkmark-circle" size={80} color="#10B981" />
          </View>

          {/* Success Message */}
          <Text className="text-3xl font-bold text-center text-gray-900 mb-3">
            Congratulations! 🎉
          </Text>
          <Text className="text-xl font-semibold text-center text-green-600 mb-4">
            Registration Successful
          </Text>
          <Text className="text-base text-center text-gray-600 px-4">
            Your vendor account has been successfully created! You can now start selling your products on Vendorspot.
          </Text>
        </View>

        {/* Feature Highlights */}
        <View className="space-y-4 mb-8">
          <FeatureItem
            icon="storefront-outline"
            title="Your Store is Ready"
            description="Start adding products and manage your inventory"
          />
          <FeatureItem
            icon="trending-up-outline"
            title="Track Your Sales"
            description="Monitor your performance with real-time analytics"
          />
          <FeatureItem
            icon="wallet-outline"
            title="Get Paid Securely"
            description="Receive payments directly to your bank account"
          />
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleContinue}
          className="bg-pink-500 rounded-xl py-4 items-center shadow-lg mb-4"
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-semibold">
              Go to Dashboard
            </Text>
          )}
        </TouchableOpacity>

        {/* Help Text */}
        <Text className="text-center text-gray-500 text-sm">
          Ready to start your journey? Access your vendor dashboard now
        </Text>
      </View>
    </SafeAreaView>
  );
};

// Feature Item Component
const FeatureItem = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: string; 
  title: string; 
  description: string 
}) => (
  <View className="flex-row items-start space-x-3 bg-gray-50 p-4 rounded-lg">
    <View className="w-10 h-10 rounded-full bg-pink-100 items-center justify-center mt-1">
      <Icon name={icon} size={20} color="#EC4899" />
    </View>
    <View className="flex-1">
      <Text className="text-base font-semibold text-gray-900 mb-1">
        {title}
      </Text>
      <Text className="text-sm text-gray-600">
        {description}
      </Text>
    </View>
  </View>
);

export default RegistrationSuccessScreen;