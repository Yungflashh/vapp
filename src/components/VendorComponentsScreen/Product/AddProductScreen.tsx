import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy'; // ✅ Use legacy API
import api from '../../../services/api.config';
import { Address, getAddresses } from '@/services/address.service';
import { getMyVendorProfile } from '@/services/vendor.service';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface FormErrors {
  name?: string;
  price?: string;
  quantity?: string;
  category?: string;
  description?: string;
  images?: string;
}

const AddProductScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const { login } = useAuth();
  const isSetupFlow = route.params?.isSetupFlow ?? false;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [weight, setWeight] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [productType, setProductType] = useState<'physical' | 'digital'>('physical');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isFlashSale, setIsFlashSale] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [affiliateCommission, setAffiliateCommission] = useState('10');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Digital product state
  const [digitalFile, setDigitalFile] = useState<{
    uri: string;
    name: string;
    size: number;
    type: string;
    base64?: string;
  } | null>(null);

  // Pickup address state
  const [pickupAddress, setPickupAddress] = useState<Address | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Filtered categories based on search
  const filteredCategories = categorySearch.trim()
    ? categories.filter((cat) =>
        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
      )
    : categories;

  useEffect(() => {
    fetchCategories();
    requestPermissions();
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const allAddresses: Address[] = [];

      // Fetch user's saved addresses
      const response = await getAddresses();
      if (response.success && response.data.addresses) {
        allAddresses.push(...response.data.addresses);
      }

      // Also fetch vendor's business address
      try {
        const vendorRes = await getMyVendorProfile();
        if (vendorRes.success && vendorRes.data?.vendorProfile?.businessAddress) {
          const ba = vendorRes.data.vendorProfile.businessAddress;
          if (ba.street && ba.city && ba.state) {
            const businessAddr: Address = {
              _id: 'vendor_business_address',
              user: '',
              label: 'Business Address',
              fullName: vendorRes.data.vendorProfile.businessName || '',
              phone: vendorRes.data.vendorProfile.businessPhone || '',
              street: ba.street,
              city: ba.city,
              state: ba.state,
              country: ba.country || 'Nigeria',
              postalCode: ba.postalCode || '',
              isDefault: false,
              createdAt: '',
              updatedAt: '',
            };
            // Add only if not already in the list
            const exists = allAddresses.some(
              (a) => a.street === businessAddr.street && a.city === businessAddr.city
            );
            if (!exists) allAddresses.unshift(businessAddr);
          }
        }
      } catch (vendorErr) {
        // Vendor profile may not exist, that's fine
      }

      setSavedAddresses(allAddresses);
      const defaultAddr = allAddresses.find((a: Address) => a.isDefault);
      if (defaultAddr) {
        setPickupAddress(defaultAddr);
      } else if (allAddresses.length > 0) {
        setPickupAddress(allAddresses[0]);
      }
    } catch (error) {
      console.log('Could not load addresses:', error);
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images');
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('📂 Fetching categories...');
      
      const response = await api.get('/categories');
      
      console.log('📂 Categories Response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.success) {
        const cats = response.data.data.categories;
        console.log('✅ Categories fetched:', cats.length);
        console.log('📋 First category:', cats[0]);
        setCategories(cats);
      } else {
        console.log('❌ Categories fetch not successful:', response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load categories',
      });
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true, // Enable base64 for Cloudinary
      });

      if (!result.canceled && result.assets) {
        // Convert to base64 data URI format for Cloudinary
        const base64Images = result.assets.map(asset => {
          if (asset.base64) {
            return `data:image/jpeg;base64,${asset.base64}`;
          }
          return asset.uri;
        });
        
        setImages([...images, ...base64Images].slice(0, 5)); // Max 5 images
        
        if (formErrors.images) {
          setFormErrors({ ...formErrors, images: undefined });
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick images',
      });
    }
  };

  const pickDigitalFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Accept any file type
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Check file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size && file.size > maxSize) {
        Toast.show({
          type: 'error',
          text1: 'File Too Large',
          text2: 'Digital file must be less than 100MB',
        });
        return;
      }

      console.log('📁 Reading file:', file.name);
      console.log('📁 File URI:', file.uri);
      console.log('📁 File size:', formatFileSize(file.size || 0));

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: 'base64', // ✅ Use string instead of FileSystem.EncodingType.Base64
      });

      console.log('✅ File read successfully, base64 length:', base64.length);

      // Get MIME type
      const mimeType = file.mimeType || 'application/octet-stream';
      const base64WithPrefix = `data:${mimeType};base64,${base64}`;

      setDigitalFile({
        uri: file.uri,
        name: file.name,
        size: file.size || 0,
        type: mimeType,
        base64: base64WithPrefix,
      });

      Toast.show({
        type: 'success',
        text1: 'File Selected',
        text2: `${file.name} (${formatFileSize(file.size || 0)})`,
      });
    } catch (error: any) {
      console.error('❌ Error picking digital file:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick file. Please try again.',
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const removeDigitalFile = () => {
    setDigitalFile(null);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!name.trim()) {
      errors.name = 'Product name is required';
    } else if (name.trim().length < 3) {
      errors.name = 'Product name must be at least 3 characters';
    }

    if (!price.trim()) {
      errors.price = 'Price is required';
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      errors.price = 'Please enter a valid price';
    }

    // Quantity validation differs for digital vs physical
    if (productType === 'physical') {
      if (!quantity.trim()) {
        errors.quantity = 'Quantity is required';
      } else if (isNaN(Number(quantity)) || Number(quantity) < 0) {
        errors.quantity = 'Please enter a valid quantity';
      }
    }

    if (!category) {
      errors.category = 'Please select a category';
    }

    if (!description.trim()) {
      errors.description = 'Description is required';
    } else if (description.trim().length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }

    if (images.length === 0) {
      errors.images = 'Please add at least one product image';
    }

    // Digital product specific validation
    if (productType === 'digital' && !digitalFile) {
      errors.images = 'Please upload the digital file (PDF, video, software, etc.)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fix the errors in the form',
      });
      return;
    }

    Alert.alert(
      'Create Product',
      'Are you sure you want to create this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: createProduct,
        },
      ]
    );
  };

  const buildProductData = (status: 'active' | 'draft' = 'active') => {
    const productData: any = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      quantity: productType === 'physical' ? Number(quantity) : 999999,
      weight: weight ? Number(weight) : undefined,
      sku: sku.trim() || undefined,
      category,
      productType,
      isFeatured,
      isFlashSale,
      isAffiliate,
      affiliateCommission: isAffiliate ? Number(affiliateCommission) : undefined,
      pickupAddress: pickupAddress?._id || undefined,
      images,
      tags: tags.length > 0 ? tags : undefined,
      status,
    };

    if (productType === 'digital' && digitalFile?.base64) {
      productData.digitalFileBase64 = digitalFile.base64;
      productData.digitalFileName = digitalFile.name;
      productData.digitalFileVersion = '1.0';
    }

    return productData;
  };

  const createProduct = async (status: 'active' | 'draft' = 'active') => {
    try {
      setLoading(true);

      const productData = buildProductData(status);

      console.log('📦 Creating product...');
      console.log('   - Type:', productType);
      console.log('   - Status:', status);
      console.log('   - Images:', images.length);

      const response = await api.post('/products', productData);

      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: status === 'draft' ? 'Draft Saved' : 'Success',
          text2: status === 'draft' ? 'Product saved as draft' : 'Product created successfully!',
          visibilityTime: 3000,
        });

        setTimeout(() => {
          if (isSetupFlow) {
            // During vendor setup flow, trigger auth state change to switch to main app
            login();
          } else {
            navigation.goBack();
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('❌ Error creating product:', error);
      console.error('❌ Response:', error.response?.data);

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to create product',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = () => {
    if (compareAtPrice && price && Number(compareAtPrice) > Number(price)) {
      const discount = Math.round(((Number(compareAtPrice) - Number(price)) / Number(compareAtPrice)) * 100);
      return `${discount}% OFF`;
    }
    return null;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View className="bg-white px-6 py-4 flex-row items-center justify-between border-b border-gray-200">
          <View className="flex-row items-center">
            {!isSetupFlow && (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
              >
                <Icon name="arrow-back" size={20} color="#111827" />
              </TouchableOpacity>
            )}
            <Text className="text-lg font-bold text-gray-900">
              {isSetupFlow ? 'Add Your First Product' : 'Add New Product'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 rounded-lg ${loading ? 'bg-pink-300' : 'bg-pink-500'}`}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-semibold">Publish</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 24 }}
        >
          {/* Product Images */}
          <View className="mb-6">
            <Text className="text-base font-bold text-gray-900 mb-2">
              Product Images <Text className="text-red-500">*</Text>
            </Text>
            <Text className="text-sm text-gray-500 mb-3">
              Add up to 5 images (first image will be the main image)
            </Text>

            <View className="flex-row flex-wrap">
              {images.map((image, index) => (
                <View key={index} className="mr-3 mb-3 relative">
                  <Image source={{ uri: image }} className="w-24 h-24 rounded-xl" />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 items-center justify-center"
                    style={{ zIndex: 10 }}
                  >
                    <Icon name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                  {index === 0 && (
                    <View className="absolute bottom-1 left-1 bg-pink-500 px-2 py-0.5 rounded">
                      <Text className="text-white text-xs font-semibold">Main</Text>
                    </View>
                  )}
                </View>
              ))}

              {images.length < 5 && (
                <TouchableOpacity
                  onPress={pickImage}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50 mr-3 mb-3"
                >
                  <Icon name="add-circle-outline" size={24} color="#CC3366" />
                  <Text className="text-xs text-pink-500 mt-1 font-medium">Add More</Text>
                </TouchableOpacity>
              )}
            </View>
            {formErrors.images && (
              <Text className="text-red-500 text-xs mt-2">{formErrors.images}</Text>
            )}
          </View>

          {/* Basic Information */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-base font-bold text-gray-900 mb-4">Basic Information</Text>

            {/* Product Name */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Product Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900 ${
                  formErrors.name ? 'border-2 border-red-500' : ''
                }`}
                placeholder="e.g., Wireless Bluetooth Headphones"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (formErrors.name) {
                    setFormErrors({ ...formErrors, name: undefined });
                  }
                  // Auto-generate SKU from product name
                  if (!sku || sku.startsWith('SKU-')) {
                    const autoSku = 'SKU-' + text.trim().toUpperCase().replace(/\s+/g, '-').substring(0, 10) + '-' + Math.floor(Math.random() * 10000);
                    setSku(autoSku);
                  }
                }}
                autoCapitalize="words"
              />
              {formErrors.name && (
                <Text className="text-red-500 text-xs mt-1">{formErrors.name}</Text>
              )}
            </View>

            {/* Category */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Category <Text className="text-red-500">*</Text>
              </Text>
              <TouchableOpacity
                onPress={() => {
                  console.log('📂 Opening category picker');
                  console.log('📂 Total categories:', categories.length);
                  console.log('📂 Categories:', categories);
                  setShowCategoryPicker(true);
                }}
                className={`bg-gray-50 px-4 py-3 rounded-lg flex-row justify-between items-center ${
                  formErrors.category ? 'border-2 border-red-500' : ''
                }`}
              >
                <Text className={`text-base ${categoryName ? 'text-gray-900' : 'text-gray-400'}`}>
                  {categoryName || 'Select category'}
                </Text>
                <Icon name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              {formErrors.category && (
                <Text className="text-red-500 text-xs mt-1">{formErrors.category}</Text>
              )}
            </View>

            {/* Product Type */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Product Type</Text>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setProductType('physical')}
                  className={`flex-1 mr-2 px-4 py-3 rounded-lg border-2 ${
                    productType === 'physical'
                      ? 'bg-pink-50 border-pink-500'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-center font-semibold ${
                      productType === 'physical' ? 'text-pink-500' : 'text-gray-700'
                    }`}
                  >
                    Physical
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setProductType('digital')}
                  className={`flex-1 ml-2 px-4 py-3 rounded-lg border-2 ${
                    productType === 'digital'
                      ? 'bg-pink-50 border-pink-500'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-center font-semibold ${
                      productType === 'digital' ? 'text-pink-500' : 'text-gray-700'
                    }`}
                  >
                    Digital
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Description <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900 ${
                  formErrors.description ? 'border-2 border-red-500' : ''
                }`}
                placeholder="Detailed product description..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  if (formErrors.description) {
                    setFormErrors({ ...formErrors, description: undefined });
                  }
                }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text className="text-xs text-gray-400 mt-1">{description.length}/1000 characters</Text>
              {formErrors.description && (
                <Text className="text-red-500 text-xs mt-1">{formErrors.description}</Text>
              )}
            </View>

          </View>

          {/* Pricing */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-base font-bold text-gray-900 mb-2">Pricing</Text>
            <Text className="text-xs text-gray-500 mb-4">
              VendorSpot charges a small commission on each sale. Set your prices accordingly.
            </Text>

            {/* Original Price and Selling Price - Side by side */}
            <View className="flex-row mb-2">
              <View className="flex-1 mr-2">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Original Price (₦) <Text className="text-gray-400 text-xs">(Optional)</Text>
                </Text>
                <TextInput
                  className="bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={compareAtPrice}
                  onChangeText={(text) => {
                    setCompareAtPrice(text);
                    // Auto-disable flash sale if discount drops below 10%
                    if (isFlashSale && price) {
                      const disc = ((Number(text) - Number(price)) / Number(text)) * 100;
                      if (isNaN(disc) || disc < 10) setIsFlashSale(false);
                    }
                  }}
                  keyboardType="numeric"
                />
              </View>

              <View className="flex-1 ml-2">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Selling Price (₦) <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900 ${
                    formErrors.price ? 'border-2 border-red-500' : ''
                  }`}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={price}
                  onChangeText={(text) => {
                    setPrice(text);
                    if (formErrors.price) {
                      setFormErrors({ ...formErrors, price: undefined });
                    }
                    // Auto-disable flash sale if discount drops below 10%
                    if (isFlashSale && compareAtPrice) {
                      const disc = ((Number(compareAtPrice) - Number(text)) / Number(compareAtPrice)) * 100;
                      if (isNaN(disc) || disc < 10) setIsFlashSale(false);
                    }
                  }}
                  keyboardType="numeric"
                />
                {formErrors.price && (
                  <Text className="text-red-500 text-xs mt-1">{formErrors.price}</Text>
                )}
              </View>
            </View>

            {calculateDiscount() && (
              <View className="bg-green-50 px-3 py-2 rounded-lg mb-3">
                <Text className="text-green-700 font-semibold text-sm">
                  Discount: {calculateDiscount()}
                </Text>
              </View>
            )}

            <View className="bg-blue-50 px-3 py-2 rounded-lg">
              <Text className="text-blue-700 text-xs">
                VendorSpot charges a 5% commission on each sale. Please factor this into your pricing.
              </Text>
            </View>
          </View>

          {/* Inventory */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-base font-bold text-gray-900 mb-4">Inventory</Text>

            <View className="flex-row mb-4">
              {/* Quantity - Only for physical products */}
              {productType === 'physical' && (
                <View className="flex-1 mr-2">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Stock Quantity <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className={`bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900 ${
                      formErrors.quantity ? 'border-2 border-red-500' : ''
                    }`}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    value={quantity}
                    onChangeText={(text) => {
                      setQuantity(text);
                      if (formErrors.quantity) {
                        setFormErrors({ ...formErrors, quantity: undefined });
                      }
                    }}
                    keyboardType="numeric"
                  />
                  {formErrors.quantity && (
                    <Text className="text-red-500 text-xs mt-1">{formErrors.quantity}</Text>
                  )}
                </View>
              )}

              {/* Digital products note */}
              {productType === 'digital' && (
                <View className="flex-1 bg-blue-50 p-4 rounded-lg">
                  <View className="flex-row items-center mb-2">
                    <Icon name="information-circle" size={20} color="#3B82F6" />
                    <Text className="text-sm font-semibold text-blue-700 ml-2">
                      Digital Product
                    </Text>
                  </View>
                  <Text className="text-xs text-blue-600">
                    Digital products have unlimited quantity. Customers will download the file after purchase.
                  </Text>
                </View>
              )}

              {/* SKU */}
              <View className={productType === 'physical' ? 'flex-1 ml-2' : 'flex-1'}>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  SKU <Text className="text-gray-400">(Optional)</Text>
                </Text>
                <TextInput
                  className="bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900"
                  placeholder="AUTO"
                  placeholderTextColor="#9CA3AF"
                  value={sku}
                  onChangeText={setSku}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {productType === 'physical' && (
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Weight (kg) <Text className="text-gray-400">(Optional)</Text>
                </Text>
                <TextInput
                  className="bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900"
                  placeholder="0.0"
                  placeholderTextColor="#9CA3AF"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
              </View>
            )}
          </View>

          {/* Digital File Upload - Only for digital products */}
          {productType === 'digital' && (
            <View className="bg-white rounded-2xl p-4 mb-4">
              <Text className="text-base font-bold text-gray-900 mb-2">
                Digital File <Text className="text-red-500">*</Text>
              </Text>
              <Text className="text-sm text-gray-500 mb-3">
                Upload the file customers will download (PDF, video, software, ebook, etc.)
              </Text>

              {!digitalFile ? (
                <TouchableOpacity
                  onPress={pickDigitalFile}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center bg-gray-50"
                >
                  <View className="w-16 h-16 rounded-full bg-pink-100 items-center justify-center mb-3">
                    <MaterialIcon name="file-upload" size={32} color="#CC3366" />
                  </View>
                  <Text className="text-base font-semibold text-gray-900 mb-1">
                    Upload Digital File
                  </Text>
                  <Text className="text-xs text-gray-500 text-center">
                    PDF, MP4, ZIP, or any digital file (Max 100MB)
                  </Text>
                </TouchableOpacity>
              ) : (
                <View className="border-2 border-pink-200 rounded-xl p-4 bg-pink-50">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 rounded-lg bg-pink-500 items-center justify-center mr-3">
                        <MaterialIcon name="file-check" size={24} color="#FFFFFF" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                          {digitalFile.name}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-1">
                          {formatFileSize(digitalFile.size)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={removeDigitalFile}
                      className="w-8 h-8 rounded-full bg-red-500 items-center justify-center ml-2"
                    >
                      <Icon name="close" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  <View className="bg-white rounded-lg p-2 mt-2">
                    <Text className="text-xs text-green-600 font-medium">
                      ✓ File ready to upload
                    </Text>
                  </View>
                </View>
              )}

              {formErrors.images && productType === 'digital' && (
                <Text className="text-red-500 text-xs mt-2">{formErrors.images}</Text>
              )}
            </View>
          )}

          {/* Tags */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-base font-bold text-gray-900 mb-2">Tags</Text>
            <Text className="text-sm text-gray-500 mb-3">
              Add keywords to help customers find your product
            </Text>

            <View className="flex-row items-center mb-3">
              <TextInput
                className="flex-1 bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900 mr-2"
                placeholder="e.g., wireless, bluetooth"
                placeholderTextColor="#9CA3AF"
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity
                onPress={addTag}
                className="w-12 h-12 rounded-lg bg-pink-500 items-center justify-center"
              >
                <Icon name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {tags.length > 0 && (
              <View className="flex-row flex-wrap">
                {tags.map((tag, index) => (
                  <View
                    key={index}
                    className="bg-pink-100 px-3 py-1.5 rounded-full mr-2 mb-2 flex-row items-center"
                  >
                    <Text className="text-pink-700 font-medium mr-1">#{tag}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <Icon name="close-circle" size={16} color="#CC3366" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Additional Settings */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-base font-bold text-gray-900 mb-4">Additional Settings</Text>

            {/* Featured */}
            <TouchableOpacity
              onPress={() => setIsFeatured(!isFeatured)}
              className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-100"
            >
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-1">Featured Product</Text>
                <Text className="text-sm text-gray-500">
                  Show this product in featured sections
                </Text>
              </View>
              <View
                className={`w-12 h-6 rounded-full items-center ${
                  isFeatured ? 'bg-pink-500 justify-end' : 'bg-gray-300 justify-start'
                } flex-row px-1`}
              >
                <View className="w-5 h-5 rounded-full bg-white" />
              </View>
            </TouchableOpacity>

            {/* Flash Sale */}
            <TouchableOpacity
              onPress={() => {
                if (!isFlashSale) {
                  // Turning ON - validate discount >= 10%
                  const sellingPrice = Number(price);
                  const originalPrice = Number(compareAtPrice);
                  if (!compareAtPrice || !price || originalPrice <= sellingPrice) {
                    Toast.show({
                      type: 'info',
                      text1: 'Set Compare-At Price',
                      text2: 'Enter a compare-at price higher than the selling price to enable flash sale',
                    });
                    return;
                  }
                  const discountPercent = ((originalPrice - sellingPrice) / originalPrice) * 100;
                  if (discountPercent < 10) {
                    Toast.show({
                      type: 'info',
                      text1: 'Minimum 10% Discount Required',
                      text2: `Current discount is ${Math.round(discountPercent)}%. Increase the difference between prices.`,
                    });
                    return;
                  }
                }
                setIsFlashSale(!isFlashSale);
              }}
              className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-100"
            >
              <View className="flex-1 mr-3">
                <View className="flex-row items-center mb-1">
                  <Icon name="flame" size={16} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text className="text-base font-semibold text-gray-900">Flash Sale</Text>
                </View>
                <Text className="text-sm text-gray-500">
                  Add to flash sales section (requires at least 10% off)
                </Text>
                {isFlashSale && compareAtPrice && price && Number(compareAtPrice) > Number(price) && (
                  <View className="flex-row items-center mt-2">
                    <View className="bg-red-100 px-2 py-0.5 rounded-full">
                      <Text className="text-xs font-bold text-red-500">
                        {Math.round(((Number(compareAtPrice) - Number(price)) / Number(compareAtPrice)) * 100)}% OFF
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              <View
                className={`w-12 h-6 rounded-full items-center ${
                  isFlashSale ? 'bg-red-500 justify-end' : 'bg-gray-300 justify-start'
                } flex-row px-1`}
              >
                <View className="w-5 h-5 rounded-full bg-white" />
              </View>
            </TouchableOpacity>

            {/* Affiliate */}
            <TouchableOpacity
              onPress={() => setIsAffiliate(!isAffiliate)}
              className="flex-row items-center justify-between mb-4"
            >
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-1">Enable Affiliate</Text>
                <Text className="text-sm text-gray-500">
                  Allow affiliates to promote this product
                </Text>
              </View>
              <View
                className={`w-12 h-6 rounded-full items-center ${
                  isAffiliate ? 'bg-pink-500 justify-end' : 'bg-gray-300 justify-start'
                } flex-row px-1`}
              >
                <View className="w-5 h-5 rounded-full bg-white" />
              </View>
            </TouchableOpacity>

            {isAffiliate && (
              <View className="mt-2">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Commission Rate (%)
                </Text>
                <TextInput
                  className="bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900"
                  placeholder="10"
                  placeholderTextColor="#9CA3AF"
                  value={affiliateCommission}
                  onChangeText={setAffiliateCommission}
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>

          {/* Pickup / Shipping Address */}
          {productType === 'physical' && (
            <View className="bg-white rounded-2xl p-4 mb-4">
              <Text className="text-base font-bold text-gray-900 mb-2">Pickup Address</Text>
              <Text className="text-sm text-gray-500 mb-3">
                Where buyers or couriers can pick up this product
              </Text>

              {pickupAddress ? (
                <View className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
                  <View className="flex-row items-center mb-1">
                    <Icon name="checkmark-circle" size={18} color="#22C55E" />
                    <Text className="text-sm font-semibold text-green-700 ml-2 capitalize">
                      {pickupAddress.label}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-700">
                    {pickupAddress.street}, {pickupAddress.city}, {pickupAddress.state}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">{pickupAddress.phone}</Text>
                </View>
              ) : (
                <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-3">
                  <View className="flex-row items-center">
                    <Icon name="warning-outline" size={18} color="#F59E0B" />
                    <Text className="text-sm text-yellow-700 ml-2">No pickup address selected</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={() => setShowAddressPicker(true)}
                className="border border-gray-200 rounded-xl py-3 items-center"
              >
                <Text className="text-sm font-semibold text-pink-500">
                  {pickupAddress ? 'Change Address' : 'Select Address'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Submit Buttons */}
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={() => createProduct('draft')}
              disabled={loading}
              className="flex-1 py-4 rounded-lg border-2 border-gray-300 bg-white"
            >
              <Text className="text-gray-700 text-base font-bold text-center">
                Save as Draft
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className={`flex-1 py-4 rounded-lg ${loading ? 'bg-pink-300' : 'bg-pink-500'}`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-bold text-center">
                  Publish Product
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{ height: '75%' }}
            className="bg-white rounded-t-3xl"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
              <Text className="text-lg font-bold text-gray-900">Select Category</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCategoryPicker(false);
                  setCategorySearch('');
                }}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Icon name="close" size={20} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="px-6 py-3 border-b border-gray-100">
              <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-2">
                <Icon name="search" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-2 text-base text-gray-900"
                  placeholder="Search categories..."
                  placeholderTextColor="#9CA3AF"
                  value={categorySearch}
                  onChangeText={setCategorySearch}
                />
              </View>
            </View>

            {/* Categories List with FlatList */}
            {categories.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Icon name="folder-open-outline" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 mt-4">No categories available</Text>
                <Text className="text-gray-400 text-sm mt-1">Please contact support</Text>
              </View>
            ) : (
              <View className="flex-1">
                <ScrollView showsVerticalScrollIndicator={false}>
                  {filteredCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat._id}
                      onPress={() => {
                        console.log('📂 Selected category:', cat.name, cat._id);
                        setCategory(cat._id);
                        setCategoryName(cat.name);
                        setShowCategoryPicker(false);
                        setCategorySearch('');
                        if (formErrors.category) {
                          setFormErrors({ ...formErrors, category: undefined });
                        }
                      }}
                      className={`px-6 py-4 border-b border-gray-100 flex-row items-center justify-between ${
                        category === cat._id ? 'bg-pink-50' : 'bg-white'
                      }`}
                      style={{ minHeight: 60 }}
                    >
                      <View className="flex-1 flex-row items-center">
                        {cat.icon && (
                          <Text className="text-2xl mr-3">{cat.icon}</Text>
                        )}
                        <View className="flex-1">
                          <Text
                            className={`text-base font-semibold ${
                              category === cat._id ? 'text-pink-500' : 'text-gray-900'
                            }`}
                          >
                            {cat.name}
                          </Text>
                          {cat.description && (
                            <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
                              {cat.description}
                            </Text>
                          )}
                        </View>
                      </View>
                      {category === cat._id && (
                        <Icon name="checkmark-circle" size={24} color="#CC3366" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Footer */}
            <View className="px-6 py-4 border-t border-gray-200 bg-white">
              <TouchableOpacity
                onPress={() => {
                  setShowCategoryPicker(false);
                  setCategorySearch('');
                }}
                className="bg-gray-100 py-3 rounded-lg"
              >
                <Text className="text-gray-700 text-base font-semibold text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Address Picker Modal */}
      <Modal
        visible={showAddressPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddressPicker(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowAddressPicker(false)}
            className="flex-1 justify-end"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{ maxHeight: '75%', minHeight: 300 }}
              className="bg-white rounded-t-3xl"
            >
              {/* Drag Handle */}
              <View className="items-center pt-3 pb-1">
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' }} />
              </View>

              <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
                <Text className="text-lg font-bold text-gray-900">Select Pickup Address</Text>
                <TouchableOpacity
                  onPress={() => setShowAddressPicker(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <Icon name="close" size={20} color="#111827" />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                style={{ flex: 1 }}
              >
                {savedAddresses.length > 0 ? (
                  savedAddresses.map((addr) => (
                    <TouchableOpacity
                      key={addr._id}
                      onPress={() => {
                        setPickupAddress(addr);
                        setShowAddressPicker(false);
                      }}
                      className={`p-4 rounded-xl mb-3 border ${
                        pickupAddress?._id === addr._id
                          ? 'border-pink-400 bg-pink-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-sm font-bold text-gray-900 capitalize">{addr.label}</Text>
                        {pickupAddress?._id === addr._id && (
                          <Icon name="checkmark-circle" size={20} color="#CC3366" />
                        )}
                      </View>
                      <Text className="text-sm text-gray-600">
                        {addr.street}, {addr.city}, {addr.state}
                      </Text>
                      <Text className="text-xs text-gray-400 mt-1">{addr.phone}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View className="items-center py-8">
                    <Icon name="location-outline" size={40} color="#D1D5DB" />
                    <Text className="text-gray-500 mt-3 text-center">
                      No saved addresses. Add one from your profile settings.
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Footer with navigate to settings */}
              <View className="px-6 py-4 border-t border-gray-200 bg-white" style={{ paddingBottom: Platform.OS === 'ios' ? 34 : 16 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddressPicker(false);
                    navigation.navigate('SavedAddresses' as any);
                  }}
                  className="bg-pink-500 py-3 rounded-lg"
                >
                  <Text className="text-white text-base font-semibold text-center">
                    Manage Addresses
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Skip option during setup flow */}
      {isSetupFlow && (
        <View className="bg-white px-6 pb-6 border-t border-gray-100" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 5 }}>
          <View className="flex-row items-center bg-pink-50 rounded-lg px-4 py-3 mt-4 mb-3">
            <Icon name="information-circle" size={18} color="#CC3366" />
            <Text className="text-xs text-gray-600 ml-2 flex-1">
              You can always add products later from your dashboard.
            </Text>
          </View>
          <TouchableOpacity
            className="py-3.5 rounded-xl items-center"
            style={{ backgroundColor: '#CC3366' }}
            onPress={() => login()}
          >
            <Text className="text-white font-semibold text-base">Skip for Now</Text>
          </TouchableOpacity>
        </View>
      )}

      <Toast />
    </SafeAreaView>
  );
};

export default AddProductScreen;