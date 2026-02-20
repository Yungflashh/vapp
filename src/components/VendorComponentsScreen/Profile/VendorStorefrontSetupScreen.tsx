// ============================================================
// VENDOR STOREFRONT CUSTOMIZATION SCREEN
// File: screens/vendor/VendorStorefrontSetupScreen.tsx
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { getMyVendorProfile, updateVendorProfile, uploadVendorImage } from '@/services/vendor.service';
import Toast from 'react-native-toast-message';

const THEME_OPTIONS = [
  { id: 'modern', name: 'Modern', color: '#EC4899', description: 'Clean & contemporary' },
  { id: 'classic', name: 'Classic', color: '#3B82F6', description: 'Traditional & professional' },
  { id: 'vibrant', name: 'Vibrant', color: '#F59E0B', description: 'Bold & colorful' },
  { id: 'minimal', name: 'Minimal', color: '#6B7280', description: 'Simple & elegant' },
];

const VendorStorefrontSetupScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [selectedTheme, setSelectedTheme] = useState('modern');
  const [customMessage, setCustomMessage] = useState('');
  const [bannerImages, setBannerImages] = useState<string[]>([]);
  const [businessBanner, setBusinessBanner] = useState('');

  useEffect(() => {
    fetchStorefrontData();
  }, []);

  const fetchStorefrontData = async () => {
    try {
      const response = await getMyVendorProfile();
      
      if (response.success) {
        const profile = response.data.vendorProfile;
        
        setSelectedTheme(profile.storefront?.theme || 'modern');
        setCustomMessage(profile.storefront?.customMessage || '');
        setBannerImages(profile.storefront?.bannerImages || []);
        setBusinessBanner(profile.businessBanner || '');
      }
    } catch (error) {
      console.error('Error fetching storefront:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickBannerImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadBannerImage(result.assets[0].uri);
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

  const uploadBannerImage = async (imageUri: string) => {
    try {
      setUploading(true);
      
      const uploadResponse = await uploadVendorImage(imageUri, 'banner');
      
      if (uploadResponse.success) {
        setBusinessBanner(uploadResponse.data.url);
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Banner uploaded successfully',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.response?.data?.message || 'Failed to upload banner',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      await updateVendorProfile({
        storefront: {
          theme: selectedTheme,
          customMessage: customMessage.trim(),
          bannerImages: bannerImages,
        },
        businessBanner: businessBanner,
      });
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Storefront customization saved successfully',
      });
      
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: error.response?.data?.message || 'Failed to save customization',
      });
    } finally {
      setSaving(false);
    }
  };

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
      <View className="bg-white px-6 py-4 flex-row items-center justify-between border-b border-gray-100">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
          >
            <Icon name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Storefront Customization</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner Section */}
        <View className="px-6 mt-6">
          <Text className="text-base font-bold text-gray-900 mb-3">Store Banner</Text>
          
          <TouchableOpacity
            onPress={handlePickBannerImage}
            disabled={uploading}
            className="bg-white rounded-2xl overflow-hidden"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            {businessBanner ? (
              <View className="relative">
                <Image
                  source={{ uri: businessBanner }}
                  className="w-full h-48"
                  resizeMode="cover"
                />
                
                {uploading && (
                  <View className="absolute inset-0 bg-black/50 items-center justify-center">
                    <ActivityIndicator size="large" color="#FFFFFF" />
                  </View>
                )}
                
                <View className="absolute bottom-4 right-4 bg-white rounded-full p-3">
                  <Icon name="camera" size={20} color="#EC4899" />
                </View>
              </View>
            ) : (
              <View className="h-48 items-center justify-center bg-gray-50">
                {uploading ? (
                  <ActivityIndicator size="large" color="#EC4899" />
                ) : (
                  <>
                    <Icon name="image-outline" size={48} color="#D1D5DB" />
                    <Text className="text-sm font-semibold text-gray-600 mt-3">
                      Upload Store Banner
                    </Text>
                    <Text className="text-xs text-gray-400 mt-1">
                      Recommended: 1200 x 400 pixels
                    </Text>
                  </>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Theme Selection */}
        <View className="px-6 mt-6">
          <Text className="text-base font-bold text-gray-900 mb-3">Store Theme</Text>
          
          <View className="flex-row flex-wrap -mx-1.5">
            {THEME_OPTIONS.map((theme) => (
              <TouchableOpacity
                key={theme.id}
                onPress={() => setSelectedTheme(theme.id)}
                className="w-1/2 px-1.5 mb-3"
              >
                <View
                  className={`bg-white rounded-2xl p-4 ${
                    selectedTheme === theme.id ? 'border-2' : 'border'
                  }`}
                  style={{
                    borderColor: selectedTheme === theme.id ? theme.color : '#E5E7EB',
                    shadowColor: selectedTheme === theme.id ? theme.color : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: selectedTheme === theme.id ? 0.2 : 0.05,
                    shadowRadius: 8,
                    elevation: selectedTheme === theme.id ? 5 : 2,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: `${theme.color}20` }}
                    >
                      <View
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: theme.color }}
                      />
                    </View>
                    
                    {selectedTheme === theme.id && (
                      <View
                        className="w-6 h-6 rounded-full items-center justify-center"
                        style={{ backgroundColor: theme.color }}
                      >
                        <Icon name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  
                  <Text className="text-sm font-bold text-gray-900 mb-1">
                    {theme.name}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {theme.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Message */}
        <View className="px-6 mt-6 pb-24">
          <Text className="text-base font-bold text-gray-900 mb-3">Welcome Message</Text>
          
          <View
            className="bg-white rounded-2xl p-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <TextInput
              value={customMessage}
              onChangeText={setCustomMessage}
              placeholder="Welcome to my store! Browse our amazing products..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="text-base text-gray-900 min-h-[100px]"
            />
            
            <Text className="text-xs text-gray-400 mt-2">
              {customMessage.length}/200 characters
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white px-6 py-4 border-t border-gray-100">
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || uploading}
          className="bg-pink-500 py-4 rounded-xl items-center"
          style={{
            shadowColor: '#EC4899',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold text-base">Save Customization</Text>
          )}
        </TouchableOpacity>
      </View>

      <Toast />
    </SafeAreaView>
  );
};

export default VendorStorefrontSetupScreen;