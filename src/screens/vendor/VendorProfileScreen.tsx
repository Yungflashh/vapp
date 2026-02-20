// ============================================================
// VENDOR PROFILE SCREEN - With Verified Badge
// File: screens/vendor/VendorProfileScreen.tsx
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
// import VerifiedIcon from '@mui/icons-material/Verified';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import {
  getMyVendorProfile,
  uploadVendorImage,
} from '@/services/vendor.service';
import Toast from 'react-native-toast-message';

interface VendorProfile {
  businessName: string;
  businessDescription: string;
  businessLogo?: string;
  businessBanner?: string;
  businessEmail: string;
  businessPhone: string;
  businessWebsite?: string;
  category?: string;
  rating?: number;
  totalReviews?: number;
  followers?: any[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

const VendorProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user, logout: authLogout } = useAuth();
  
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getMyVendorProfile();
      if (response.success) {
        setProfile(response.data.vendorProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async (type: 'logo' | 'banner') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'logo' ? [1, 1] : [3, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri, type);
      }
    } catch (error) {
      console.error('Image pick error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick image',
      });
    }
  };

  const uploadImage = async (imageUri: string, type: 'logo' | 'banner') => {
    try {
      setUploading(true);
      
      const uploadResponse = await uploadVendorImage(imageUri, type);
      
      if (uploadResponse.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `${type === 'logo' ? 'Logo' : 'Banner'} updated successfully`,
        });
        
        fetchProfile();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.response?.data?.message || 'Failed to upload image',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${profile?.businessName || 'my store'} on VendorSpot!`,
        title: profile?.businessName || 'My Store',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authLogout();
              Toast.show({
                type: 'success',
                text1: 'Logged Out',
                text2: 'You have been successfully logged out',
              });
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 'store-setup',
      icon: 'storefront-outline',
      iconBg: '#FEE2E2',
      iconColor: '#EC4899',
      title: 'Store Setup',
      subtitle: 'Customize, verify & setup bank',
      onPress: () => navigation.navigate('VendorStoreSetup' as never),
    },
    {
      id: 'pickup-addresses',
      icon: 'location-outline',
      iconBg: '#D1FAE5',
      iconColor: '#10B981',
      title: 'Pick up Addresses',
      subtitle: 'Manage pick up locations',
      onPress: () => {
        Toast.show({
          type: 'info',
          text1: 'Coming Soon',
          text2: 'Pickup addresses management',
        });
      },
    },
    {
      id: 'notifications',
      icon: 'notifications-outline',
      iconBg: '#DBEAFE',
      iconColor: '#3B82F6',
      title: 'Notifications',
      subtitle: 'Manage alerts & preferences',
      onPress: () => {
        Toast.show({
          type: 'info',
          text1: 'Coming Soon',
          text2: 'Notification settings',
        });
      },
    },
    {
      id: 'app-settings',
      icon: 'settings-outline',
      iconBg: '#F3F4F6',
      iconColor: '#6B7280',
      title: 'App Settings',
      subtitle: 'Language, privacy & more',
      onPress: () => navigation.navigate('Settings' as never),
    },
    {
      id: 'refer-earn',
      icon: 'gift-outline',
      iconBg: '#F3E8FF',
      iconColor: '#A855F7',
      title: 'Refer & Earn',
      subtitle: 'Refer vendors & get commission',
      onPress: () => navigation.navigate('Affiliate' as never),
    },
    {
      id: 'delete-account',
      icon: 'trash-outline',
      iconBg: '#FEE2E2',
      iconColor: '#DC2626',
      title: 'Delete Account',
      subtitle: 'Permanently delete your account',
      onPress: () => navigation.navigate('DeleteAccount' as never),
      hideChevron: true,
    },
    {
      id: 'logout',
      icon: 'log-out-outline',
      iconBg: '#FEE2E2',
      iconColor: '#EF4444',
      title: 'Logout',
      subtitle: 'Sign out of your account',
      onPress: handleLogout,
      hideChevron: true,
    },
  ];

  if (loading && !profile) {
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
      <View className="bg-white px-6 py-4 flex-row items-center justify-between border-b border-gray-100">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
          >
            <Icon name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Store Profile</Text>
        </View>

        <TouchableOpacity
          onPress={handleShare}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <Icon name="share-social-outline" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Store Info Card */}
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
            <View className="flex-row">
              {/* Store Logo */}
              <TouchableOpacity
                onPress={() => handleImagePick('logo')}
                disabled={uploading}
                className="relative"
              >
                <View 
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 items-center justify-center overflow-hidden"
                  style={{
                    shadowColor: '#EC4899',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  {profile?.businessLogo ? (
                    <Image
                      source={{ uri: profile.businessLogo }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-3xl font-bold text-pink-500">
                      {profile?.businessName?.charAt(0) || user?.firstName?.charAt(0) || 'V'}
                    </Text>
                  )}
                  
                  {uploading && (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  )}
                </View>

                {/* Edit Icon */}
                <View 
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-pink-500 items-center justify-center"
                  style={{
                    shadowColor: '#EC4899',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Icon name="camera" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              {/* Store Details */}
              <View className="flex-1 ml-4">
                {/* Business Name with Verified Badge */}
                <View className="flex-row items-center mb-1">
                  <Text className="text-xl font-bold text-gray-900 flex-shrink" numberOfLines={1}>
                    {profile?.businessName || 'My Store'}
                  </Text>
                  
                  {/* Verified Badge beside name */}
                  {profile?.verificationStatus === 'verified' && (
                    <View className="ml-1.5">
                      <Icon name="shield-checkmark" size={20} color="#FFDD00" />
                    </View>
                  )}
                </View>

                {profile?.category && (
                  <Text className="text-sm text-gray-500 mb-2">
                    {profile.category}
                  </Text>
                )}

                {/* Rating & Followers */}
                <View className="flex-row items-center">
                  <View className="flex-row items-center">
                    <Icon name="star" size={14} color="#F59E0B" />
                    <Text className="text-sm font-semibold text-gray-900 ml-1">
                      {profile?.rating?.toFixed(1) || '4.8'}
                    </Text>
                    <Text className="text-sm text-gray-500 ml-1">
                      ({profile?.totalReviews || 342})
                    </Text>
                  </View>

                  <View className="w-1 h-1 rounded-full bg-gray-300 mx-3" />

                  <Text className="text-sm text-gray-500">
                    {profile?.followers?.length || 0} Followers
                  </Text>
                </View>
              </View>
            </View>

            {/* Store Description */}
            {profile?.businessDescription && (
              <Text className="text-sm text-gray-600 mt-4 leading-5">
                {profile.businessDescription}
              </Text>
            )}
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-6 pb-24">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={item.onPress}
              className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: item.iconBg }}
              >
                <Icon name={item.icon} size={22} color={item.iconColor} />
              </View>

              <View className="flex-1 ml-4">
                <Text className="text-base font-semibold text-gray-900">
                  {item.title}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {item.subtitle}
                </Text>
              </View>

              {!item.hideChevron && (
                <Icon name="chevron-forward" size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
};

export default VendorProfileScreen;