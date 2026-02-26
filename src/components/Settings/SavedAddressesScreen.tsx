// screens/SavedAddressesScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import {
  Address,
  CreateAddressRequest,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '@/services/address.service';

type SavedAddressesScreenProps = NativeStackScreenProps<RootStackParamList, 'SavedAddresses'>;

interface FormErrors {
  fullName?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
}

const EMPTY_FORM: CreateAddressRequest = {
  label: 'Home',
  fullName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  country: 'Nigeria',
  postalCode: '',
  isDefault: false,
};

const SavedAddressesScreen = ({ navigation }: SavedAddressesScreenProps) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);

  // Form
  const [addressForm, setAddressForm] = useState<CreateAddressRequest>({ ...EMPTY_FORM });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    fetchAddresses();
  }, []);

  // ─── API calls ───────────────────────────────────────────
  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await getAddresses();
      if (response.success) {
        setAddresses(response.data.addresses);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load addresses' });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchAddresses();
    setIsRefreshing(false);
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      setIsProcessing(true);
      const response = await setDefaultAddress(addressId);
      if (response.success) {
        setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a._id === addressId })));
        Toast.show({ type: 'success', text1: 'Default Updated', text2: 'Default address has been changed' });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Failed to update default address' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAddress) return;
    try {
      setIsProcessing(true);
      const response = await deleteAddress(deletingAddress._id);
      if (response.success) {
        setAddresses((prev) => prev.filter((a) => a._id !== deletingAddress._id));
        Toast.show({ type: 'success', text1: 'Address Deleted', text2: response.message || 'Address has been removed' });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Failed to delete address' });
    } finally {
      setIsProcessing(false);
      setShowDeleteModal(false);
      setDeletingAddress(null);
    }
  };

  // ─── Form helpers (matching CheckoutScreen patterns) ─────
  const resetForm = () => {
    setAddressForm({ ...EMPTY_FORM });
    setFormErrors({});
    setEditingAddress(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone.startsWith('+234')
        ? '0' + address.phone.slice(4)
        : address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country || 'Nigeria',
      postalCode: address.postalCode || '',
      isDefault: address.isDefault,
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const validateFullName = (name: string): boolean => {
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    return nameRegex.test(name) && name.trim().split(/\s+/).length >= 2;
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return (cleaned.length === 11 && cleaned.startsWith('0')) ||
           (cleaned.length === 13 && cleaned.startsWith('234'));
  };

  const validateAddressForm = (): boolean => {
    const errors: FormErrors = {};

    if (!addressForm.fullName) {
      errors.fullName = 'Full name is required';
    } else if (!validateFullName(addressForm.fullName)) {
      errors.fullName = 'Please enter a valid full name (e.g., John Doe). Only letters, spaces, hyphens, and apostrophes are allowed.';
    }

    if (!addressForm.phone) {
      errors.phone = 'Phone number is required';
    } else if (!validatePhone(addressForm.phone)) {
      errors.phone = 'Please enter a valid Nigerian phone number';
    }

    if (!addressForm.street || addressForm.street.trim().length < 5) {
      errors.street = 'Please enter a complete street address';
    }

    if (!addressForm.city || addressForm.city.trim().length < 2) {
      errors.city = 'City is required';
    }

    if (!addressForm.state || addressForm.state.trim().length < 2) {
      errors.state = 'State is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatPhoneNumber = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    return cleaned.substring(0, 11);
  };

  const getUserLocation = async () => {
    try {
      setIsGettingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Location permission is required to auto-fill address' });
        setIsGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.coords.latitude}&lon=${location.coords.longitude}`,
        { headers: { 'User-Agent': 'VendorSpot Mobile App' } },
      );

      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        setAddressForm((prev) => ({
          ...prev,
          street: addr.road || addr.suburb || '',
          city: addr.city || addr.town || addr.village || '',
          state: addr.state || '',
          postalCode: addr.postcode || '',
        }));
        Toast.show({ type: 'success', text1: 'Location Found', text2: 'Address fields have been pre-filled' });
      }
    } catch (error) {
      console.error('Location error:', error);
      Toast.show({ type: 'error', text1: 'Location Error', text2: 'Could not get your current location' });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!validateAddressForm()) {
      Toast.show({ type: 'warning', text1: 'Invalid Information', text2: 'Please fix the errors in the form' });
      return;
    }

    try {
      setIsProcessing(true);

      // Format phone to +234 just like CheckoutScreen does
      const formattedPhone = addressForm.phone.startsWith('+234')
        ? addressForm.phone
        : '+234' + addressForm.phone.substring(1);

      // Build addressData exactly like CheckoutScreen's handleCreateAddress
      const addressData: CreateAddressRequest = {
        ...addressForm,
        phone: formattedPhone,
        fullName: addressForm.fullName.trim(),
        street: addressForm.street.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
      };

      console.log('📍 Saving address:', addressData);

      if (editingAddress) {
        // Update existing — pass revalidate: true so backend re-validates
        // via Ship Bubble even if only minor fields changed
        const response = await updateAddress(editingAddress._id, {
          ...addressData,
          revalidate: true,
        } as any);
        if (response.success) {
          Toast.show({
            type: 'success',
            text1: 'Address Updated',
            text2: 'Your address has been validated and updated',
          });
        }
      } else {
        // Create new — backend validates via Ship Bubble before saving
        const response = await createAddress(addressData);

        if (response.success && response.data.address) {
          Toast.show({
            type: 'success',
            text1: 'Address Added',
            text2: response.data.validated
              ? 'Address has been validated and added'
              : 'New address has been added',
          });
        }
      }

      setShowAddModal(false);
      resetForm();
      await fetchAddresses();
    } catch (error: any) {
      console.error('❌ Error saving address:', error);

      const errorMessage = error.response?.data?.message || 'Failed to save address';

      Toast.show({ type: 'error', text1: 'Error', text2: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── UI Helpers ──────────────────────────────────────────
  const getLabelIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l === 'home') return { icon: 'home', color: '#EC4899', bg: '#FED7E2' };
    if (l === 'office' || l === 'work') return { icon: 'briefcase', color: '#3B82F6', bg: '#DBEAFE' };
    return { icon: 'location', color: '#10B981', bg: '#D1FAE5' };
  };

  // ─── Loading ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Loading addresses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main Render ─────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center mr-2"
          >
            <Icon name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Saved Addresses</Text>
        </View>
        <TouchableOpacity
          className="w-10 h-10 items-center justify-center bg-pink-50 rounded-full"
          onPress={openAddModal}
        >
          <Icon name="add" size={22} color="#EC4899" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#EC4899']} tintColor="#EC4899" />
        }
      >
        {/* Count */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-xs text-gray-500">
            {addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}
          </Text>
        </View>

        {/* Address Cards */}
        <View className="px-4">
          {addresses.length > 0 ? (
            addresses.map((address) => {
              const labelInfo = getLabelIcon(address.label);
              return (
                <View key={address._id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                  {/* Top Row */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: labelInfo.bg }}
                      >
                        <Icon name={labelInfo.icon as any} size={20} color={labelInfo.color} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center mb-0.5">
                          <Text className="text-sm font-bold text-gray-900 capitalize">{address.label}</Text>
                          {address.isDefault && (
                            <View className="ml-2 bg-green-100 px-2 py-0.5 rounded">
                              <Text className="text-xs font-semibold text-green-700">Default</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-sm font-medium text-gray-700">{address.fullName}</Text>
                      </View>
                    </View>

                    {/* Edit / Delete icons */}
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        className="w-8 h-8 items-center justify-center mr-1"
                        onPress={() => openEditModal(address)}
                      >
                        <Icon name="create-outline" size={18} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="w-8 h-8 items-center justify-center"
                        onPress={() => {
                          setDeletingAddress(address);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Icon name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Address Details */}
                  <View className="flex-row items-start mb-2">
                    <Icon name="location-outline" size={14} color="#9CA3AF" style={{ marginTop: 2 }} />
                    <Text className="text-sm text-gray-600 ml-2 flex-1" style={{ lineHeight: 20 }}>
                      {address.street}{'\n'}
                      {address.city}, {address.state}, {address.country}
                      {address.postalCode ? ` ${address.postalCode}` : ''}
                    </Text>
                  </View>

                  <View className="flex-row items-center mb-3">
                    <Icon name="call-outline" size={14} color="#9CA3AF" />
                    <Text className="text-sm text-gray-600 ml-2">{address.phone}</Text>
                  </View>

                  {/* Bottom Actions */}
                  <View className="flex-row pt-3 border-t border-gray-100">
                    {!address.isDefault && (
                      <TouchableOpacity
                        className="flex-row items-center mr-4"
                        onPress={() => handleSetDefault(address._id)}
                        disabled={isProcessing}
                      >
                        <Icon name="checkmark-circle-outline" size={16} color="#6B7280" />
                        <Text className="text-gray-600 font-medium ml-1 text-xs">Set Default</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View className="bg-white rounded-2xl p-10 items-center">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                <Icon name="location-outline" size={32} color="#D1D5DB" />
              </View>
              <Text className="text-base font-semibold text-gray-900 mb-1">No Saved Addresses</Text>
              <Text className="text-xs text-gray-500 text-center mb-4">
                Add a delivery address to get started
              </Text>
              <TouchableOpacity className="bg-pink-500 px-6 py-2.5 rounded-xl" onPress={openAddModal}>
                <Text className="text-white text-sm font-bold">Add Address</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ═══════════════ Add / Edit Address Modal ═══════════════ */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View className="bg-white rounded-t-3xl" style={{ maxHeight: '92%' }}>
              {/* Modal Header */}
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-gray-900">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <Icon name="close" size={20} color="#111827" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
              >
                {/* Use Current Location */}
                <TouchableOpacity
                  onPress={getUserLocation}
                  disabled={isGettingLocation}
                  className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-5 flex-row items-center justify-center"
                >
                  {isGettingLocation ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    <>
                      <Icon name="location" size={20} color="#3B82F6" />
                      <Text className="text-blue-600 font-semibold ml-2">Use Current Location</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Label */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Label</Text>
                  <View className="flex-row">
                    {['Home', 'Office', 'Other'].map((label) => (
                      <TouchableOpacity
                        key={label}
                        onPress={() => setAddressForm({ ...addressForm, label })}
                        className={`px-4 py-2 rounded-lg mr-2 ${
                          addressForm.label === label ? 'bg-pink-500' : 'bg-gray-100'
                        }`}
                      >
                        <Text
                          className={`font-semibold ${
                            addressForm.label === label ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Full Name */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Full Name *</Text>
                  <TextInput
                    className={`bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900 ${
                      formErrors.fullName ? 'border-2 border-red-500' : ''
                    }`}
                    placeholder="e.g., John Doe"
                    placeholderTextColor="#9CA3AF"
                    value={addressForm.fullName}
                    onChangeText={(text) => {
                      setAddressForm({ ...addressForm, fullName: text });
                      if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: undefined });
                    }}
                  />
                  {formErrors.fullName && (
                    <Text className="text-red-500 text-xs mt-1">{formErrors.fullName}</Text>
                  )}
                  <Text className="text-gray-500 text-xs mt-1">
                    Only letters, spaces, hyphens, and apostrophes allowed
                  </Text>
                </View>

                {/* Phone */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Phone Number *</Text>
                  <TextInput
                    className={`bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900 ${
                      formErrors.phone ? 'border-2 border-red-500' : ''
                    }`}
                    placeholder="e.g., 08012345678"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={addressForm.phone}
                    onChangeText={(text) => {
                      const formatted = formatPhoneNumber(text);
                      setAddressForm({ ...addressForm, phone: formatted });
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined });
                    }}
                    maxLength={11}
                  />
                  {formErrors.phone && (
                    <Text className="text-red-500 text-xs mt-1">{formErrors.phone}</Text>
                  )}
                </View>

                {/* Street */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Street Address *</Text>
                  <TextInput
                    className={`bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900 ${
                      formErrors.street ? 'border-2 border-red-500' : ''
                    }`}
                    placeholder="Enter complete street address"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={2}
                    value={addressForm.street}
                    onChangeText={(text) => {
                      setAddressForm({ ...addressForm, street: text });
                      if (formErrors.street) setFormErrors({ ...formErrors, street: undefined });
                    }}
                  />
                  {formErrors.street && (
                    <Text className="text-red-500 text-xs mt-1">{formErrors.street}</Text>
                  )}
                </View>

                {/* City & State */}
                <View className="flex-row mb-4">
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">City *</Text>
                    <TextInput
                      className={`bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900 ${
                        formErrors.city ? 'border-2 border-red-500' : ''
                      }`}
                      placeholder="City"
                      placeholderTextColor="#9CA3AF"
                      value={addressForm.city}
                      onChangeText={(text) => {
                        setAddressForm({ ...addressForm, city: text });
                        if (formErrors.city) setFormErrors({ ...formErrors, city: undefined });
                      }}
                    />
                    {formErrors.city && (
                      <Text className="text-red-500 text-xs mt-1">{formErrors.city}</Text>
                    )}
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">State *</Text>
                    <TextInput
                      className={`bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900 ${
                        formErrors.state ? 'border-2 border-red-500' : ''
                      }`}
                      placeholder="State"
                      placeholderTextColor="#9CA3AF"
                      value={addressForm.state}
                      onChangeText={(text) => {
                        setAddressForm({ ...addressForm, state: text });
                        if (formErrors.state) setFormErrors({ ...formErrors, state: undefined });
                      }}
                    />
                    {formErrors.state && (
                      <Text className="text-red-500 text-xs mt-1">{formErrors.state}</Text>
                    )}
                  </View>
                </View>

                {/* Country & Postal Code */}
                <View className="flex-row mb-4">
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Country</Text>
                    <TextInput
                      className="bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900"
                      placeholder="Country"
                      placeholderTextColor="#9CA3AF"
                      value={addressForm.country}
                      onChangeText={(text) => setAddressForm({ ...addressForm, country: text })}
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Postal Code</Text>
                    <TextInput
                      className="bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900"
                      placeholder="Optional"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      value={addressForm.postalCode}
                      onChangeText={(text) => setAddressForm({ ...addressForm, postalCode: text })}
                    />
                  </View>
                </View>

                {/* Set as Default */}
                <TouchableOpacity
                  onPress={() => setAddressForm({ ...addressForm, isDefault: !addressForm.isDefault })}
                  className="flex-row items-center mb-6"
                >
                  <View
                    className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-2 ${
                      addressForm.isDefault ? 'bg-pink-500 border-pink-500' : 'border-gray-300'
                    }`}
                  >
                    {addressForm.isDefault && <Icon name="checkmark" size={16} color="#FFFFFF" />}
                  </View>
                  <Text className="text-gray-700 font-medium">Set as default address</Text>
                </TouchableOpacity>

                {/* Save */}
                <TouchableOpacity
                  className="bg-pink-500 py-4 rounded-xl items-center justify-center"
                  onPress={handleSaveAddress}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-bold text-base">
                      {editingAddress ? 'Update Address' : 'Save Address'}
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ═══════════════ Delete Confirmation Modal ═══════════════ */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center self-center mb-4">
              <Icon name="trash-outline" size={32} color="#EF4444" />
            </View>

            <Text className="text-xl font-bold text-gray-900 text-center mb-2">Delete Address</Text>
            <Text className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete this address? This action cannot be undone.
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg border border-gray-300"
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletingAddress(null);
                }}
              >
                <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg bg-red-500"
                onPress={handleDeleteConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white font-semibold text-center">Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SavedAddressesScreen;