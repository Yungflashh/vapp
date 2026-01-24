import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import {
  getWishlist,
  removeFromWishlist,
  addToCart,
  getCart,
} from '@/services/api';
import { useFocusEffect } from '@react-navigation/native';

type WishlistScreenProps = NativeStackScreenProps<RootStackParamList, 'Wishlist'>;

// Define the structure based on backend response
interface WishlistItem {
  _id: string;
  product: {
    _id: string;
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    quantity: number;
    images: string[];
    status: string;
    averageRating: number;
    discountPercentage: number;
    inStock: boolean;
  };
  addedAt: string;
}

const WishlistScreen = ({ navigation }: WishlistScreenProps) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'newest' | 'discount'>('newest');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetchWishlist();
    fetchCartCount();
  }, []);

  // Refresh cart count when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchCartCount();
    }, [])
  );

  const fetchWishlist = async () => {
    try {
      setIsLoading(true);
      const response = await getWishlist();
      
      if (response.success && response.data.wishlist.items) {
        setWishlistItems(response.data.wishlist.items);
        console.log('✅ Wishlist items set to state:', response.data.wishlist.items.length);
      }
    } catch (error) {
      console.error('❌ Error fetching wishlist:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load wishlist',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await getCart();
      if (response.success && response.data.cart) {
        const itemCount = response.data.cart.items.length;
        setCartCount(itemCount);
        console.log('🛒 Cart count updated:', itemCount);
      }
    } catch (error) {
      console.error('❌ Error fetching cart count:', error);
      // Don't show error toast for cart count failure
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchWishlist(), fetchCartCount()]);
    setIsRefreshing(false);
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      
      // Update local state
      setWishlistItems(prev => prev.filter(item => item.product.id !== productId));
      
      Toast.show({
        type: 'success',
        text1: 'Removed',
        text2: 'Item removed from wishlist',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to remove item',
      });
    }
  };

  const handleAddToCart = async (item: WishlistItem) => {
    try {
      await addToCart(item.product.id, 1);
      
      // Update cart count
      await fetchCartCount();
      
      Toast.show({
        type: 'success',
        text1: 'Added to Cart',
        text2: `${item.product.name} added to cart`,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.response?.data?.message || 'Failed to add to cart',
      });
    }
  };

  const handleViewProduct = (productId: string) => {
    navigation.navigate('ProductDetails', { productId });
  };

  const handleSortChange = (sortOption: typeof sortBy) => {
    setSortBy(sortOption);
    setShowFilterMenu(false);
    
    let sortedItems = [...wishlistItems];
    
    switch (sortOption) {
      case 'price_asc':
        sortedItems.sort((a, b) => a.product.price - b.product.price);
        Toast.show({ type: 'info', text1: 'Sorted', text2: 'Price: Low to High' });
        break;
      case 'price_desc':
        sortedItems.sort((a, b) => b.product.price - a.product.price);
        Toast.show({ type: 'info', text1: 'Sorted', text2: 'Price: High to Low' });
        break;
      case 'newest':
        sortedItems.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        Toast.show({ type: 'info', text1: 'Sorted', text2: 'Newest First' });
        break;
      case 'discount':
        sortedItems.sort((a, b) => b.product.discountPercentage - a.product.discountPercentage);
        Toast.show({ type: 'info', text1: 'Sorted', text2: 'Highest Discount' });
        break;
    }
    
    setWishlistItems(sortedItems);
  };

  const renderWishlistItem = (item: WishlistItem) => {
    const { product } = item;
    const mainImage = product.images?.[0] || '';
    const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
    const discountPercentage = product.discountPercentage > 0 
      ? `-${product.discountPercentage}%`
      : hasDiscount 
        ? `-${Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)}%`
        : null;
    
    const rating = product.averageRating || 0;
    const stock = product.quantity || 0;

    return (
      <View key={item._id} className="bg-white mb-3 rounded-xl overflow-hidden">
        <View className="flex-row p-3">
          {/* Product Image */}
          <View className="relative mr-3">
            <View className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
              {mainImage ? (
                <Image
                  source={{ uri: mainImage }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Icon name="image-outline" size={28} color="#9CA3AF" />
                </View>
              )}
            </View>
            
            {/* Wishlist Heart Button */}
            <TouchableOpacity
              className="absolute top-1 right-1 w-7 h-7 bg-white rounded-full items-center justify-center shadow-sm"
              onPress={() => handleRemoveFromWishlist(product.id)}
            >
              <Icon name="heart" size={16} color="#EC4899" />
            </TouchableOpacity>

            {/* Low Stock Badge */}
            {stock < 10 && stock > 0 && (
              <View className="absolute bottom-0 left-0 right-0 bg-red-500 px-1 py-0.5">
                <Text className="text-white text-[9px] font-bold text-center">Low Stock</Text>
              </View>
            )}
          </View>

          {/* Product Details */}
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
              {product.name}
            </Text>
            
            {/* Rating */}
            {rating > 0 && (
              <View className="flex-row items-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    name={star <= Math.floor(rating) ? 'star' : 'star-outline'}
                    size={10}
                    color="#FBBF24"
                  />
                ))}
                <Text className="text-xs text-gray-600 ml-1">
                  ({rating.toFixed(1)})
                </Text>
              </View>
            )}

            {/* Price Section */}
            <View className="flex-row items-center mb-3">
              <Text className="text-lg font-bold text-gray-900">
                ₦{product.price.toLocaleString()}
              </Text>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <>
                  <Text className="text-xs text-gray-400 line-through ml-2">
                    ₦{product.compareAtPrice.toLocaleString()}
                  </Text>
                  {discountPercentage && (
                    <Text className="text-xs font-bold text-green-600 ml-2">
                      {discountPercentage}
                    </Text>
                  )}
                </>
              )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center py-2 rounded-lg bg-gray-100"
                onPress={() => handleViewProduct(product.id)}
                activeOpacity={0.7}
              >
                <Icon name="eye-outline" size={14} color="#374151" />
                <Text className="text-gray-900 text-xs font-semibold ml-1">View</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${
                  !product.inStock ? 'bg-gray-300' : 'bg-pink-500'
                }`}
                onPress={() => handleAddToCart(item)}
                activeOpacity={0.7}
                disabled={!product.inStock}
              >
                <Icon name="cart-outline" size={14} color="#FFFFFF" />
                <Text className="text-white text-xs font-semibold ml-1">
                  {!product.inStock ? 'Out' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Loading wishlist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
        <Text className="text-xl font-bold">
          <Text className="text-pink-500">My</Text>
          <Text className="text-gray-900"> Wishlist</Text>
        </Text>
        
        <TouchableOpacity
          className="relative w-10 h-10 items-center justify-center"
          onPress={() => navigation.navigate('Cart')}
        >
          <Icon name="cart-outline" size={24} color="#111827" />
          {cartCount > 0 && (
            <View className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full items-center justify-center">
              <Text className="text-[10px] text-white font-bold">{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Items Count and Filter Bar */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between">
        <View>
          <Text className="text-xs text-gray-500">You have</Text>
          <Text className="text-base font-bold text-gray-900">
            {wishlistItems.length} items saved
          </Text>
        </View>
        
        <TouchableOpacity
          className="flex-row items-center px-3 py-1.5 bg-white border border-gray-300 rounded-lg"
          onPress={() => setShowFilterMenu(!showFilterMenu)}
        >
          <Icon name="funnel-outline" size={14} color="#374151" />
          <Text className="text-gray-900 text-xs font-semibold ml-1.5">Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Menu */}
      {showFilterMenu && (
        <View className="bg-white px-4 py-3 border-b border-gray-100">
          <Text className="text-xs font-semibold text-gray-900 mb-2">Sort By:</Text>
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity 
              className={`px-3 py-1.5 rounded-full ${sortBy === 'price_asc' ? 'bg-pink-500' : 'bg-gray-100'}`}
              onPress={() => handleSortChange('price_asc')}
            >
              <Text className={`text-xs font-medium ${sortBy === 'price_asc' ? 'text-white' : 'text-gray-700'}`}>
                Price: Low to High
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className={`px-3 py-1.5 rounded-full ${sortBy === 'price_desc' ? 'bg-pink-500' : 'bg-gray-100'}`}
              onPress={() => handleSortChange('price_desc')}
            >
              <Text className={`text-xs font-medium ${sortBy === 'price_desc' ? 'text-white' : 'text-gray-700'}`}>
                Price: High to Low
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className={`px-3 py-1.5 rounded-full ${sortBy === 'newest' ? 'bg-pink-500' : 'bg-gray-100'}`}
              onPress={() => handleSortChange('newest')}
            >
              <Text className={`text-xs font-medium ${sortBy === 'newest' ? 'text-white' : 'text-gray-700'}`}>
                Newest First
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className={`px-3 py-1.5 rounded-full ${sortBy === 'discount' ? 'bg-pink-500' : 'bg-gray-100'}`}
              onPress={() => handleSortChange('discount')}
            >
              <Text className={`text-xs font-medium ${sortBy === 'discount' ? 'text-white' : 'text-gray-700'}`}>
                Highest Discount
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Wishlist Items */}
      {wishlistItems.length === 0 ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={['#EC4899']}
              tintColor="#EC4899"
            />
          }
        >
          <Icon name="heart-outline" size={80} color="#D1D5DB" />
          <Text className="text-xl font-bold text-gray-900 mt-4">Your Wishlist is Empty</Text>
          <Text className="text-gray-500 text-center mt-2 mb-6">
            Start adding items you love to your wishlist
          </Text>
          <TouchableOpacity
            className="bg-pink-500 px-8 py-3 rounded-lg"
            onPress={() => navigation.navigate('Main')}
          >
            <Text className="text-white font-semibold">Browse Products</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1 bg-gray-50"
          contentContainerStyle={{ padding: 16 }}
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
          {wishlistItems.map((item) => renderWishlistItem(item))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default WishlistScreen;