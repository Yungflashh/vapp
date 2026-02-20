// ============================================================
// VENDOR EDIT PROFILE SCREEN - WITHOUT PICKER DEPENDENCY
// File: screens/vendor/VendorEditProfileScreen.tsx
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  getMyVendorProfile,
  updateVendorProfile,
  uploadVendorImage,
} from '@/services/api';
import Toast from 'react-native-toast-message';

interface VendorProfile {
  businessName: string;
  businessDescription: string;
  businessLogo?: string;
  businessEmail: string;
  businessPhone: string;
  category?: string;
}

const categories = [
  'Beauty Product',
  'Fashion & Clothing',
  'Electronics',
  'Home & Garden',
  'Food & Beverage',
  'Health & Wellness',
  'Sports & Fitness',
  'Books & Media',
  'Toys & Games',
  'Automotive',
  'Jewelry & Accessories',
  'Art & Crafts',
  'Pet Supplies',
  'Office Supplies',
  'Other',
];

const VendorEditProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  const [profileImage, setProfileImage] = useState<string>('');
  const [formData, setFormData] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessDescription: '',
    category: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getMyVendorProfile();
      
      if (response.success) {
        const profile = response.data.vendorProfile;
        setProfileImage(profile.businessLogo || '');
        setFormData({
          businessName: profile.businessName || '',
          businessEmail: profile.businessEmail || '',
          businessPhone: profile.businessPhone || '',
          businessDescription: profile.businessDescription || '',
          category: profile.category || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
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

  const uploadImage = async (imageUri: string) => {
    try {
      setUploading(true);
      
      const uploadResponse = await uploadVendorImage(imageUri, 'logo');
      
      if (uploadResponse.success) {
        setProfileImage(uploadResponse.data.url);
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile image uploaded',
        });
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

  const handleSave = async () => {
    // Validation
    if (!formData.businessName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Business name is required',
      });
      return;
    }

    if (!formData.businessEmail.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Email is required',
      });
      return;
    }

    if (!formData.businessPhone.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Phone number is required',
      });
      return;
    }

    try {
      setSaving(true);
      
      const updateData: any = {
        businessName: formData.businessName,
        businessEmail: formData.businessEmail,
        businessPhone: formData.businessPhone,
        businessDescription: formData.businessDescription,
      };

      if (formData.category) {
        updateData.category = formData.category;
      }

      if (profileImage) {
        updateData.businessLogo = profileImage;
      }

      await updateVendorProfile(updateData);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully',
      });
      
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
      
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.response?.data?.message || 'Failed to update profile',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC4899" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-4"
        >
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Edit Profile</Text>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Image */}
        <View className="items-center py-8">
          <TouchableOpacity
            onPress={handleImagePick}
            disabled={uploading}
            className="relative"
          >
            <View 
              className="w-32 h-32 rounded-full overflow-hidden items-center justify-center"
              style={{
                borderWidth: 4,
                borderColor: '#EC4899',
              }}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full bg-gray-200 items-center justify-center">
                  <Icon name="person" size={48} color="#9CA3AF" />
                </View>
              )}

              {uploading && (
                <View className="absolute inset-0 bg-black/50 items-center justify-center">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
            </View>

            {/* Camera Icon */}
            <View 
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-pink-500 items-center justify-center"
              style={{
                borderWidth: 3,
                borderColor: '#FFFFFF',
              }}
            >
              <Icon name="camera" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View className="px-6">
          {/* Business Name */}
          <View className="mb-4">
            <TextInput
              value={formData.businessName}
              onChangeText={(text) => setFormData({ ...formData, businessName: text })}
              className="bg-white border border-gray-300 rounded-xl px-4 py-4 text-base text-gray-900"
              placeholder="Business Name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Email */}
          <View className="mb-4">
            <TextInput
              value={formData.businessEmail}
              onChangeText={(text) => setFormData({ ...formData, businessEmail: text })}
              className="bg-white border border-gray-300 rounded-xl px-4 py-4 text-base text-gray-900"
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone */}
          <View className="mb-4">
            <TextInput
              value={formData.businessPhone}
              onChangeText={(text) => setFormData({ ...formData, businessPhone: text })}
              className="bg-white border border-gray-300 rounded-xl px-4 py-4 text-base text-gray-900"
              placeholder="Phone Number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          </View>

          {/* Description */}
          <View className="mb-4">
            <TextInput
              value={formData.businessDescription}
              onChangeText={(text) => setFormData({ ...formData, businessDescription: text })}
              className="bg-white border border-gray-300 rounded-xl px-4 py-4 text-base text-gray-900"
              placeholder="Business Description"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 100 }}
            />
          </View>

          {/* Category Dropdown */}
          <TouchableOpacity
            onPress={() => setShowCategoryPicker(true)}
            className="mb-6 bg-white border border-gray-300 rounded-xl px-4 py-4 flex-row items-center justify-between"
          >
            <Text 
              className="text-base"
              style={{ 
                color: formData.category ? '#111827' : '#9CA3AF' 
              }}
            >
              {formData.category || 'Select Category'}
            </Text>
            <Icon name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Save Button */}
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
              opacity: saving || uploading ? 0.7 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold text-lg">Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: '70%' }}>
            {/* Modal Header */}
            <View className="px-6 py-4 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-900">Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Categories List */}
            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setFormData({ ...formData, category: item });
                    setShowCategoryPicker(false);
                  }}
                  className="px-6 py-4 border-b border-gray-50 flex-row items-center justify-between"
                >
                  <Text 
                    className={`text-base ${
                      formData.category === item 
                        ? 'font-bold text-pink-500' 
                        : 'text-gray-900'
                    }`}
                  >
                    {item}
                  </Text>
                  {formData.category === item && (
                    <Icon name="checkmark-circle" size={24} color="#EC4899" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};

export default VendorEditProfileScreen;