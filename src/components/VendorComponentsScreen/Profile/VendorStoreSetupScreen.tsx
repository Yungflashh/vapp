// ============================================================
// VENDOR STORE SETUP HUB SCREEN
// File: screens/vendor/VendorStoreSetupScreen.tsx
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getMyVendorProfile } from '@/services/api';
import Toast from 'react-native-toast-message';

interface SetupStatus {
  storefront: boolean;
  verification: boolean;
  bankAccount: boolean;
}

const VendorStoreSetupScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  const [loading, setLoading] = useState(true);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    storefront: false,
    verification: false,
    bankAccount: false,
  });

  useEffect(() => {
    fetchSetupStatus();
  }, []);

  const fetchSetupStatus = async () => {
    try {
      const response = await getMyVendorProfile();
      
      if (response.success) {
        const profile = response.data.vendorProfile;
        
        setSetupStatus({
          storefront: !!(profile.storefront?.theme || profile.storefront?.bannerImages?.length),
          verification: profile.verificationStatus === 'verified',
          bankAccount: !!profile.payoutDetails?.accountNumber,
        });
      }
    } catch (error) {
      console.error('Error fetching setup status:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupOptions = [
    {
      id: 'storefront',
      title: 'Storefront Customization',
      subtitle: 'Customize your store appearance',
      description: 'Add banners, choose theme, and personalize your store',
      icon: 'storefront-outline',
      iconBg: '#FEE2E2',
      iconColor: '#EF4444',
      completed: setupStatus.storefront,
      screen: 'VendorStorefrontSetup',
    },
    {
      id: 'verification',
      title: 'Apply for Verification',
      subtitle: 'Upload KYC documents',
      description: 'Get verified by uploading your business documents',
      icon: 'shield-checkmark-outline',
      iconBg: '#DBEAFE',
      iconColor: '#3B82F6',
      completed: setupStatus.verification,
      screen: 'VendorKYCVerification',
    },
    
    {
      id: 'bankAccount',
      title: 'Bank Account Setup',
      subtitle: 'Add payout details',
      description: 'Setup your bank account to receive payments',
      icon: 'card-outline',
      iconBg: '#D1FAE5',
      iconColor: '#10B981',
      completed: setupStatus.bankAccount,
      screen: 'VendorBankSetup',
    },
  ];

  const completedCount = Object.values(setupStatus).filter(Boolean).length;
  const totalCount = Object.values(setupStatus).length;
  const progress = (completedCount / totalCount) * 100;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#EC4899" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View className="bg-white px-6 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
        >
          <Icon name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 flex-1">Store Setup</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Progress Card */}
        <View className="mx-6 mt-6 mb-4">
          <View 
            className="bg-white rounded-3xl p-6"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-2xl font-bold text-gray-900">
                  {completedCount}/{totalCount}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">Setup Complete</Text>
              </View>
              
              <View className="w-20 h-20 rounded-full bg-pink-50 items-center justify-center">
                <Text className="text-2xl font-bold text-pink-500">
                  {Math.round(progress)}%
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <View 
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>
        </View>

        {/* Setup Options */}
        <View className="px-6 pb-24">
          <Text className="text-base font-bold text-gray-900 mb-4">
            Complete Your Store Setup
          </Text>

          {setupOptions.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => navigation.navigate(option.screen as never)}
              className="bg-white rounded-2xl p-5 mb-3"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {/* Header */}
              <View className="flex-row items-start mb-3">
                <View
                  className="w-14 h-14 rounded-xl items-center justify-center"
                  style={{ backgroundColor: option.iconBg }}
                >
                  <Icon name={option.icon} size={24} color={option.iconColor} />
                </View>

                <View className="flex-1 ml-4">
                  <View className="flex-row items-center">
                    <Text className="text-base font-bold text-gray-900 flex-1">
                      {option.title}
                    </Text>
                    
                    {option.completed && (
                      <View className="w-6 h-6 rounded-full bg-green-500 items-center justify-center">
                        <Icon name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  
                  <Text className="text-sm text-gray-500 mt-1">
                    {option.subtitle}
                  </Text>
                </View>

                <Icon name="chevron-forward" size={20} color="#9CA3AF" className="ml-2" />
              </View>

              {/* Description */}
              <Text className="text-sm text-gray-600 leading-5">
                {option.description}
              </Text>

              {/* Status Badge */}
              <View className="mt-3">
                {option.completed ? (
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                    <Text className="text-xs font-semibold text-green-600">
                      Completed
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
                    <Text className="text-xs font-semibold text-orange-600">
                      Action Required
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
};

export default VendorStoreSetupScreen;