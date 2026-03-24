// components/ProductCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../../services/product.service';
import { addToCart } from '../../services/cart.service';
import { addToWishlist, removeFromWishlist } from '../../services/wishlist.service';
import { addToGuestCart, addToGuestWishlist, removeFromGuestWishlist } from '../../services/guest-storage.service';

interface ProductCardProps {
  product: Product;
  onPress?: (product: Product) => void;
  style?: 'grid' | 'list';
  showAddToCart?: boolean;
  showWishlist?: boolean;
}

// Track items added to cart in this session (across all ProductCards)
let sessionCartAdds = 0;

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  style = 'grid',
  showAddToCart = true,
  showWishlist = true,
}) => {
  const navigation = useNavigation<any>();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [showCartPopup, setShowCartPopup] = useState(false);

  const mainImage = product.thumbnail || product.images?.[0] || '';
  const discountPercentage = product.discountPercentage ||
    (product.originalPrice ? `-${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%` : null);

  const handleAddToCart = async () => {
    try {
      setIsCartLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        // Guest: save locally
        await addToGuestCart(
          { _id: product.id, name: product.name, price: product.price, images: product.images || [] },
          1
        );
      } else {
        await addToCart(product.id, 1);
      }

      sessionCartAdds++;
      if (sessionCartAdds <= 1) {
        // Show popup on first item added
        setShowCartPopup(true);
      } else {
        Toast.show({
          type: 'success',
          text1: 'Added to Cart',
          text2: `${product.name} has been added to your cart`,
        });
      }
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
      setIsWishlistLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        // Guest: save locally
        if (isInWishlist) {
          await removeFromGuestWishlist(product.id);
          setIsInWishlist(false);
          Toast.show({ type: 'info', text1: 'Removed from Wishlist', text2: `${product.name} removed` });
        } else {
          await addToGuestWishlist(product.id);
          setIsInWishlist(true);
          Toast.show({ type: 'success', text1: 'Added to Wishlist', text2: `${product.name} saved` });
        }
      } else {
        if (isInWishlist) {
          await removeFromWishlist(product.id);
          setIsInWishlist(false);
          Toast.show({ type: 'info', text1: 'Removed from Wishlist', text2: `${product.name} removed` });
        } else {
          await addToWishlist(product.id);
          setIsInWishlist(true);
          Toast.show({ type: 'success', text1: 'Added to Wishlist', text2: `${product.name} saved` });
        }
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

  const cartPopupModal = (
    <Modal transparent visible={showCartPopup} animationType="fade" onRequestClose={() => setShowCartPopup(false)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340 }}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Icon name="checkmark-circle" size={32} color="#10B981" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Added to Cart!</Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>{product.name}</Text>
          </View>
          <TouchableOpacity
            onPress={() => { setShowCartPopup(false); navigation.navigate('Cart'); }}
            style={{ backgroundColor: '#CC3366', paddingVertical: 14, borderRadius: 12, marginBottom: 12 }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 15 }}>Proceed to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCartPopup(false)}
            style={{ backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 12 }}
          >
            <Text style={{ color: '#374151', textAlign: 'center', fontWeight: '700', fontSize: 15 }}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (style === 'list') {
    return (
      <>
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
          {/* Digital/Physical Badge */}
          <View
            className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: product.productType === 'digital' ? '#DBEAFE' : '#F3E8FF' }}
          >
            <Text
              className="text-[10px] font-bold"
              style={{ color: product.productType === 'digital' ? '#3B82F6' : '#7C3AED' }}
            >
              {product.productType === 'digital' ? 'Digital' : 'Physical'}
            </Text>
          </View>
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
                className="w-8 h-8 bg-white rounded-full items-center justify-center"
                onPress={(e) => { e.stopPropagation(); handleToggleWishlist(); }}
                disabled={isWishlistLoading}
              >
                <Icon name={isInWishlist ? "heart" : "heart-outline"} size={16} color="#CC3366" />
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
                onPress={(e) => { e.stopPropagation(); handleAddToCart(); }}
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
      {cartPopupModal}
      </>
    );
  }

  // Grid style (default)
  return (
    <>
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

          {/* Digital/Physical Badge */}
          <View
            className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: product.productType === 'digital' ? '#DBEAFE' : '#F3E8FF' }}
          >
            <Text
              className="text-[10px] font-bold"
              style={{ color: product.productType === 'digital' ? '#3B82F6' : '#7C3AED' }}
            >
              {product.productType === 'digital' ? 'Digital' : 'Physical'}
            </Text>
          </View>

          {showWishlist && (
            <TouchableOpacity
              className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full items-center justify-center"
              onPress={(e) => { e.stopPropagation(); handleToggleWishlist(); }}
              disabled={isWishlistLoading}
            >
              <Icon name={isInWishlist ? "heart" : "heart-outline"} size={20} color="#CC3366" />
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
                onPress={(e) => { e.stopPropagation(); handleAddToCart(); }}
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
    {cartPopupModal}
    </>
  );
};
