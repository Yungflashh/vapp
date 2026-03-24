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
import VerifyBadge from '@/components/VerifyBadge';
import {
  getVendorProfile,
  followVendor,
  unfollowVendor,
  Vendor,
} from '@/services/vendor.service';
import { Product } from '@/services/product.service';
import { startConversation } from '@/services/message.service';

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
          isPremium: vendorData.isPremium || false,
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

  const handleChatNow = async () => {
    if (!vendor) return;
    try {
      const response = await startConversation(vendor.id);
      if (response.success && response.data.conversation) {
        const convo = response.data.conversation;
        navigation.navigate('Chat', {
          conversationId: convo._id,
          receiverId: vendor.id,
          receiverName: vendor.name,
          receiverAvatar: vendor.image,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.response?.data?.message || 'Failed to start conversation',
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
          <ActivityIndicator size="large" color="#CC3366" />
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
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
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
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#CC3366']}
            tintColor="#CC3366"
          />
        }
      >
        {/* Vendor Header Card - Redesigned */}
        <View className="bg-white mx-4 mt-4 rounded-2xl overflow-hidden shadow-sm p-4">
          <View className="flex-row items-start">
            {/* Vendor Image */}
            <View className="w-16 h-16 rounded-full bg-pink-500 overflow-hidden mr-3">
              {vendor.image ? (
                <Image
                  source={{ uri: vendor.image }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Icon name="person" size={28} color="#FFFFFF" />
                </View>
              )}
            </View>

            {/* Vendor Info */}
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-0.5">
                <View className="flex-row items-center flex-1 mr-2">
                  <Text className="text-base font-bold text-gray-900" numberOfLines={1}>{vendor.name}</Text>
                  {vendor.verified && (
                    <View style={{ marginLeft: 4 }}><VerifyBadge size={16} isPremium={vendor.isPremium} /></View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handleFollowToggle}
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: isFollowing ? '#F3F4F6' : '#FDE8EC' }}
                >
                  <Icon
                    name={isFollowing ? 'person-remove-outline' : 'person-add-outline'}
                    size={18}
                    color={isFollowing ? '#6B7280' : '#CC3366'}
                  />
                </TouchableOpacity>
              </View>
              {vendor.location && (
                <View className="flex-row items-center mb-1">
                  <Icon name="location-outline" size={14} color="#9CA3AF" />
                  <Text className="text-xs text-gray-500 ml-1">{typeof vendor.location === 'string' ? vendor.location : 'Lagos, Nigeria'}</Text>
                </View>
              )}
              <Text className="text-xs text-gray-600 mb-1.5" numberOfLines={2}>
                {vendor.description || 'Premium products and services'}
              </Text>
              <View className="flex-row items-center">
                <Icon name="star" size={12} color="#FBBF24" />
                <Text className="text-xs font-semibold text-gray-900 ml-1">
                  {vendor.rating.toFixed(1)}
                </Text>
                <Text className="text-xs text-gray-500 ml-1">({vendor.reviews})</Text>
                <Text className="text-xs text-gray-400 mx-1.5">|</Text>
                <Text className="text-xs text-gray-600">
                  {(vendor.followers || 0) > 0 ? `${(vendor.followers || 0).toLocaleString()} followers` : '0 followers'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View className="bg-white mx-4 mt-3 rounded-2xl p-4">
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-xl font-bold text-pink-500">
                {vendor.productCount || 0}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">Products</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center">
              <Text className="text-xl font-bold text-pink-500">
                {vendor.totalSales || 0}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">Sold</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center">
              <Text className="text-xl font-bold text-pink-500">
                {vendor.responseRate || 98}%
              </Text>
              <Text className="text-xs text-gray-600 mt-1">Response</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-4 mt-3">
          <TouchableOpacity
            className="bg-pink-500 py-3.5 rounded-2xl flex-row items-center justify-center"
            onPress={handleChatNow}
            activeOpacity={0.8}
          >
            <MaterialIcon name="message-text" size={20} color="#FFFFFF" />
            <Text className="text-white font-semibold text-base ml-2">Chat Now</Text>
          </TouchableOpacity>
        </View>

        {/* Products Section */}
        <View className="px-4 mt-5 mb-6">
          <View className="flex-row items-center mb-4">
            <MaterialIcon name="package-variant" size={24} color="#CC3366" />
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