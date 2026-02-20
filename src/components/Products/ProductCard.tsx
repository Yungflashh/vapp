// components/ProductCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../../services/product.service';
import { addToCart } from '../../services/cart.service';
import { addToWishlist, removeFromWishlist } from '../../services/wishlist.service';

interface ProductCardProps {
  product: Product;
  onPress?: (product: Product) => void;
  style?: 'grid' | 'list';
  showAddToCart?: boolean;
  showWishlist?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  style = 'grid',
  showAddToCart = true,
  showWishlist = true,
}) => {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);

  const mainImage = product.thumbnail || product.images?.[0] || '';
  const discountPercentage = product.discountPercentage || 
    (product.originalPrice ? `-${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%` : null);

  const handleAddToCart = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Toast.show({
          type: 'warning',
          text1: 'Login Required',
          text2: 'Please login to add items to cart',
        });
        return;
      }

      setIsCartLoading(true);
      await addToCart(product.id, 1);
      
      Toast.show({
        type: 'success',
        text1: 'Added to Cart',
        text2: `${product.name} has been added to your cart`,
      });
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to add item to cart',
      });
    } finally {
      setIsCartLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Toast.show({
          type: 'warning',
          text1: 'Login Required',
          text2: 'Please login to add items to wishlist',
        });
        return;
      }

      setIsWishlistLoading(true);
      
      if (isInWishlist) {
        await removeFromWishlist(product.id);
        setIsInWishlist(false);
        Toast.show({
          type: 'info',
          text1: 'Removed from Wishlist',
          text2: `${product.name} removed from your wishlist`,
        });
      } else {
        await addToWishlist(product.id);
        setIsInWishlist(true);
        Toast.show({
          type: 'success',
          text1: 'Added to Wishlist',
          text2: `${product.name} added to your wishlist`,
        });
      }
    } catch (error: any) {
      console.error('Error toggling wishlist:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update wishlist',
      });
    } finally {
      setIsWishlistLoading(false);
    }
  };

  if (style === 'list') {
    return (
      <TouchableOpacity 
        className="bg-white rounded-2xl overflow-hidden shadow-sm mb-3 flex-row"
        onPress={() => onPress?.(product)}
        activeOpacity={0.8}
      >
        <View className="relative w-28 h-28">
          <View className="bg-gray-100 w-full h-full items-center justify-center">
            {mainImage ? (
              <Image source={{ uri: mainImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Icon name="image-outline" size={32} color="#9CA3AF" />
            )}
          </View>
          {discountPercentage && (
            <View className="absolute top-2 left-2 bg-yellow-400 px-2 py-1 rounded-full">
              <Text className="text-xs font-bold text-gray-900">{discountPercentage}</Text>
            </View>
          )}
        </View>

        <View className="flex-1 p-3">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 pr-2">
              <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
                {product.name}
              </Text>
              <View className="flex-row items-center">
                <Icon name="star" size={12} color="#FBBF24" />
                <Text className="text-xs text-gray-900 font-semibold ml-1">{product.rating.toFixed(1)}</Text>
                <Text className="text-xs text-gray-500 ml-1">({product.reviews})</Text>
              </View>
            </View>
            {showWishlist && (
              <TouchableOpacity 
                className="w-8 h-8 bg-pink-100 rounded-full items-center justify-center"
                onPress={(e) => {
                  e.stopPropagation();
                  handleToggleWishlist();
                }}
                disabled={isWishlistLoading}
              >
                <Icon 
                  name={isInWishlist ? "heart" : "heart-outline"} 
                  size={16} 
                  color="#EC4899" 
                />
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row items-center justify-between mt-auto">
            <View>
              <Text className="text-lg font-bold text-gray-900">₦{product.price.toLocaleString()}</Text>
              {product.originalPrice && product.originalPrice > product.price && (
                <Text className="text-xs text-gray-400 line-through">₦{product.originalPrice.toLocaleString()}</Text>
              )}
            </View>
            {showAddToCart && (
              <TouchableOpacity 
                className="w-9 h-9 bg-pink-500 rounded-xl items-center justify-center"
                onPress={(e) => {
                  e.stopPropagation();
                  handleAddToCart();
                }}
                disabled={isCartLoading}
              >
                {isCartLoading ? (
                  <Icon name="ellipsis-horizontal" size={18} color="#FFFFFF" />
                ) : (
                  <Icon name="cart" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Grid style (default)
  return (
    <TouchableOpacity 
      className="w-[48%] mb-4"
      onPress={() => onPress?.(product)}
      activeOpacity={0.8}
    >
      <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <View className="relative">
          <View className="bg-gray-100 aspect-square items-center justify-center">
            {mainImage ? (
              <Image source={{ uri: mainImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Icon name="image-outline" size={48} color="#9CA3AF" />
            )}
          </View>
          
          {discountPercentage && (
            <View className="absolute top-3 left-3 bg-yellow-400 px-3 py-1.5 rounded-full">
              <Text className="text-xs font-bold text-gray-900">{discountPercentage}</Text>
            </View>
          )}
          
          {showWishlist && (
            <TouchableOpacity 
              className="absolute top-3 right-3 w-9 h-9 bg-pink-100 rounded-full items-center justify-center"
              onPress={(e) => {
                e.stopPropagation();
                handleToggleWishlist();
              }}
              disabled={isWishlistLoading}
            >
              <Icon 
                name={isInWishlist ? "heart" : "heart-outline"} 
                size={20} 
                color="#EC4899" 
              />
            </TouchableOpacity>
          )}
        </View>

        <View className="p-3">
          <View className="flex-row items-center mb-1">
            <Icon name="star" size={14} color="#FBBF24" />
            <Text className="text-sm text-gray-900 font-semibold ml-1">{product.rating.toFixed(1)}</Text>
            <Text className="text-sm text-gray-500 ml-1">({product.reviews})</Text>
          </View>
          
          <Text className="text-sm font-semibold text-gray-900 mb-2" numberOfLines={2}>
            {product.name}
          </Text>
          
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-bold text-gray-900">₦{product.price.toLocaleString()}</Text>
              {product.originalPrice && product.originalPrice > product.price && (
                <Text className="text-xs text-gray-400 line-through">₦{product.originalPrice.toLocaleString()}</Text>
              )}
            </View>
            
            {showAddToCart && (
              <TouchableOpacity 
                className="w-10 h-10 bg-pink-500 rounded-xl items-center justify-center"
                onPress={(e) => {
                  e.stopPropagation();
                  handleAddToCart();
                }}
                disabled={isCartLoading}
              >
                {isCartLoading ? (
                  <Icon name="ellipsis-horizontal" size={20} color="#FFFFFF" />
                ) : (
                  <Icon name="cart" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};