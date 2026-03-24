// screens/CartScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '@/navigation';
import {
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon as applyCouponService,
  removeCoupon as removeCouponService,
  CartItem,
  Cart,
} from '@/services/cart.service';
import { useAuth } from '@/context/AuthContext';
import GuestEmailModal from '@/components/GuestEmailModal';
import {
  getGuestCart,
  updateGuestCartItem,
  removeFromGuestCart,
  clearGuestCart,
  getGuestCartTotal,
  GuestCartItem,
} from '@/services/guest-storage.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isGuest, exitGuestMode } = useAuth();

  const [cart, setCart] = useState<Cart | null>(null);
  const [guestCartItems, setGuestCartItems] = useState<GuestCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showGuestEmailModal, setShowGuestEmailModal] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchCart();
    }, [isGuest])
  );

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      if (isGuest) {
        const items = await getGuestCart();
        setGuestCartItems(items);
      } else {
        const response = await getCart();
        if (response.success && response.data.cart) {
          setCart(response.data.cart);
        }
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load cart' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number, variant?: string) => {
    try {
      setIsUpdating(true);
      if (isGuest) {
        const updated = await updateGuestCartItem(itemId, newQuantity, variant);
        setGuestCartItems(updated);
      } else {
        if (!cart) return;
        const response = await updateCartItem(itemId, newQuantity);
        if (response.success && response.data.cart) setCart(response.data.cart);
      }
      Toast.show({ type: 'success', text1: 'Cart Updated' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update quantity' });
    } finally {
      setIsUpdating(false);
    }
  };

  const removeItem = async (itemId: string, variant?: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUpdating(true);
              if (isGuest) {
                const updated = await removeFromGuestCart(itemId, variant);
                setGuestCartItems(updated);
              } else {
                await removeFromCart(itemId);
                await fetchCart();
              }
              Toast.show({ type: 'success', text1: 'Item Removed' });
            } catch (error: any) {
              Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to remove item' });
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  const clearCartHandler = async () => {
    const hasItems = isGuest ? guestCartItems.length > 0 : (cart && cart.items.length > 0);
    if (!hasItems) return;

    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUpdating(true);
              
              if (isGuest) {
                await clearGuestCart();
                setGuestCartItems([]);
              } else {
                const response = await clearCart();
                if (response.success) await fetchCart();
              }
              Toast.show({ type: 'success', text1: 'Cart Cleared' });
            } catch (error: any) {
              Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to clear cart' });
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) {
      Toast.show({
        type: 'info',
        text1: 'Enter Promo Code',
        text2: 'Please enter a promo code',
      });
      return;
    }

    try {
      setIsApplyingCoupon(true);

      const response = await applyCouponService(promoCode);

      if (response.success && response.data.cart) {
        setCart(response.data.cart);
        Toast.show({
          type: 'success',
          text1: 'Coupon Applied',
          text2: `You saved ₦${response.data.cart.discount.toLocaleString()}`,
        });
        setPromoCode('');
      }
    } catch (error: any) {
      console.error('Error applying coupon:', error);
      Toast.show({
        type: 'error',
        text1: 'Invalid Coupon',
        text2: error.response?.data?.message || 'Failed to apply coupon',
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    if (!cart?.couponCode) return;

    try {
      setIsUpdating(true);

      const response = await removeCouponService();

      if (response.success && response.data.cart) {
        setCart(response.data.cart);
        Toast.show({
          type: 'info',
          text1: 'Coupon Removed',
          text2: 'Discount has been removed',
        });
      }
    } catch (error: any) {
      console.error('Error removing coupon:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to remove coupon',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const proceedToCheckout = async () => {
    if (isGuest) {
      if (guestCartItems.length === 0) {
        Toast.show({ type: 'info', text1: 'Cart Empty', text2: 'Please add items to your cart' });
        return;
      }
      // Set flag so after guest registers and app navigates to Main, it redirects to Cart
      await AsyncStorage.setItem('pendingCheckout', 'true');
      setShowGuestEmailModal(true);
      return;
    }
    if (!cart || cart.items.length === 0) {
      Toast.show({ type: 'info', text1: 'Cart Empty', text2: 'Please add items to your cart' });
      return;
    }
    navigation.navigate('Checkout', { cart } as any);
  };

  const renderCartItem = (item: CartItem) => {
    const mainImage = item.product.images?.[0] || '';
    
    // Make sure we have a valid item ID
    const itemId = item._id || (item as any).id;
    
    if (!itemId) {
      console.error('Cart item missing ID:', item);
      return null;
    }

    return (
      <View key={itemId} className="bg-white rounded-2xl p-4 mb-3 flex-row">
        {/* Product Image */}
        <TouchableOpacity
          onPress={() => navigation.navigate('ProductDetails', { productId: item.product._id })}
          className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden mr-3"
        >
          {mainImage ? (
            <Image
              source={{ uri: mainImage }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Icon name="image-outline" size={32} color="#9CA3AF" />
            </View>
          )}
        </TouchableOpacity>

        {/* Product Details */}
        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-1">
            <TouchableOpacity
              onPress={() => navigation.navigate('ProductDetails', { productId: item.product._id })}
              className="flex-1 pr-2"
            >
              <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
                {item.product.name}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => removeItem(itemId)}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              disabled={isUpdating}
            >
              <Icon name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {item.variant && (
            <Text className="text-xs text-gray-500 mb-2">{item.variant}</Text>
          )}

          <View className="flex-row items-center justify-between">
            {/* Quantity Controls */}
            <View className="flex-row items-center bg-gray-100 rounded-full">
              <TouchableOpacity
                onPress={() => {
                  if (item.quantity > 1) {
                    console.log('Decreasing quantity for item:', itemId);
                    updateQuantity(itemId, item.quantity - 1);
                  }
                }}
                className="w-8 h-8 items-center justify-center"
                disabled={isUpdating || item.quantity <= 1}
              >
                <Icon name="remove" size={16} color={item.quantity <= 1 ? '#D1D5DB' : '#6B7280'} />
              </TouchableOpacity>

              <Text className="text-base font-semibold text-gray-900 mx-3">
                {item.quantity}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  console.log('Increasing quantity for item:', itemId);
                  updateQuantity(itemId, item.quantity + 1);
                }}
                className="w-8 h-8 items-center justify-center"
                disabled={isUpdating}
              >
                <Icon name="add" size={16} color="#CC3366" />
              </TouchableOpacity>
            </View>

            {/* Price */}
            <Text className="text-lg font-bold text-gray-900">
              ₦{(item.price * item.quantity).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyCart = () => (
    <View className="flex-1 items-center justify-center py-20">
      <View className="w-32 h-32 rounded-full bg-gray-100 items-center justify-center mb-6">
        <Icon name="cart-outline" size={64} color="#9CA3AF" />
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</Text>
      <Text className="text-gray-500 text-center mb-8 px-8">
        Looks like you haven't added anything to your cart yet
      </Text>
      <TouchableOpacity
        className="bg-pink-500 px-8 py-4 rounded-full"
        onPress={() => navigation.goBack()}
      >
        <Text className="text-white font-semibold text-base">Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
        <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Shopping Cart</Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#CC3366" />
          <Text className="text-gray-500 mt-4">Loading cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Cart total = subtotal - discount (NO SHIPPING)
  const guestTotal = getGuestCartTotal(guestCartItems);
  const cartTotal = isGuest ? guestTotal : (cart ? cart.subtotal - cart.discount : 0);
  const itemCount = isGuest ? guestCartItems.length : (cart?.items?.length || 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Shopping Cart</Text>
        <TouchableOpacity
          onPress={clearCartHandler}
          disabled={itemCount === 0}
        >
          <Icon name="trash-outline" size={22} color={itemCount > 0 ? '#EF4444' : '#D1D5DB'} />
        </TouchableOpacity>
      </View>

      {/* Guest cart view */}
      {isGuest && guestCartItems.length > 0 && (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 180 }}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-semibold text-gray-900">{guestCartItems.length} Item{guestCartItems.length !== 1 ? 's' : ''} in Cart</Text>
              <TouchableOpacity onPress={clearCartHandler}><Text className="text-pink-500 font-semibold">Clear All</Text></TouchableOpacity>
            </View>
            {guestCartItems.map((item) => (
              <View key={item.productId + (item.variant || '')} className="bg-white rounded-2xl p-4 mb-3 flex-row">
                <View className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden mr-3">
                  {item.product.images?.[0] ? (
                    <Image source={{ uri: item.product.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <View className="flex-1 items-center justify-center"><Icon name="image-outline" size={32} color="#9CA3AF" /></View>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>{item.product.name}</Text>
                  {item.variant && <Text className="text-xs text-gray-500 mb-1">{item.variant}</Text>}
                  <Text className="text-base font-bold text-gray-900">₦{item.product.price.toLocaleString()}</Text>
                  <View className="flex-row items-center mt-2">
                    <TouchableOpacity className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center" onPress={() => item.quantity > 1 && updateQuantity(item.productId, item.quantity - 1, item.variant)}>
                      <Icon name="remove" size={16} color="#111827" />
                    </TouchableOpacity>
                    <Text className="mx-4 text-base font-semibold text-gray-900">{item.quantity}</Text>
                    <TouchableOpacity className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center" onPress={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}>
                      <Icon name="add" size={16} color="#111827" />
                    </TouchableOpacity>
                    <View className="flex-1" />
                    <TouchableOpacity onPress={() => removeItem(item.productId, item.variant)}>
                      <Icon name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            <View className="bg-white rounded-2xl p-4">
              <Text className="text-base font-semibold text-gray-900 mb-4">Cart Summary</Text>
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-gray-600">Subtotal ({guestCartItems.reduce((s, i) => s + i.quantity, 0)} items)</Text>
                <Text className="text-gray-900 font-medium">₦{guestTotal.toLocaleString()}</Text>
              </View>
              <View className="border-t border-gray-200 pt-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-lg font-bold text-gray-900">Cart Total</Text>
                  <Text className="text-2xl font-bold text-gray-900">₦{guestTotal.toLocaleString()}</Text>
                </View>
              </View>
              <View className="mt-4 bg-blue-50 rounded-xl p-3 flex-row items-center">
                <Icon name="information-circle" size={20} color="#3B82F6" />
                <Text className="text-blue-700 text-sm ml-2 flex-1">Shipping fees will be calculated at checkout</Text>
              </View>
            </View>
          </ScrollView>
          <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
            <View className="mb-3">
              <Text className="text-gray-600 text-sm">Cart Total</Text>
              <Text className="text-2xl font-bold text-gray-900">₦{guestTotal.toLocaleString()}</Text>
              <Text className="text-gray-500 text-xs mt-1">+ Shipping (calculated at checkout)</Text>
            </View>
            <TouchableOpacity className="bg-pink-500 py-4 rounded-xl flex-row items-center justify-center" onPress={proceedToCheckout} activeOpacity={0.8}>
              <Text className="text-white font-bold text-base">Proceed to Checkout</Text>
              <Icon name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {isGuest && guestCartItems.length === 0 && !isLoading && renderEmptyCart()}

      {!isGuest && (!cart || cart.items.length === 0) && !isLoading && renderEmptyCart()}

      {!isGuest && cart && cart.items.length > 0 && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 180 }}
        >
          {/* Items Count Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-base font-semibold text-gray-900">
              {cart.items.length} Item{cart.items.length !== 1 ? 's' : ''} in Cart
            </Text>
            <TouchableOpacity onPress={clearCartHandler}>
              <Text className="text-pink-500 font-semibold">Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Cart Items */}
          {cart.items.map(renderCartItem)}

          {/* Promo Code Section */}
          <View className="bg-white rounded-2xl p-4 mb-3">
            <Text className="text-base font-semibold text-gray-900 mb-3">Apply Promo Code</Text>
            <View className="flex-row">
              <TextInput
                className="flex-1 bg-gray-50 px-4 py-3 rounded-lg text-base text-gray-900 mr-2"
                placeholder="Enter promo code"
                placeholderTextColor="#9CA3AF"
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
                editable={!cart.couponCode && !isApplyingCoupon}
              />
              {cart.couponCode ? (
                <TouchableOpacity
                  className="bg-gray-200 px-6 py-3 rounded-lg items-center justify-center"
                  onPress={handleRemoveCoupon}
                  disabled={isUpdating}
                >
                  <Text className="text-gray-700 font-semibold">Remove</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="bg-pink-500 px-6 py-3 rounded-lg items-center justify-center"
                  onPress={handleApplyCoupon}
                  disabled={isApplyingCoupon}
                >
                  {isApplyingCoupon ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-semibold">Apply</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
            {cart.couponCode && (
              <View className="mt-3 flex-row items-center bg-green-50 px-3 py-2 rounded-lg">
                <Icon name="checkmark-circle" size={20} color="#10B981" />
                <Text className="text-green-700 font-medium ml-2">
                  Coupon '{cart.couponCode}' applied
                </Text>
              </View>
            )}
          </View>

          {/* ✅ Cart Summary (NO SHIPPING) */}
          <View className="bg-white rounded-2xl p-4">
            <Text className="text-base font-semibold text-gray-900 mb-4">Cart Summary</Text>

            <View className="space-y-3">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-gray-600">
                  Subtotal ({cart.items.reduce((sum, item) => sum + item.quantity, 0)} items)
                </Text>
                <Text className="text-gray-900 font-medium">
                  ₦{cart.subtotal.toLocaleString()}
                </Text>
              </View>

              {cart.discount > 0 && (
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-green-600 font-medium">
                    Discount ({cart.couponCode})
                  </Text>
                  <Text className="text-green-600 font-medium">
                    -₦{cart.discount.toLocaleString()}
                  </Text>
                </View>
              )}

              <View className="border-t border-gray-200 pt-3">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-lg font-bold text-gray-900">Cart Total</Text>
                  <Text className="text-2xl font-bold text-gray-900">
                    ₦{cartTotal.toLocaleString()}
                  </Text>
                </View>
                {cart.discount > 0 && (
                  <Text className="text-green-600 font-medium text-right">
                    You save ₦{cart.discount.toLocaleString()}
                  </Text>
                )}
              </View>
            </View>

            {/* ✅ Shipping Note - Different for digital vs physical */}
            {cart.items.every((item: CartItem) => (item.product as any).productType === 'digital') ? (
              <View className="mt-4 bg-purple-50 rounded-xl p-3">
                <View className="flex-row items-center">
                  <Icon name="cloud-download" size={20} color="#8B5CF6" />
                  <Text className="text-purple-700 text-sm ml-2 flex-1">
                    Your digital products will be available for download immediately after payment
                  </Text>
                </View>
              </View>
            ) : (
              <View className="mt-4 bg-blue-50 rounded-xl p-3">
                <View className="flex-row items-center">
                  <Icon name="information-circle" size={20} color="#3B82F6" />
                  <Text className="text-blue-700 text-sm ml-2 flex-1">
                    Shipping fees will be calculated at checkout based on your delivery address
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* ✅ Checkout Button - Shows Cart Total (NO SHIPPING) */}
      {cart && cart.items.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-gray-600 text-sm">Cart Total</Text>
              <Text className="text-2xl font-bold text-gray-900">
                ₦{cartTotal.toLocaleString()}
              </Text>
              {cart.discount > 0 && (
                <Text className="text-green-600 font-medium text-sm">
                  You save ₦{cart.discount.toLocaleString()}
                </Text>
              )}
              {cart.items.every((item: CartItem) => (item.product as any).productType === 'digital') ? (
                <Text className="text-purple-500 text-xs mt-1">
                  Digital download - No shipping needed
                </Text>
              ) : (
                <Text className="text-gray-500 text-xs mt-1">
                  + Shipping (calculated at checkout)
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            className="bg-pink-500 py-4 rounded-xl flex-row items-center justify-center"
            onPress={proceedToCheckout}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-base">Proceed to Checkout</Text>
            <Icon name="arrow-forward" size={20} color="#FFFFFF" className="ml-2" />
          </TouchableOpacity>
        </View>
      )}

      <GuestEmailModal
        visible={showGuestEmailModal}
        onClose={() => { setShowGuestEmailModal(false); AsyncStorage.removeItem('pendingCheckout'); }}
        onSuccess={() => setShowGuestEmailModal(false)}
        onGoToSignIn={() => { setShowGuestEmailModal(false); AsyncStorage.removeItem('pendingCheckout'); exitGuestMode(); }}
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CartScreen;