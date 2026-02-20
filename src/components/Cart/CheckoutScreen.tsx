// EXPO-COMPATIBLE VERSION - FIXED WITH ACTUAL SHIPPING PRICES
// Passes selected delivery price and courier info to backend

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import { RootStackParamList } from '@/navigation';
import {
  Address,
  getAddresses,
  createAddress,
  deleteAddress,
  setDefaultAddress,
  CreateAddressRequest,
} from '@/services/address.service';
import { getDeliveryRates, createOrder } from '@/services/order.service';
import { Cart } from '@/services/cart.service';

interface DeliveryOption {
  id: string;
  type: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  courier?: string;
  logo?: string;
  pickupAddress?: string;
  vendorBreakdown?: Array<{
    vendorId: string;
    vendorName: string;
    price: number;
    courier: string;
  }>;
  isMultiVendor?: boolean;
}

interface PaymentMethod {
  id: 'paystack' | 'wallet' | 'cash_on_delivery';
  name: string;
  icon: string;
  color: string;
  description?: string;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
}

type CheckoutRouteProp = RouteProp<RootStackParamList, 'Checkout'>;

const CheckoutScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CheckoutRouteProp>();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paystack' | 'wallet' | 'cash_on_delivery'>('paystack');
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Address form states
  const [addressForm, setAddressForm] = useState<CreateAddressRequest>({
    label: 'Home',
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postalCode: '',
    isDefault: false,
  });

  const cartData: Cart | undefined = route.params?.cart;
  const subtotal = cartData?.subtotal || 0;
  const discount = cartData?.discount || 0;

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'paystack',
      name: 'Pay with Card (Paystack)',
      icon: 'card-outline',
      color: '#00C3F9',
      description: 'Pay securely with your debit/credit card',
    },
    {
      id: 'wallet',
      name: 'Pay with Wallet',
      icon: 'wallet-outline',
      color: '#6366F1',
      description: 'Use your wallet balance',
    },
    {
      id: 'cash_on_delivery',
      name: 'Cash on Delivery',
      icon: 'cash-outline',
      color: '#10B981',
      description: 'Pay when you receive your order',
    },
  ];

  const selectedDelivery = deliveryOptions.find(opt => opt.id === selectedDeliveryOption);
  const deliveryFee = selectedDelivery?.price || 0;
  const totalAmount = subtotal - discount + deliveryFee;

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (selectedAddress && currentStep === 2 && deliveryOptions.length === 0) {
      fetchDeliveryRates();
    }
  }, [selectedAddress, currentStep]);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await getAddresses();
      
      if (response.success && response.data.addresses) {
        setAddresses(response.data.addresses);
        
        const defaultAddress = response.data.addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        } else if (response.data.addresses.length > 0) {
          setSelectedAddress(response.data.addresses[0]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching addresses:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load addresses',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeliveryRates = async () => {
    if (!selectedAddress) return;

    try {
      setIsLoadingRates(true);
      
      console.log('📦 Fetching delivery rates for address:', {
        city: selectedAddress.city,
        state: selectedAddress.state,
        street: selectedAddress.street,
      });
      
      const response = await getDeliveryRates(
        selectedAddress.city,
        selectedAddress.state,
        selectedAddress.street,
        selectedAddress.fullName,
        selectedAddress.phone
      );

      console.log('📥 Delivery rates response:', response);

      if (response.success && response.data?.rates) {
        const rates = response.data.rates;
        
        const formattedRates = rates.map((rate: any, index: number) => {
          const uniqueId = `${rate.type}-${rate.courier || 'courier'}-${index}`;
          
          console.log(`📦 Rate ${index + 1}:`, {
            id: uniqueId,
            name: rate.name,
            price: rate.price,
            courier: rate.courier,
            hasBreakdown: !!rate.vendorBreakdown,
          });
          
          return {
            id: uniqueId,
            type: rate.type,
            name: rate.name,
            description: rate.description,
            price: rate.price || 0,
            estimatedDays: rate.estimatedDays || 'N/A',
            courier: rate.courier,
            logo: rate.logo,
            pickupAddress: rate.pickupAddress,
            vendorBreakdown: rate.vendorBreakdown,
            isMultiVendor: response.data.multiVendor,
          };
        });
        
        console.log('✅ Formatted delivery options:', formattedRates.length);
        setDeliveryOptions(formattedRates);
        
        // Auto-select pickup if available
        const pickupOption = formattedRates.find(r => r.type === 'pickup');
        if (pickupOption) {
          setSelectedDeliveryOption(pickupOption.id);
          console.log('✅ Auto-selected pickup option');
        } else if (formattedRates.length > 0) {
          setSelectedDeliveryOption(formattedRates[0].id);
          console.log('✅ Auto-selected first option:', formattedRates[0].name);
        }

        Toast.show({
          type: 'success',
          text1: 'Delivery Options Loaded',
          text2: `Found ${formattedRates.length} delivery option${formattedRates.length !== 1 ? 's' : ''}`,
        });
      }
    } catch (error: any) {
      console.error('❌ Error fetching delivery rates:', error);
      Toast.show({
        type: 'info',
        text1: 'Using Default Rates',
        text2: 'Could not fetch live rates.',
      });
      useFallbackRates();
    } finally {
      setIsLoadingRates(false);
    }
  };

  const useFallbackRates = () => {
    const fallbackRates: DeliveryOption[] = [
      {
        id: 'pickup-Self Pickup-0',
        type: 'pickup',
        name: 'Store Pickup',
        description: 'Pickup from vendor location',
        price: 0,
        estimatedDays: 'Available immediately',
        courier: 'Self Pickup',
      },
      {
        id: 'standard-Standard Courier-1',
        type: 'standard',
        name: 'Standard Delivery',
        description: 'Delivery within 5-7 business days',
        price: 2500,
        estimatedDays: '5-7 days',
        courier: 'Standard Courier',
      },
      {
        id: 'express-Express Courier-2',
        type: 'express',
        name: 'Express Delivery',
        description: 'Delivery within 2-3 business days',
        price: 5000,
        estimatedDays: '2-3 days',
        courier: 'Express Courier',
      },
    ];
    
    setDeliveryOptions(fallbackRates);
    setSelectedDeliveryOption('pickup-Self Pickup-0');
  };

  const getUserLocation = async () => {
    try {
      setIsGettingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Location permission is required to auto-fill address',
        });
        setIsGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log('📍 Got location:', location.coords);
      
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
        
        setAddressForm(prev => ({
          ...prev,
          street: addr.road || addr.suburb || '',
          city: addr.city || addr.town || addr.village || '',
          state: addr.state || '',
          postalCode: addr.postcode || '',
        }));
        
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
    const limited = cleaned.substring(0, 11);
    return limited;
  };

  const handleCreateAddress = async () => {
    if (!validateAddressForm()) {
      Toast.show({
        type: 'warning',
        text1: 'Invalid Information',
        text2: 'Please fix the errors in the form',
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      const formattedPhone = addressForm.phone.startsWith('+234') 
        ? addressForm.phone 
        : '+234' + addressForm.phone.substring(1);
      
      const addressData = {
        ...addressForm,
        phone: formattedPhone,
        fullName: addressForm.fullName.trim(),
        street: addressForm.street.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
      };
      
      console.log('📍 Creating address:', addressData);
      
      const response = await createAddress(addressData);
      
      if (response.success && response.data.address) {
        Toast.show({
          type: 'success',
          text1: 'Address Added',
          text2: response.data.validated 
            ? 'Address has been validated and added' 
            : 'New address has been added',
        });
        
        await fetchAddresses();
        setShowAddAddressModal(false);
        
        setAddressForm({
          label: 'Home',
          fullName: '',
          phone: '',
          street: '',
          city: '',
          state: '',
          country: 'Nigeria',
          postalCode: '',
          isDefault: false,
        });
        setFormErrors({});

        setSelectedAddress(response.data.address as Address);
      }
    } catch (error: any) {
      console.error('Error creating address:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to create address';
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              const response = await deleteAddress(addressId);
              
              if (response.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Address Deleted',
                  text2: 'Address has been removed',
                });
                await fetchAddresses();
              }
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to delete address',
              });
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      setIsProcessing(true);
      const response = await setDefaultAddress(addressId);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Default Address Updated',
          text2: 'This is now your default delivery address',
        });
        await fetchAddresses();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update default address',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      if (!selectedAddress) {
        Toast.show({
          type: 'warning',
          text1: 'Select Address',
          text2: 'Please select a delivery address',
        });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedDeliveryOption) {
        Toast.show({
          type: 'warning',
          text1: 'Select Delivery',
          text2: 'Please select a delivery option',
        });
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      handlePlaceOrder();
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedPaymentMethod) {
      Toast.show({
        type: 'warning',
        text1: 'Select Payment',
        text2: 'Please select a payment method',
      });
      return;
    }

    if (!selectedAddress || !selectedDeliveryOption) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please complete all checkout steps',
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      const selectedRate = deliveryOptions.find(opt => opt.id === selectedDeliveryOption);
      
      if (!selectedRate) {
        throw new Error('Selected delivery option not found');
      }

      console.log('📦 ============================================');
      console.log('📦 PLACING ORDER');
      console.log('📦 ============================================');
      console.log('🚚 Selected delivery option:', {
        id: selectedRate.id,
        type: selectedRate.type,
        name: selectedRate.name,
        price: selectedRate.price,
        courier: selectedRate.courier,
        hasBreakdown: !!selectedRate.vendorBreakdown,
        breakdownCount: selectedRate.vendorBreakdown?.length || 0,
      });

      if (selectedRate.vendorBreakdown) {
        console.log('📦 Vendor breakdown:');
        selectedRate.vendorBreakdown.forEach((vendor, i) => {
          console.log(`  ${i + 1}. ${vendor.vendorName}: ₦${vendor.price} (${vendor.courier})`);
        });
      }

      const shippingAddress = {
        fullName: selectedAddress.fullName,
        phone: selectedAddress.phone,
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        country: selectedAddress.country,
        postalCode: selectedAddress.postalCode,
      };
      
      // ✅ CRITICAL FIX: Pass actual delivery price and courier info to backend
      const orderData = {
        shippingAddress,
        paymentMethod: selectedPaymentMethod,
        deliveryType: selectedRate.type as 'standard' | 'express' | 'same_day' | 'pickup',
        notes: orderNotes || undefined,
        // ✅ NEW: Pass selected delivery details
        selectedDeliveryPrice: selectedRate.price,
        selectedCourier: selectedRate.courier,
        vendorBreakdown: selectedRate.vendorBreakdown,
      };
      
      console.log('📤 Order data being sent:', {
        deliveryType: orderData.deliveryType,
        selectedDeliveryPrice: orderData.selectedDeliveryPrice,
        selectedCourier: orderData.selectedCourier,
        hasVendorBreakdown: !!orderData.vendorBreakdown,
        breakdownCount: orderData.vendorBreakdown?.length || 0,
      });
      
      const response = await createOrder(orderData);
      
      console.log('📥 Order response:', response);
      console.log('📦 ============================================');
      
      if (response.success && response.data.order) {
        if (selectedPaymentMethod === 'paystack' && response.data.payment) {
          Toast.show({
            type: 'info',
            text1: 'Redirecting to Payment',
            text2: 'Please complete your payment',
          });
          
          navigation.reset({
            index: 0,
            routes: [
              { name: 'Home' },
              { name: 'Orders' as any },
            ],
          });
          
        } else {
          Toast.show({
            type: 'success',
            text1: 'Order Placed Successfully',
            text2: `Order #${response.data.order.orderNumber}`,
            visibilityTime: 3000,
          });
          
          navigation.reset({
            index: 0,
            routes: [
              { name: 'Home' },
              { name: 'Orders' as any },
            ],
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Error placing order:', error);
      Toast.show({
        type: 'error',
        text1: 'Order Failed',
        text2: error.response?.data?.message || 'Failed to place order. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderAddressStep = () => (
    <View className="flex-1">
      <Text className="text-lg font-bold text-gray-900 px-6 py-4">
        Delivery Address
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
      >
        {addresses.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center">
            <Icon name="location-outline" size={64} color="#D1D5DB" />
            <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">
              No Addresses Yet
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              Add a delivery address to continue with your order
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddAddressModal(true)}
              className="bg-pink-500 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {addresses.map((address) => (
              <TouchableOpacity
                key={address._id}
                onPress={() => setSelectedAddress(address)}
                className={`bg-white rounded-2xl p-4 mb-3 border-2 ${
                  selectedAddress?._id === address._id
                    ? 'border-pink-500'
                    : 'border-gray-100'
                }`}
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-full bg-pink-100 items-center justify-center mr-3">
                      <Icon
                        name={address.label === 'Home' ? 'home' : address.label === 'Office' ? 'business' : 'location'}
                        size={20}
                        color="#EC4899"
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <Text className="text-base font-bold text-gray-900">
                          {address.label}
                        </Text>
                        {address.isDefault && (
                          <View className="ml-2 bg-green-100 px-2 py-0.5 rounded">
                            <Text className="text-xs font-semibold text-green-700">Default</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-sm font-medium text-gray-700 mb-1">
                        {address.fullName}
                      </Text>
                      <Text className="text-sm text-gray-600 mb-1">
                        {address.street}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {address.city}, {address.state}, {address.country}
                      </Text>
                      <Text className="text-sm text-gray-500 mt-1">
                        {address.phone}
                      </Text>
                    </View>
                  </View>

                  {selectedAddress?._id === address._id && (
                    <View className="w-6 h-6 rounded-full bg-pink-500 items-center justify-center">
                      <Icon name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </View>

                <View className="flex-row mt-3 pt-3 border-t border-gray-100">
                  {!address.isDefault && (
                    <TouchableOpacity 
                      className="flex-row items-center mr-4"
                      onPress={() => handleSetDefaultAddress(address._id)}
                      disabled={isProcessing}
                    >
                      <Icon name="checkmark-circle-outline" size={16} color="#6B7280" />
                      <Text className="text-gray-600 font-medium ml-1">Set Default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    className="flex-row items-center"
                    onPress={() => handleDeleteAddress(address._id)}
                    disabled={isProcessing}
                  >
                    <Icon name="trash-outline" size={16} color="#EF4444" />
                    <Text className="text-red-500 font-medium ml-1">Delete</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setShowAddAddressModal(true)}
              className="bg-white rounded-2xl p-4 mb-3 border-2 border-dashed border-pink-300 flex-row items-center justify-center"
            >
              <View className="w-10 h-10 rounded-full bg-pink-100 items-center justify-center mr-3">
                <Icon name="add" size={24} color="#EC4899" />
              </View>
              <Text className="text-pink-500 font-bold text-base">Add New Address</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );

  const renderDeliveryStep = () => (
    <View className="flex-1">
      <Text className="text-lg font-bold text-gray-900 px-6 py-4">
        Delivery Method
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
      >
        {isLoadingRates ? (
          <View className="bg-white rounded-2xl p-8 items-center">
            <ActivityIndicator size="large" color="#EC4899" />
            <Text className="text-gray-500 mt-4">Finding best delivery options...</Text>
          </View>
        ) : (
          <>
            {deliveryOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedDeliveryOption(option.id)}
                className={`bg-white rounded-2xl p-4 mb-3 border-2 ${
                  selectedDeliveryOption === option.id
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-100'
                }`}
              >
                {/* Main Option Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
                      option.type === 'pickup' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <Icon 
                        name={option.type === 'pickup' ? 'storefront' : 'car'} 
                        size={24} 
                        color={option.type === 'pickup' ? '#10B981' : '#3B82F6'} 
                      />
                    </View>
                    
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-base font-bold text-gray-900">
                          {option.name}
                        </Text>
                        {option.price === 0 && (
                          <View className="ml-2 bg-green-100 px-2 py-0.5 rounded">
                            <Text className="text-xs font-semibold text-green-700">FREE</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs text-gray-500 mt-1">
                        {option.estimatedDays}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className={`text-lg font-bold ${option.price === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {option.price === 0 ? 'FREE' : `₦${option.price.toLocaleString()}`}
                    </Text>
                    {selectedDeliveryOption === option.id && (
                      <View className="w-6 h-6 rounded-full bg-pink-500 items-center justify-center mt-1">
                        <Icon name="checkmark" size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                </View>

                <Text className="text-sm text-gray-600 mb-2">{option.description}</Text>

                {/* ✅ Show Vendor Breakdown for Multi-Vendor Orders */}
                {option.vendorBreakdown && option.vendorBreakdown.length > 0 && (
                  <View className="mt-3 pt-3 border-t border-gray-200">
                    <Text className="text-xs font-semibold text-gray-700 mb-2">
                      Shipping Breakdown:
                    </Text>
                    {option.vendorBreakdown.map((vendor, idx) => (
                      <View key={idx} className="flex-row items-center justify-between py-1.5">
                        <View className="flex-1">
                          <Text className="text-xs font-medium text-gray-900">
                            {vendor.vendorName}
                          </Text>
                          <Text className="text-xs text-gray-500">
                            via {vendor.courier}
                          </Text>
                        </View>
                        <Text className="text-xs font-semibold text-gray-700">
                          ₦{vendor.price.toLocaleString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Pickup Address */}
                {option.pickupAddress && (
                  <View className="bg-gray-50 rounded-lg p-3 flex-row mt-2">
                    <Icon name="location" size={16} color="#6B7280" />
                    <Text className="text-xs text-gray-600 ml-2 flex-1">
                      {option.pickupAddress}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {deliveryOptions.length === 0 && (
              <View className="bg-white rounded-2xl p-8 items-center">
                <Icon name="alert-circle-outline" size={64} color="#D1D5DB" />
                <Text className="text-gray-500 mt-4">No delivery options available</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );

  const renderPaymentStep = () => (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
      >
        <Text className="text-lg font-bold text-gray-900 py-4">Payment Method</Text>

        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            onPress={() => setSelectedPaymentMethod(method.id)}
            className={`bg-white rounded-2xl p-4 mb-3 border-2 ${
              selectedPaymentMethod === method.id
                ? 'border-pink-500'
                : 'border-gray-100'
            }`}
          >
            <View className="flex-row items-center mb-2">
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: `${method.color}20` }}
              >
                <Icon name={method.icon} size={24} color={method.color} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">
                  {method.name}
                </Text>
                {method.description && (
                  <Text className="text-xs text-gray-500 mt-1">
                    {method.description}
                  </Text>
                )}
              </View>
              {selectedPaymentMethod === method.id && (
                <View className="w-6 h-6 rounded-full bg-pink-500 items-center justify-center">
                  <Icon name="checkmark" size={16} color="#FFFFFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        <View className="bg-green-50 rounded-2xl p-4 mb-3 flex-row">
          <Icon name="shield-checkmark" size={24} color="#10B981" />
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-green-900 mb-1">
              Secure Checkout
            </Text>
            <Text className="text-sm text-green-700">
              Your payment information is encrypted and secure. We accept all major payment
              methods.
            </Text>
          </View>
        </View>

        {/* Order Notes */}
        <View className="bg-white rounded-2xl p-4 mb-3">
          <Text className="text-base font-semibold text-gray-900 mb-3">Order Notes (Optional)</Text>
          <TextInput
            className="bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900"
            placeholder="Add any special instructions for your order..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            value={orderNotes}
            onChangeText={setOrderNotes}
            textAlignVertical="top"
          />
        </View>

        {/* Order Summary */}
        <View className="bg-white rounded-2xl p-4 mb-3">
          <Text className="text-base font-semibold text-gray-900 mb-4">Order Summary</Text>

          <View className="space-y-3">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-600">
                Subtotal ({cartData?.items?.length || 0} items)
              </Text>
              <Text className="text-gray-900 font-medium">
                ₦{subtotal.toLocaleString()}
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-600">Delivery Fee</Text>
              <Text className={`font-medium ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                {deliveryFee === 0 ? 'FREE' : `₦${deliveryFee.toLocaleString()}`}
              </Text>
            </View>

            {discount > 0 && (
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-green-600 font-medium">Discount</Text>
                <Text className="text-green-600 font-medium">
                  -₦{discount.toLocaleString()}
                </Text>
              </View>
            )}

            <View className="border-t border-gray-200 pt-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-bold text-gray-900">Total</Text>
                <Text className="text-xl font-bold text-gray-900">
                  ₦{totalAmount.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderStepIndicator = () => (
    <View className="flex-row items-center justify-between px-6 py-4 bg-white">
      <View className="flex-row items-center flex-1">
        <View className={`w-8 h-8 rounded-full items-center justify-center ${currentStep >= 1 ? 'bg-pink-500' : 'bg-gray-200'}`}>
          <Text className={`font-bold ${currentStep >= 1 ? 'text-white' : 'text-gray-400'}`}>1</Text>
        </View>
        <Text className={`ml-2 font-semibold text-sm ${currentStep === 1 ? 'text-gray-900' : 'text-gray-400'}`}>
          Address
        </Text>
      </View>
      <View className="h-0.5 flex-1 bg-gray-200 mx-2" />
      <View className="flex-row items-center flex-1">
        <View className={`w-8 h-8 rounded-full items-center justify-center ${currentStep >= 2 ? 'bg-pink-500' : 'bg-gray-200'}`}>
          <Text className={`font-bold ${currentStep >= 2 ? 'text-white' : 'text-gray-400'}`}>2</Text>
        </View>
        <Text className={`ml-2 font-semibold text-sm ${currentStep === 2 ? 'text-gray-900' : 'text-gray-400'}`}>
          Delivery
        </Text>
      </View>
      <View className="h-0.5 flex-1 bg-gray-200 mx-2" />
      <View className="flex-row items-center flex-1">
        <View className={`w-8 h-8 rounded-full items-center justify-center ${currentStep >= 3 ? 'bg-pink-500' : 'bg-gray-200'}`}>
          <Text className={`font-bold ${currentStep >= 3 ? 'text-white' : 'text-gray-400'}`}>3</Text>
        </View>
        <Text className={`ml-2 font-semibold text-sm ${currentStep === 3 ? 'text-gray-900' : 'text-gray-400'}`}>
          Payment
        </Text>
      </View>
    </View>
  );

  const renderAddAddressModal = () => (
    <Modal
      visible={showAddAddressModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddAddressModal(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: '90%' }}>
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">Add New Address</Text>
            <TouchableOpacity
              onPress={() => setShowAddAddressModal(false)}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <Icon name="close" size={20} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 24 }}
          >
            <TouchableOpacity
              onPress={getUserLocation}
              disabled={isGettingLocation}
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
                    <Text className={`font-semibold ${addressForm.label === label ? 'text-white' : 'text-gray-700'}`}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

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
                  if (formErrors.fullName) {
                    setFormErrors({ ...formErrors, fullName: undefined });
                  }
                }}
              />
              {formErrors.fullName && (
                <Text className="text-red-500 text-xs mt-1">{formErrors.fullName}</Text>
              )}
              <Text className="text-gray-500 text-xs mt-1">
                Only letters, spaces, hyphens, and apostrophes allowed
              </Text>
            </View>

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
                  if (formErrors.phone) {
                    setFormErrors({ ...formErrors, phone: undefined });
                  }
                }}
                maxLength={11}
              />
              {formErrors.phone && (
                <Text className="text-red-500 text-xs mt-1">{formErrors.phone}</Text>
              )}
            </View>

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
                  if (formErrors.street) {
                    setFormErrors({ ...formErrors, street: undefined });
                  }
                }}
              />
              {formErrors.street && (
                <Text className="text-red-500 text-xs mt-1">{formErrors.street}</Text>
              )}
            </View>

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
                    if (formErrors.city) {
                      setFormErrors({ ...formErrors, city: undefined });
                    }
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
                    if (formErrors.state) {
                      setFormErrors({ ...formErrors, state: undefined });
                    }
                  }}
                />
                {formErrors.state && (
                  <Text className="text-red-500 text-xs mt-1">{formErrors.state}</Text>
                )}
              </View>
            </View>

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
                  placeholder="Postal Code"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.postalCode}
                  onChangeText={(text) => setAddressForm({ ...addressForm, postalCode: text })}
                />
              </View>
            </View>

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

            <TouchableOpacity
              className="bg-pink-500 py-4 rounded-xl items-center justify-center"
              onPress={handleCreateAddress}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-base">Save Address</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Loading checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-6 py-3 flex-row items-center justify-between border-b border-gray-100">
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          onPress={() => {
            if (currentStep > 1) {
              setCurrentStep(currentStep - 1);
            } else {
              navigation.goBack();
            }
          }}
        >
          <Icon name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Checkout</Text>
        <View className="w-10" />
      </View>

      {renderStepIndicator()}

      {currentStep === 1 && renderAddressStep()}
      {currentStep === 2 && renderDeliveryStep()}
      {currentStep === 3 && renderPaymentStep()}

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-gray-600 text-sm">Total Amount</Text>
            <Text className="text-2xl font-bold text-gray-900">
              ₦{totalAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="bg-pink-500 py-4 rounded-xl flex-row items-center justify-center"
          onPress={handleContinue}
          disabled={isProcessing || isLoadingRates}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name="shield-checkmark" size={20} color="#FFFFFF" />
              <Text className="text-white font-bold text-base ml-2">
                {currentStep === 3 ? 'Place Order' : 'Continue'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {renderAddAddressModal()}
    </SafeAreaView>
  );
};

export default CheckoutScreen;