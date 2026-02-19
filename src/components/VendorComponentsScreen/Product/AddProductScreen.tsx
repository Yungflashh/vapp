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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy'; // ✅ Use legacy API
import api from '@/services/api';

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

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [weight, setWeight] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [productType, setProductType] = useState<'physical' | 'digital'>('physical');
  const [isFeatured, setIsFeatured] = useState(false);
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
  }, []);

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

  const createProduct = async () => {
    try {
      setLoading(true);

      const productData: any = {
        name: name.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim() || undefined,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        quantity: productType === 'physical' ? Number(quantity) : 999999, // Unlimited for digital
        weight: weight ? Number(weight) : undefined,
        sku: sku.trim() || undefined,
        category,
        productType,
        isFeatured,
        isAffiliate,
        affiliateCommission: isAffiliate ? Number(affiliateCommission) : undefined,
        images, // Base64 images for Cloudinary
        tags: tags.length > 0 ? tags : undefined,
      };

      // Add digital file data if it's a digital product
      if (productType === 'digital' && digitalFile?.base64) {
        productData.digitalFileBase64 = digitalFile.base64;
        productData.digitalFileName = digitalFile.name;
        productData.digitalFileVersion = '1.0';
      }

      console.log('📦 Creating product...');
      console.log('   - Type:', productType);
      console.log('   - Images:', images.length);
      console.log('   - Digital file:', digitalFile ? 'Yes' : 'No');

      const response = await api.post('/products', productData);

      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Product created successfully!',
          visibilityTime: 3000,
        });

        setTimeout(() => {
          navigation.goBack();
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View className="bg-white px-6 py-4 flex-row items-center justify-between border-b border-gray-200">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
            >
              <Icon name="arrow-back" size={20} color="#111827" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">Add New Product</Text>
          </View>
          
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 rounded-lg ${loading ? 'bg-pink-300' : 'bg-pink-500'}`}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-semibold">Create</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
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

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((image, index) => (
                <View key={index} className="mr-3 relative">
                  <Image source={{ uri: image }} className="w-24 h-24 rounded-xl" />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 items-center justify-center"
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
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50"
                >
                  <Icon name="camera" size={24} color="#9CA3AF" />
                  <Text className="text-xs text-gray-500 mt-1">Add Image</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
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
                }}
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

            {/* Short Description */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Short Description <Text className="text-gray-400">(Optional)</Text>
              </Text>
              <TextInput
                className="bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900"
                placeholder="Brief one-line description"
                placeholderTextColor="#9CA3AF"
                value={shortDescription}
                onChangeText={setShortDescription}
                maxLength={100}
              />
              <Text className="text-xs text-gray-400 mt-1">{shortDescription.length}/100 characters</Text>
            </View>
          </View>

          {/* Pricing */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-base font-bold text-gray-900 mb-4">Pricing</Text>

            <View className="flex-row mb-4">
              {/* Price */}
              <View className="flex-1 mr-2">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Price (₦) <Text className="text-red-500">*</Text>
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
                  }}
                  keyboardType="numeric"
                />
                {formErrors.price && (
                  <Text className="text-red-500 text-xs mt-1">{formErrors.price}</Text>
                )}
              </View>

              {/* Compare At Price */}
              <View className="flex-1 ml-2">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Compare At (₦) <Text className="text-gray-400">(Optional)</Text>
                </Text>
                <TextInput
                  className="bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={compareAtPrice}
                  onChangeText={setCompareAtPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {calculateDiscount() && (
              <View className="bg-green-50 px-3 py-2 rounded-lg mb-4">
                <Text className="text-green-700 font-semibold text-sm">
                  💰 Discount: {calculateDiscount()}
                </Text>
              </View>
            )}
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
                    <MaterialIcon name="file-upload" size={32} color="#EC4899" />
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
                      <Icon name="close-circle" size={16} color="#EC4899" />
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

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`py-4 rounded-lg mb-6 ${loading ? 'bg-pink-300' : 'bg-pink-500'}`}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-bold text-center">
                Create Product
              </Text>
            )}
          </TouchableOpacity>
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
                        <Icon name="checkmark-circle" size={24} color="#EC4899" />
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

      <Toast />
    </SafeAreaView>
  );
};

export default AddProductScreen;