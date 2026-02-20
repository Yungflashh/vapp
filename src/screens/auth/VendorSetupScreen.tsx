import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import api from '@/services/api';

type VendorSetupScreenProps = NativeStackScreenProps<AuthStackParamList, 'VendorSetup'>;

interface FormErrors {
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  street?: string;
  city?: string;
  state?: string;
}

const VendorSetupScreen = ({ navigation }: VendorSetupScreenProps) => {
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [businessWebsite, setBusinessWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Nigerian states
  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 
    'Yobe', 'Zamfara'
  ];

  /**
   * Get user's current location using expo-location
   */
  const getUserLocation = async () => {
    try {
      setIsGettingLocation(true);

      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Location permission is required to auto-fill address',
        });
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log('📍 Got location:', location.coords);
      
      // Reverse geocode using OpenStreetMap Nominatim (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.coords.latitude}&lon=${location.coords.longitude}`,
        {
          headers: {
            'User-Agent': 'VendorSpot Mobile App',
          },
        }
      );
      
      const data = await response.json();
      console.log('📍 Geocoded address:', data);
      
      if (data && data.address) {
        const addr = data.address;
        
        setStreet(addr.road || addr.suburb || '');
        setCity(addr.city || addr.town || addr.village || '');
        setState(addr.state || '');
        
        Toast.show({
          type: 'success',
          text1: 'Location Found',
          text2: 'Address fields have been pre-filled',
        });
      }
    } catch (error) {
      console.error('Location error:', error);
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: 'Could not get your current location',
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return (cleaned.length === 11 && cleaned.startsWith('0')) || 
           (cleaned.length === 13 && cleaned.startsWith('234'));
  };

  const formatPhoneNumber = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.substring(0, 11);
    return limited;
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!businessName.trim()) {
      errors.businessName = 'Business name is required';
    } else if (businessName.trim().length < 3) {
      errors.businessName = 'Business name must be at least 3 characters';
    }

    if (!businessEmail.trim()) {
      errors.businessEmail = 'Business email is required';
    } else if (!validateEmail(businessEmail)) {
      errors.businessEmail = 'Please enter a valid email address';
    }

    if (!businessPhone.trim()) {
      errors.businessPhone = 'Business phone is required';
    } else if (!validatePhone(businessPhone)) {
      errors.businessPhone = 'Please enter a valid Nigerian phone number';
    }

    if (!street.trim() || street.trim().length < 5) {
      errors.street = 'Please enter a complete street address';
    }

    if (!city.trim() || city.trim().length < 2) {
      errors.city = 'City is required';
    }

    if (!state) {
      errors.state = 'State is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Information',
        text2: 'Please fix the errors in the form',
      });
      return;
    }

    if (!businessDescription.trim() || businessDescription.trim().length < 20) {
      Alert.alert('Validation Error', 'Business description must be at least 20 characters');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = businessPhone.startsWith('+234') 
        ? businessPhone 
        : '+234' + businessPhone.substring(1);

      const vendorData = {
        businessName: businessName.trim(),
        businessDescription: businessDescription.trim(),
        businessAddress: {
          street: street.trim(),
          city: city.trim(),
          state: state,
          country: 'Nigeria',
        },
        businessPhone: formattedPhone,
        businessEmail: businessEmail.trim().toLowerCase(),
        businessWebsite: businessWebsite.trim() || undefined,
      };

      console.log('🏪 Creating vendor profile:', vendorData);

      // Call the vendor profile creation API
      const response = await api.post('/vendor/profile', vendorData);

      console.log('✅ Vendor profile created:', response.data);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Your business profile has been created successfully!',
      });

      // Navigate to payment setup
      navigation.navigate('PaymentSetup');
    } catch (error: any) {
      console.error('❌ Vendor profile creation error:', error);

      let errorMessage = 'Failed to create your business profile. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Setup Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity 
            className="w-10 h-10 justify-center mb-4"
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">
            Vendor Setup
          </Text>
          <Text className="text-2xl font-bold text-pink-500 text-center mb-2">
            You are almost done
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Tell us about your business
          </Text>

          {/* Location Button */}
          <TouchableOpacity
            onPress={getUserLocation}
            disabled={isGettingLocation || loading}
            className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4 flex-row items-center justify-center"
          >
            {isGettingLocation ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <>
                <Icon name="location" size={20} color="#3B82F6" />
                <Text className="text-blue-600 font-semibold ml-2">
                  Use Current Location
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Business Name */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Business Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className={`bg-gray-50 border rounded-lg px-4 py-3 text-base text-gray-900 ${
                formErrors.businessName ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter your business name"
              placeholderTextColor="#9CA3AF"
              value={businessName}
              onChangeText={(text) => {
                setBusinessName(text);
                if (formErrors.businessName) {
                  setFormErrors({ ...formErrors, businessName: undefined });
                }
              }}
              editable={!loading}
            />
            {formErrors.businessName && (
              <Text className="text-red-500 text-xs mt-1">{formErrors.businessName}</Text>
            )}
          </View>

          {/* Store URL Preview */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Store URL</Text>
            <View className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
              <Text className="text-base text-gray-600">
                www.vendorspotng.com/
                <Text className="text-gray-900 font-medium">
                  {businessName.toLowerCase().replace(/\s+/g, '-') || 'your-business-name'}
                </Text>
              </Text>
            </View>
          </View>

          {/* Business Description */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Business Description <Text className="text-red-500">*</Text>
            </Text>
            <Text className="text-xs text-gray-500 mb-2">
              Tell customers about your business (minimum 20 characters)
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base text-gray-900"
              placeholder="Describe your business and what you sell..."
              placeholderTextColor="#9CA3AF"
              value={businessDescription}
              onChangeText={setBusinessDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
              maxLength={500}
            />
            <Text className="text-xs text-gray-400 mt-1">
              {businessDescription.length}/500 characters
            </Text>
          </View>

          {/* Business Email */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Business Email <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className={`bg-gray-50 border rounded-lg px-4 py-3 text-base text-gray-900 ${
                formErrors.businessEmail ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="business@example.com"
              placeholderTextColor="#9CA3AF"
              value={businessEmail}
              onChangeText={(text) => {
                setBusinessEmail(text);
                if (formErrors.businessEmail) {
                  setFormErrors({ ...formErrors, businessEmail: undefined });
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            {formErrors.businessEmail && (
              <Text className="text-red-500 text-xs mt-1">{formErrors.businessEmail}</Text>
            )}
          </View>

          {/* Business Phone */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Business Phone <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className={`bg-gray-50 border rounded-lg px-4 py-3 text-base text-gray-900 ${
                formErrors.businessPhone ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="08012345678"
              placeholderTextColor="#9CA3AF"
              value={businessPhone}
              onChangeText={(text) => {
                const formatted = formatPhoneNumber(text);
                setBusinessPhone(formatted);
                if (formErrors.businessPhone) {
                  setFormErrors({ ...formErrors, businessPhone: undefined });
                }
              }}
              keyboardType="phone-pad"
              editable={!loading}
              maxLength={11}
            />
            {formErrors.businessPhone && (
              <Text className="text-red-500 text-xs mt-1">{formErrors.businessPhone}</Text>
            )}
          </View>

          {/* Street Address */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Street Address <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className={`bg-gray-50 border rounded-lg px-4 py-3 text-base text-gray-900 ${
                formErrors.street ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter complete street address"
              placeholderTextColor="#9CA3AF"
              value={street}
              onChangeText={(text) => {
                setStreet(text);
                if (formErrors.street) {
                  setFormErrors({ ...formErrors, street: undefined });
                }
              }}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              editable={!loading}
            />
            {formErrors.street && (
              <Text className="text-red-500 text-xs mt-1">{formErrors.street}</Text>
            )}
          </View>

          {/* City and State Row */}
          <View className="flex-row mb-4">
            {/* City */}
            <View className="flex-1 mr-2">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                City <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-gray-50 border rounded-lg px-4 py-3 text-base text-gray-900 ${
                  formErrors.city ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="City"
                placeholderTextColor="#9CA3AF"
                value={city}
                onChangeText={(text) => {
                  setCity(text);
                  if (formErrors.city) {
                    setFormErrors({ ...formErrors, city: undefined });
                  }
                }}
                editable={!loading}
              />
              {formErrors.city && (
                <Text className="text-red-500 text-xs mt-1">{formErrors.city}</Text>
              )}
            </View>

            {/* State */}
            <View className="flex-1 ml-2">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                State <Text className="text-red-500">*</Text>
              </Text>
              <TouchableOpacity
                className={`bg-gray-50 border rounded-lg px-4 py-3 flex-row justify-between items-center ${
                  formErrors.state ? 'border-red-500' : 'border-gray-200'
                }`}
                onPress={() => {
                  if (loading) return;
                  Alert.alert(
                    'Select State',
                    'Choose your state',
                    [
                      ...nigerianStates.map((stateName) => ({
                        text: stateName,
                        onPress: () => {
                          setState(stateName);
                          if (formErrors.state) {
                            setFormErrors({ ...formErrors, state: undefined });
                          }
                        },
                      })),
                      { text: 'Cancel', style: 'cancel' },
                    ],
                    { cancelable: true }
                  );
                }}
                disabled={loading}
              >
                <Text className={`text-base ${state ? 'text-gray-900' : 'text-gray-400'}`}>
                  {state || 'State'}
                </Text>
                <Icon name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              {formErrors.state && (
                <Text className="text-red-500 text-xs mt-1">{formErrors.state}</Text>
              )}
            </View>
          </View>

          {/* Website (Optional) */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Website <Text className="text-gray-400">(Optional)</Text>
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base text-gray-900"
              placeholder="https://yourwebsite.com"
              placeholderTextColor="#9CA3AF"
              value={businessWebsite}
              onChangeText={setBusinessWebsite}
              keyboardType="url"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Continue Button */}
          <TouchableOpacity 
            className={`py-4 rounded-lg mb-4 ${loading ? 'bg-pink-300' : 'bg-pink-500'}`}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold text-center">
                Continue to Payment Setup
              </Text>
            )}
          </TouchableOpacity>

          {/* Skip Button */}
          <TouchableOpacity 
            className="mb-6"
            onPress={() => {
              Alert.alert(
                'Skip Setup',
                'You can complete your business profile later from your dashboard. Note: You won\'t be able to sell until this is completed.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Skip',
                    onPress: () => {
                      navigation.navigate('RegistrationSuccess');
                    },
                  },
                ]
              );
            }}
            disabled={loading}
          >
            <Text className="text-sm text-gray-500 text-center">
              I'll do this later
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Toast for better UX */}
      <Toast />
    </SafeAreaView>
  );
};

export default VendorSetupScreen;