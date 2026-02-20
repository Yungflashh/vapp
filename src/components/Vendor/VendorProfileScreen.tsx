import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import {
  getVendorProfile,
  followVendor,
  unfollowVendor,
  Vendor,
  Product,
} from '@/services/api';

type VendorProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'VendorProfile'>;

const VendorProfileScreen = ({ route, navigation }: VendorProfileScreenProps) => {
  const { vendorId } = route.params;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchVendorData();
  }, [vendorId]);

  const fetchVendorData = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔍 Fetching vendor profile:', vendorId);
      
      // Fetch vendor profile (which includes products in the response)
      const vendorResponse = await getVendorProfile(vendorId);

      console.log('✅ Vendor response received');

      if (vendorResponse.success && vendorResponse.data.vendor) {
        const vendorData = vendorResponse.data.vendor;
        const productsData = vendorResponse.data.products || [];
        
        console.log('📊 Vendor:', vendorData.businessName);
        console.log('📦 Products count:', productsData.length);
        console.log('👥 Follow status from API:', vendorData.isFollowing);
        console.log('👥 Followers count from API:', vendorData.followersCount);
        console.log('📋 Raw vendor data keys:', Object.keys(vendorData));
        
        // Map the vendor data to match our Vendor interface
        const mappedVendor: Vendor = {
          id: vendorData.id || vendorData._id,
          name: vendorData.businessName,
          description: vendorData.businessDescription,
          image: vendorData.businessLogo,
          coverImage: vendorData.storefront?.bannerImages?.[0] || undefined,
          location: vendorData.location || vendorData.businessAddress || undefined,
          rating: vendorData.averageRating || 0,
          reviews: vendorData.totalReviews || 0,
          totalSales: vendorData.totalSales || 0,
          productCount: productsData.length || 0,
          verified: vendorData.verificationStatus === 'verified',
          followers: vendorData.followersCount || vendorData.followers || 0,
          isFollowing: vendorData.isFollowing || false, // Get from API
        };
        
        console.log('✅ Mapped vendor isFollowing:', mappedVendor.isFollowing);
        console.log('✅ Mapped vendor followers:', mappedVendor.followers);
        
        setVendor(mappedVendor);
        setIsFollowing(mappedVendor.isFollowing); // Set state from API response
        
        console.log('✅ State set - isFollowing:', mappedVendor.isFollowing);

        // Map products from the vendor response
        if (productsData && productsData.length > 0) {
          const mappedProducts: Product[] = productsData.map((product: any) => ({
            id: product.id || product._id,
            name: product.name,
            description: product.description || '',
            shortDescription: product.shortDescription,
            price: product.price,
            originalPrice: product.originalPrice,
            discount: product.discount,
            discountPercentage: product.discountPercentage,
            rating: product.averageRating || product.rating || 0,
            reviews: product.totalReviews || product.reviews || 0,
            images: product.images || [],
            thumbnail: product.thumbnail || product.images?.[0] || '',
            category: product.category || '',
            categoryId: product.categoryId || '',
            vendor: product.vendor || { id: vendorId, name: vendorData.businessName },
            stock: product.stock || 0,
            inStock: product.inStock !== false,
            tags: product.tags || [],
            productType: product.productType || 'physical',
            isFeatured: product.isFeatured,
            isAffiliate: product.isAffiliate,
            affiliateCommission: product.affiliateCommission,
            totalSales: product.totalSales,
            views: product.views,
            weight: product.weight,
            keyFeatures: product.keyFeatures,
            specifications: product.specifications,
            requiresLicense: product.requiresLicense,
            licenseType: product.licenseType,
            createdAt: product.createdAt || '',
            updatedAt: product.updatedAt || '',
          }));
          
          setProducts(mappedProducts);
          console.log('✅ Products loaded:', mappedProducts.length);
        } else {
          setProducts([]);
        }
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching vendor:', error?.message);
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load vendor profile',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchVendorData();
    setIsRefreshing(false);
  };

  const handleFollowToggle = async () => {
    try {
      console.log('🔄 Toggle follow - Current state:', isFollowing);
      
      if (isFollowing) {
        // Unfollow
        const response = await unfollowVendor(vendorId);
        console.log('✅ Unfollow response:', response);
        
        setIsFollowing(false);
        
        if (vendor) {
          setVendor({ 
            ...vendor, 
            isFollowing: false,
            followers: Math.max(0, vendor.followers - 1) // Decrement follower count
          });
        }
        
        Toast.show({
          type: 'success',
          text1: 'Unfollowed',
          text2: `You unfollowed ${vendor?.name}`,
        });
      } else {
        // Follow
        const response = await followVendor(vendorId);
        console.log('✅ Follow response:', response);
        
        setIsFollowing(true);
        
        if (vendor) {
          setVendor({ 
            ...vendor, 
            isFollowing: true,
            followers: vendor.followers + 1 // Increment follower count
          });
        }
        
        Toast.show({
          type: 'success',
          text1: 'Following',
          text2: `You are now following ${vendor?.name}`,
        });
      }
      
      console.log('✅ Follow state updated to:', !isFollowing);
      
    } catch (error: any) {
      console.error('❌ Follow toggle error:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.response?.data?.message || 'Failed to update follow status',
      });
    }
  };

  const handleShare = async () => {
  if (!vendor) return;

  try {
    await Share.share({
      message: `Check out ${vendor.name} on VendorSpot! 🛍️\n\n${vendor.description || ''}\n\nView Store: https://vendorspot.com/vendor/${vendorId}`,
      title: vendor.name,
      url: `https://vendorspot.com/vendor/${vendorId}`, // iOS uses this
    });
  } catch (error) {
    console.error('Error sharing:', error);
  }
};

  const handleChatNow = () => {
    Toast.show({
      type: 'info',
      text1: 'Chat',
      text2: 'Chat feature coming soon',
    });
  };

  const handleCall = () => {
    if (vendor?.phone) {
      Linking.openURL(`tel:${vendor.phone}`);
    } else {
      Toast.show({
        type: 'warning',
        text1: 'No Phone',
        text2: 'This vendor has not provided a phone number',
      });
    }
  };

  const renderProductCard = (product: Product) => {
    const mainImage = product.thumbnail || product.images?.[0] || '';

    return (
      <TouchableOpacity
        key={product.id}
        className="w-[48%] mb-4"
        onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
        activeOpacity={0.8}
      >
        <View className="bg-white rounded-2xl overflow-hidden">
          <View className="bg-gray-100 aspect-square items-center justify-center">
            {mainImage ? (
              <Image
                source={{ uri: mainImage }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <Icon name="image-outline" size={48} color="#9CA3AF" />
            )}
          </View>
          <View className="p-3">
            <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
              {product.name}
            </Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-pink-500">
                ₦{product.price.toLocaleString()}
              </Text>
              {product.rating > 0 && (
                <View className="flex-row items-center">
                  <Icon name="star" size={12} color="#FBBF24" />
                  <Text className="text-xs text-gray-600 ml-1">{product.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Loading vendor profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!vendor) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <Icon name="storefront-outline" size={64} color="#9CA3AF" />
          <Text className="text-gray-900 font-bold text-xl mt-4">Vendor Not Found</Text>
          <Text className="text-gray-500 text-center mt-2">
            We couldn't find this vendor profile
          </Text>
          <TouchableOpacity
            className="bg-pink-500 px-6 py-3 rounded-lg mt-6"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center"
        >
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Store Profile</Text>
        <TouchableOpacity onPress={handleShare} className="w-10 h-10 items-center justify-center">
          <Icon name="share-social-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#EC4899']}
            tintColor="#EC4899"
          />
        }
      >
        {/* Vendor Header Card */}
        <View className="bg-white mx-4 mt-4 rounded-2xl overflow-hidden shadow-sm">
          <View className="flex-row items-center p-4">
            {/* Vendor Image */}
            <View className="w-20 h-20 rounded-2xl bg-pink-500 overflow-hidden mr-4">
              {vendor.image ? (
                <Image
                  source={{ uri: vendor.image }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Icon name="person" size={32} color="#FFFFFF" />
                </View>
              )}
            </View>

            {/* Vendor Info */}
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className="text-lg font-bold text-gray-900 mr-2">{vendor.name}</Text>
                {vendor.verified && (
                  <Icon name="shield-checkmark" size={20} color="#FFDD00" />
                )}
              </View>
              <Text className="text-sm text-gray-600 mb-2">
                {vendor.description || 'Premium products and services'}
              </Text>
              <View className="flex-row items-center">
                <Icon name="star" size={14} color="#FBBF24" />
                <Text className="text-sm font-semibold text-gray-900 ml-1">
                  {vendor.rating.toFixed(1)}
                </Text>
                <Text className="text-sm text-gray-500 ml-1">({vendor.reviews})</Text>
                <Text className="text-sm text-gray-500 mx-2">•</Text>
                <Text className="text-sm text-gray-600">
                  {vendor.followers > 0 ? `${vendor.followers.toLocaleString()} followers` : '0 followers'}
                </Text>
              </View>
            </View>

            {/* Follow Button */}
            <TouchableOpacity
              className={`px-4 py-2 rounded-lg ${
                isFollowing ? 'bg-gray-200' : 'bg-pink-500'
              }`}
              onPress={handleFollowToggle}
            >
              <Text
                className={`font-semibold ${
                  isFollowing ? 'text-gray-700' : 'text-white'
                }`}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4">
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-pink-500">
                {vendor.productCount || 0}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">Products</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-pink-500">
                {vendor.totalSales || 0}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">Sold</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-pink-500">
                {vendor.responseRate || 98}%
              </Text>
              <Text className="text-sm text-gray-600 mt-1">Response</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-4 mt-4 flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-pink-500 py-4 rounded-2xl flex-row items-center justify-center"
            onPress={handleChatNow}
            activeOpacity={0.8}
          >
            <MaterialIcon name="message-text" size={20} color="#FFFFFF" />
            <Text className="text-white font-semibold text-base ml-2">Chat Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-16 h-16 bg-white rounded-2xl items-center justify-center border border-gray-200"
            onPress={handleCall}
            activeOpacity={0.8}
          >
            <Icon name="call" size={24} color="#EC4899" />
          </TouchableOpacity>
        </View>

        {/* Products Section */}
        <View className="px-4 mt-6 mb-6">
          <View className="flex-row items-center mb-4">
            <MaterialIcon name="package-variant" size={24} color="#EC4899" />
            <Text className="text-lg font-bold text-gray-900 ml-2">
              Products ({products.length})
            </Text>
          </View>

          {products.length === 0 ? (
            <View className="bg-white rounded-2xl py-12 items-center">
              <Icon name="cube-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-4">No products available</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {products.map((product) => renderProductCard(product))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default VendorProfileScreen;