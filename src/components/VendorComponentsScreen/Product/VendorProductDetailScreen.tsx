// ============================================================
// REDESIGNED VENDOR PRODUCT DETAIL SCREEN
// File: screens/vendor/VendorProductDetailScreen.tsx
// Modern e-commerce style matching the reference design
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getProductById, updateProduct, deleteProduct } from '@/services/product.service';

const { width, height } = Dimensions.get('window');

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  originalPrice?: number;
  stock: number;
  inStock: boolean;
  totalSales: number;
  views: number;
  rating: number;
  reviews: number;
  category: string;
  productType: string;
  createdAt: string;
  updatedAt: string;
  keyFeatures?: string[];
  specifications?: { [key: string]: string };
  vendor?: {
    id: string;
    name: string;
    image?: string;
  };
}

const VendorProductDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute();
  const { productId } = route.params as { productId: string };

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    fetchProductDetail();
  }, [productId]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      const response = await getProductById(productId);
      
      if (response.data.success) {
        setProduct(response.data.data);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load product',
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = () => {
    Toast.show({
      type: 'info',
      text1: 'Edit Product',
      text2: 'Product editing feature coming soon',
    });
  };

  const handleUpdateStock = () => {
    if (!product) return;

    Alert.prompt(
      'Update Stock',
      `Current stock: ${product.stock}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Update',
          onPress: async (newStock) => {
            if (newStock && !isNaN(Number(newStock))) {
              try {
                              await updateProduct(productId, {
                                quantity: Number(newStock),
                              });
                Toast.show({
                  type: 'success',
                  text1: 'Stock Updated',
                  text2: `Stock updated to ${newStock}`,
                });

                fetchProductDetail();
              } catch (error: any) {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: error.response?.data?.message || 'Failed to update stock',
                });
              }
            }
          },
        },
      ],
      'plain-text',
      String(product.stock),
      'number-pad'
    );
  };

  const handleDeleteProduct = () => {
    if (!product) return;

    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(productId);

              Toast.show({
                type: 'success',
                text1: 'Product Deleted',
                text2: 'Product has been removed',
              });

              navigation.goBack();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to delete product',
              });
            }
          },
        },
      ]
    );
  };

  const handleShareProduct = async () => {
    if (!product) return;

    try {
      await Share.share({
        message: `Check out ${product.name} - ₦${product.price.toLocaleString()}`,
        title: product.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getStockStatus = () => {
    if (!product) return { label: '', color: '', bgColor: '' };

    if (product.stock === 0) {
      return { label: 'Out of Stock', color: '#EF4444', bgColor: '#FEE2E2' };
    } else if (product.stock <= 10) {
      return { label: 'Low Stock', color: '#F59E0B', bgColor: '#FEF3C7' };
    } else {
      return { label: 'In Stock', color: '#10B981', bgColor: '#D1FAE5' };
    }
  };

  if (loading || !product) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stockStatus = getStockStatus();
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image Section */}
        <View style={{ height: height * 0.5 }} className="relative bg-gray-100">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setSelectedImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {product.images.map((image, index) => (
              <View key={index} style={{ width }} className="items-center justify-center">
                <Image
                  source={{ uri: image }}
                  style={{ width: width * 0.8, height: height * 0.45 }}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>

          {/* Floating Action Buttons */}
          <View className="absolute top-4 left-0 right-0 px-4 flex-row justify-between items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-12 h-12 rounded-full bg-white items-center justify-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Icon name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>

            <View className="flex-row">
              <TouchableOpacity
                onPress={handleShareProduct}
                className="w-12 h-12 rounded-full bg-white items-center justify-center mr-2"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <Icon name="share-social-outline" size={22} color="#111827" />
              </TouchableOpacity>

              <TouchableOpacity
                className="w-12 h-12 rounded-full bg-white items-center justify-center"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <Icon name="heart-outline" size={22} color="#111827" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Image Indicators */}
          {product.images.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center">
              {product.images.map((_, index) => (
                <View
                  key={index}
                  className={`w-2 h-2 rounded-full mx-1 ${
                    index === selectedImageIndex ? 'bg-pink-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Info Section */}
        <View className="px-6 py-4">
          {/* Vendor Info */}
          {product.vendor && (
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
                {product.vendor.image ? (
                  <Image
                    source={{ uri: product.vendor.image }}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <Text className="text-sm font-bold text-gray-600">
                    {product.vendor.name.charAt(0)}
                  </Text>
                )}
              </View>
              <Text className="text-base font-semibold text-gray-900">
                {product.vendor.name}
              </Text>
              <View className="bg-pink-100 px-2 py-1 rounded-full ml-2 flex-row items-center">
                <Icon name="checkmark-circle" size={12} color="#EC4899" />
                <Text className="text-xs font-semibold text-pink-600 ml-1">
                  Verified Vendor
                </Text>
              </View>
            </View>
          )}

          {/* Product Name */}
          <Text className="text-2xl font-bold text-gray-900 mb-3">
            {product.name}
          </Text>

          {/* Price */}
          <View className="flex-row items-center mb-3">
            <Text className="text-3xl font-bold text-gray-900">
              ₦{product.price.toLocaleString()}
            </Text>
            {product.originalPrice && product.originalPrice > product.price && (
              <Text className="text-lg text-gray-400 line-through ml-3">
                ₦{product.originalPrice.toLocaleString()}
              </Text>
            )}
          </View>

          {/* Rating */}
          <View className="flex-row items-center mb-4">
            <View className="flex-row items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name="star"
                  size={16}
                  color={star <= Math.round(product.rating) ? '#F59E0B' : '#D1D5DB'}
                />
              ))}
            </View>
            <Text className="text-base font-bold text-gray-900 ml-2">
              {product.rating.toFixed(1)}
            </Text>
            <Text className="text-sm text-gray-500 ml-1">
              ({product.reviews} reviews)
            </Text>
          </View>

          {/* Action Buttons Row 1 */}
          <View className="flex-row mb-3">
            <TouchableOpacity 
              className="flex-1 bg-gray-100 py-3 rounded-xl mr-2 flex-row items-center justify-center"
            >
              <Icon name="chatbubble-outline" size={18} color="#111827" />
              <Text className="text-sm font-semibold text-gray-900 ml-2">
                Ask a Question
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 bg-gray-100 py-3 rounded-xl ml-2 flex-row items-center justify-center"
            >
              <Icon name="storefront-outline" size={18} color="#111827" />
              <Text className="text-sm font-semibold text-gray-900 ml-2">
                View Store
              </Text>
            </TouchableOpacity>
          </View>

          {/* Generate Referral Link Button */}
          <TouchableOpacity 
            className="bg-pink-50 py-3 rounded-xl mb-4 flex-row items-center justify-center border border-pink-200"
          >
            <Icon name="link-outline" size={18} color="#EC4899" />
            <Text className="text-sm font-bold text-pink-600 ml-2">
              Generate Referral Link
            </Text>
          </TouchableOpacity>

          {/* Stock Status */}
          <View className="mb-4">
            <Text className="text-base font-bold text-gray-900 mb-2">
              Stock Status
            </Text>
            <View
              className="px-4 py-3 rounded-xl flex-row items-center justify-between"
              style={{ backgroundColor: stockStatus.bgColor }}
            >
              <View className="flex-row items-center">
                <Icon name="cube-outline" size={20} color={stockStatus.color} />
                <Text
                  className="text-sm font-bold ml-2"
                  style={{ color: stockStatus.color }}
                >
                  {stockStatus.label}
                </Text>
              </View>
              <Text
                className="text-xl font-bold"
                style={{ color: stockStatus.color }}
              >
                {product.stock} units
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View className="flex-row mb-6">
            <View className="flex-1 bg-gray-50 rounded-xl p-4 mr-2">
              <View className="flex-row items-center mb-2">
                <Icon name="trending-up" size={18} color="#10B981" />
                <Text className="text-xs text-gray-500 ml-2">Total Sales</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                {product.totalSales}
              </Text>
            </View>

            <View className="flex-1 bg-gray-50 rounded-xl p-4 ml-2">
              <View className="flex-row items-center mb-2">
                <Icon name="eye-outline" size={18} color="#8B5CF6" />
                <Text className="text-xs text-gray-500 ml-2">Views</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                {product.views}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Description
            </Text>
            <Text 
              className="text-base text-gray-600 leading-6"
              numberOfLines={showFullDescription ? undefined : 4}
            >
              {product.description}
            </Text>
            {product.description.length > 150 && (
              <TouchableOpacity 
                onPress={() => setShowFullDescription(!showFullDescription)}
                className="mt-2"
              >
                <Text className="text-pink-500 font-semibold">
                  {showFullDescription ? 'Show Less' : 'Read More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Key Features */}
          {product.keyFeatures && product.keyFeatures.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Key Features
              </Text>
              {product.keyFeatures.map((feature, index) => (
                <View key={index} className="flex-row items-start mb-2">
                  <View className="w-2 h-2 rounded-full bg-pink-500 mt-2 mr-3" />
                  <Text className="flex-1 text-base text-gray-600">
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View 
        className="px-6 py-4 bg-white border-t border-gray-100"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 10,
        }}
      >
        <View className="flex-row">
          <TouchableOpacity
            onPress={handleUpdateStock}
            className="flex-1 bg-white border-2 border-pink-500 py-4 rounded-xl mr-2 flex-row items-center justify-center"
          >
            <Icon name="cube-outline" size={20} color="#EC4899" />
            <Text className="text-base font-bold text-pink-500 ml-2">
              Update Stock
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Alert.alert('Product Actions', '', [
                {
                  text: 'Edit Product',
                  onPress: handleEditProduct,
                },
                {
                  text: 'Delete Product',
                  onPress: handleDeleteProduct,
                  style: 'destructive',
                },
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
              ]);
            }}
            className="flex-1 bg-pink-500 py-4 rounded-xl ml-2 flex-row items-center justify-center"
            style={{
              shadowColor: '#EC4899',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Icon name="settings-outline" size={20} color="#FFFFFF" />
            <Text className="text-base font-bold text-white ml-2">
              Manage
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Toast />
    </SafeAreaView>
  );
};

export default VendorProductDetailScreen;