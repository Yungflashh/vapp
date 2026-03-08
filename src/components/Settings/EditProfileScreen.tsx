// screens/EditProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { getCurrentUser, updateProfile, uploadAvatar } from '@/services/auth.service';
import * as ImagePicker from 'expo-image-picker';

type EditProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

interface Address {
  _id: string;
  street: string;
  city: string;
  state: string;
  isDefault: boolean;
}

const EditProfileScreen = ({ navigation }: EditProfileScreenProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await getCurrentUser();
      if (response.success) {
        const user = response.data.user;
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setAvatar(user.avatar || null);

        if (user.addresses && user.addresses.length > 0) {
          const def = user.addresses.find((a: Address) => a.isDefault) || user.addresses[0];
          setDefaultAddress(def);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load profile data',
      });
    } finally {
      setIsLoading(false);
    }
  };

const handlePickImage = async () => {
  try {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permission Denied',
        text2: 'We need photo library access to update your avatar',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    // Show preview immediately
    setAvatar(asset.uri);

    // Upload to backend
    if (asset.base64) {
      try {
        setIsUploadingAvatar(true);
        const mimeType = asset.mimeType || 'image/jpeg';
        const base64String = `data:${mimeType};base64,${asset.base64}`;
        const uploadResult = await uploadAvatar(base64String);

        if (uploadResult.success) {
          setAvatar(uploadResult.data.avatar);
          Toast.show({
            type: 'success',
            text1: 'Avatar Updated',
            text2: 'Your profile photo has been changed',
          });
        }
      } catch (error) {
        fetchUserData(); // revert on failure
        Toast.show({
          type: 'error',
          text1: 'Upload Failed',
          text2: 'Could not upload profile photo',
        });
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  } catch (error) {
    console.error('Image picker error:', error);
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'Something went wrong picking the image',
    });
  }
};

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'First name and last name are required',
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await updateProfile({ firstName, lastName, phone });

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Profile Updated',
          text2: 'Your changes have been saved successfully',
        });
        navigation.goBack();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update profile',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeDefaultAddress = () => {
    navigation.navigate('SavedAddresses' as any);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#CC3366" />
          <Text className="text-gray-500 mt-4">Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center mr-2"
        >
          <Icon name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 flex-1 text-center mr-12">
          Edit Profile
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Avatar Section */}
        <View className="items-center py-6">
          <TouchableOpacity
            onPress={handlePickImage}
            activeOpacity={0.8}
            disabled={isUploadingAvatar}
          >
            <View className="relative">
              <View className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-pink-400">
                {isUploadingAvatar ? (
                  <View className="w-full h-full items-center justify-center bg-pink-50">
                    <ActivityIndicator size="small" color="#CC3366" />
                  </View>
                ) : avatar ? (
                  <Image
                    source={{ uri: avatar }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center bg-pink-100">
                    <Icon name="person" size={40} color="#CC3366" />
                  </View>
                )}
              </View>
              {/* Edit Badge */}
              <View className="absolute bottom-0 right-0 w-8 h-8 bg-pink-500 rounded-full items-center justify-center border-2 border-white shadow-sm">
                <Icon name="pencil" size={14} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
          {isUploadingAvatar && (
            <Text className="text-xs text-gray-400 mt-2">Uploading...</Text>
          )}
        </View>

        {/* Form Fields */}
        <View className="px-5">
          {/* Full Name */}
          <View className="mb-4">
            <View className="bg-white rounded-xl border border-gray-200 px-4 py-3.5">
              <TextInput
                value={`${firstName} ${lastName}`}
                onChangeText={(text) => {
                  const parts = text.split(' ');
                  setFirstName(parts[0] || '');
                  setLastName(parts.slice(1).join(' ') || '');
                }}
                placeholder="Full Name"
                placeholderTextColor="#9CA3AF"
                className="text-base text-gray-900"
                style={{ fontSize: 15 }}
              />
            </View>
          </View>

          {/* Email */}
          <View className="mb-4">
            <View className="bg-white rounded-xl border border-gray-200 px-4 py-3.5">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false}
                className="text-base text-gray-400"
                style={{ fontSize: 15 }}
              />
            </View>
          </View>

          {/* Phone */}
          <View className="mb-4">
            <View className="bg-white rounded-xl border border-gray-200 px-4 py-3.5">
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                className="text-base text-gray-900"
                style={{ fontSize: 15 }}
              />
            </View>
          </View>

          {/* Default Address */}
          <View className="mb-6">
            <View className="bg-white rounded-xl border border-gray-200 px-4 py-3.5 flex-row items-center">
              <View className="flex-1 mr-3">
                {defaultAddress ? (
                  <Text className="text-base text-gray-900" style={{ fontSize: 15 }}>
                    {defaultAddress.street}, {defaultAddress.city} {defaultAddress.state}
                  </Text>
                ) : (
                  <Text className="text-base text-gray-400" style={{ fontSize: 15 }}>
                    No default address set
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={handleChangeDefaultAddress}
                className="bg-pink-500 px-3 py-1.5 rounded-lg"
                activeOpacity={0.8}
              >
                <Text className="text-white text-xs font-semibold">Change default</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button - Fixed at bottom */}
      <View className="px-5 pb-6 pt-3 bg-gray-50">
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || isUploadingAvatar}
          className="bg-pink-500 py-4 rounded-xl items-center shadow-sm"
          activeOpacity={0.8}
          style={{ opacity: isSaving || isUploadingAvatar ? 0.7 : 1 }}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-base font-bold">Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default EditProfileScreen;