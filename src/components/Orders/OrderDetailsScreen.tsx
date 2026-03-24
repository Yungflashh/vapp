// screens/OrderDetailsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { getOrderById, trackOrder, cancelOrder, completeOrder, Order } from '@/services/order.service';
import api from '@/services/api.config';

type OrderDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'OrderDetails'>;

const DISPUTE_WINDOW_DAYS = 7;

const OrderDetailsScreen = ({ route, navigation }: OrderDetailsScreenProps) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [supportUserId, setSupportUserId] = useState<string>('');
  const [tracking, setTracking] = useState<any>(null);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    api.get('/auth/support-user').then((res) => {
      if (res.data.success) setSupportUserId(res.data.data.user.id);
    }).catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrderDetails();
    }, [orderId])
  );

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      const response = await getOrderById(orderId);

      if (response.success && response.data?.order) {
        const orderData = response.data.order;
        setOrder(orderData);

        // Fetch tracking if order has tracking number
        if (orderData.trackingNumber) {
          try {
            const trackingResponse = await trackOrder(orderId);
            if (trackingResponse.success) {
              if (trackingResponse.data.multiVendor && trackingResponse.data.tracking) {
                const trackings = trackingResponse.data.tracking;
                if (trackings.length > 0 && trackings[0].trackingUrl) {
                  setTrackingUrl(trackings[0].trackingUrl);
                }
                setTracking(trackings[0]?.tracking || null);
              } else {
                setTracking(trackingResponse.data.tracking);
                if (trackingResponse.data.trackingUrl) {
                  setTrackingUrl(trackingResponse.data.trackingUrl);
                }
              }
            }
          } catch (error: any) {
            console.log('Tracking not available:', error.message);
          }
        }
      }
    } catch (error: any) {
      console.error('Fetch order error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load order details',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please provide a reason for cancellation',
      });
      return;
    }

    try {
      setIsCancelling(true);
      const response = await cancelOrder(orderId, cancelReason);
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Order cancelled successfully',
        });
        setShowCancelModal(false);
        await fetchOrderDetails();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to cancel order',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCompleteOrder = () => {
    Alert.alert(
      'Complete Order',
      'Are you sure you want to confirm that you received this order completely in good condition? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            try {
              setIsCompleting(true);
              const response = await completeOrder(orderId);
              if (response.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: 'Order completed successfully!',
                });
                await fetchOrderDetails();
              }
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to complete order',
              });
            } finally {
              setIsCompleting(false);
            }
          },
        },
      ]
    );
  };

  const openTrackingUrl = () => {
    if (trackingUrl) {
      Linking.openURL(trackingUrl);
    }
  };

  // ✅ Check if dispute is available for this order
  const canDisputeOrder = (): boolean => {
    if (!order) return false;

    // Must be delivered, confirmed, shipped, or in_transit
    const disputeStatuses = ['delivered', 'confirmed', 'shipped', 'in_transit'];
    if (!disputeStatuses.includes(order.status)) return false;

    // Payment must be completed
    if (order.paymentStatus !== 'completed') return false;

    // Must not already be disputed
    if (order.status === 'disputed') return false;

    // Check 7-day window
    const orderDate = new Date((order as any).updatedAt || (order as any).createdAt);
    const deadline = new Date(orderDate);
    deadline.setDate(deadline.getDate() + DISPUTE_WINDOW_DAYS);
    if (new Date() > deadline) return false;

    return true;
  };

  // ✅ Calculate days remaining for dispute window
  const getDisputeDeadline = (): string | null => {
    if (!order) return null;
    const orderDate = new Date((order as any).updatedAt || (order as any).createdAt);
    const deadline = new Date(orderDate);
    deadline.setDate(deadline.getDate() + DISPUTE_WINDOW_DAYS);

    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return null;
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#CC3366';
      case 'confirmed':
      case 'processing':
        return '#F59E0B';
      case 'shipped':
      case 'in_transit':
        return '#3B82F6';
      case 'delivered':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      case 'disputed':
        return '#7C3AED';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      case 'disputed':
        return 'Disputed';
      default:
        return status;
    }
  };

  const canCancelOrder = () => {
    if (!order) return false;
    return ['pending', 'confirmed'].includes(order.status);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#CC3366" />
          <Text className="text-gray-500 mt-4">Loading order details...</Text>
        </View>
      
      </KeyboardAvoidingView>
    </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 items-center justify-center">
          <Icon name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-gray-900 font-bold text-lg mt-4">Order Not Found</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-pink-500 px-6 py-3 rounded-xl mt-6"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      
      </KeyboardAvoidingView>
    </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(order.status);
  const statusLabel = getStatusLabel(order.status);
  const canCancel = canCancelOrder();
  const canDispute = canDisputeOrder();
  const disputeDeadline = getDisputeDeadline();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold ml-2">Order Details</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View className="bg-white px-4 py-6 border-b border-gray-100">
          <View className="items-center">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: `${statusColor}15` }}
            >
              <Icon
                name={
                  order.status === 'delivered'
                    ? 'checkmark-circle'
                    : order.status === 'cancelled'
                    ? 'close-circle'
                    : order.status === 'disputed'
                    ? 'shield-half'
                    : 'time'
                }
                size={48}
                color={statusColor}
              />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">{statusLabel}</Text>
            <Text className="text-sm text-gray-500">Order #{order.orderNumber}</Text>
          </View>
        </View>

        {/* ✅ Dispute Banner - Show when order is disputed */}
        {order.status === 'disputed' && (
          <View className="bg-purple-50 px-4 py-3 border-b border-purple-100">
            <View className="flex-row items-center">
              <Icon name="shield-half" size={20} color="#7C3AED" />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-bold text-purple-800">Dispute in Progress</Text>
                <Text className="text-xs text-purple-600 mt-0.5">
                  Your dispute is being reviewed. You'll be notified of the outcome.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('DisputeCenter' as any)}
              >
                <Text className="text-xs font-bold text-purple-700">View</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Order Items */}
        <View className="bg-white px-4 py-4 mt-3">
          <Text className="text-base font-bold text-gray-900 mb-3">Order Items</Text>
          {order.items.map((item, index) => {
            const productId = typeof item.product === 'object' ? (item.product as any)?._id : item.product;
            return (
              <TouchableOpacity
                key={index}
                className="flex-row items-center mb-4"
                onPress={() => {
                  if (productId) {
                    navigation.navigate('ProductDetails', { productId });
                  }
                }}
                activeOpacity={0.7}
              >
                <View className="w-16 h-16 bg-pink-50 rounded-xl overflow-hidden mr-3">
                  {item.productImage ? (
                    <Image
                      source={{ uri: item.productImage }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Icon name="image-outline" size={24} color="#CC3366" />
                    </View>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-sm font-bold text-gray-900 mr-2">
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </Text>
                  <Icon name="chevron-forward" size={16} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Delivery Address */}
        {order.shippingAddress && order.shippingAddress.city && (
          <View className="bg-white px-4 py-4 mt-3">
            <Text className="text-base font-bold text-gray-900 mb-3">Delivery Address</Text>
            <View className="flex-row items-start">
              <Icon name="location" size={20} color="#CC3366" />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-semibold text-gray-900">
                  {order.shippingAddress.fullName || 'Customer'}
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  {order.shippingAddress.street}
                </Text>
                <Text className="text-sm text-gray-600">
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </Text>
                <Text className="text-sm text-gray-600">
                  {order.shippingAddress.country}
                </Text>
                {order.shippingAddress.phone && (
                  <Text className="text-sm text-gray-600 mt-2">
                    📞 {order.shippingAddress.phone}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Digital Product Delivery */}
        {order.deliveryType === 'digital' && (
          <View className="bg-white px-4 py-4 mt-3">
            <Text className="text-base font-bold text-gray-900 mb-3">Delivery Method</Text>
            <View className="bg-purple-50 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <Icon name="cloud-download" size={24} color="#8B5CF6" />
                <Text className="text-sm font-bold text-gray-900 ml-3">Digital Delivery</Text>
              </View>
              <Text className="text-xs text-gray-600">
                Instant access after payment confirmation
              </Text>
            </View>
          </View>
        )}

        {/* Track Shipment Button */}
        {trackingUrl && (
          <View className="bg-white px-4 py-4 mt-3">
            <TouchableOpacity
              onPress={openTrackingUrl}
              className="bg-blue-500 rounded-2xl p-4"
              style={{
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <View className="flex-row items-center justify-center">
                <Icon name="locate" size={24} color="#FFFFFF" />
                <Text className="text-white text-base font-bold ml-2">
                  Track Shipment on ShipBubble
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Tracking Information */}
        {order.trackingNumber && (
          <View className="bg-white px-4 py-4 mt-3">
            <Text className="text-base font-bold text-gray-900 mb-3">Tracking Information</Text>
            <View className="bg-blue-50 rounded-xl p-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-semibold text-gray-700">Shipment ID</Text>
                <TouchableOpacity
                  onPress={() => {
                    Toast.show({
                      type: 'success',
                      text1: 'Copied!',
                      text2: 'Shipment ID copied to clipboard',
                    });
                  }}
                >
                  <Icon name="copy-outline" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm font-bold text-blue-600">{order.trackingNumber}</Text>
              {order.courier && (
                <Text className="text-xs text-gray-600 mt-2">Courier: {order.courier}</Text>
              )}
            </View>
          </View>
        )}

        {/* Payment Summary */}
        <View className="bg-white px-4 py-4 mt-3">
          <Text className="text-base font-bold text-gray-900 mb-3">Payment Summary</Text>

          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">Subtotal</Text>
            <Text className="text-sm text-gray-900">₦{order.subtotal.toLocaleString()}</Text>
          </View>

          {order.discount > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Discount</Text>
              <Text className="text-sm text-green-600">-₦{order.discount.toLocaleString()}</Text>
            </View>
          )}

          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">Shipping</Text>
            <Text className="text-sm text-gray-900">₦{order.shippingCost.toLocaleString()}</Text>
          </View>

          {order.tax > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Tax</Text>
              <Text className="text-sm text-gray-900">₦{order.tax.toLocaleString()}</Text>
            </View>
          )}

          <View className="border-t border-gray-200 mt-2 pt-2">
            <View className="flex-row justify-between">
              <Text className="text-base font-bold text-gray-900">Total</Text>
              <Text className="text-base font-bold text-pink-600">
                ₦{order.total.toLocaleString()}
              </Text>
            </View>
          </View>

          <View className="bg-gray-50 rounded-xl p-3 mt-3">
            <Text className="text-xs text-gray-600">Payment Method</Text>
            <Text className="text-sm font-semibold text-gray-900 mt-1">
              {order.paymentMethod === 'paystack'
                ? 'Card Payment'
                : order.paymentMethod === 'wallet'
                ? 'Wallet'
                : 'Cash on Delivery'}
            </Text>
            <Text className="text-xs text-gray-600 mt-2">Payment Status</Text>
            <Text
              className="text-sm font-semibold mt-1"
              style={{
                color:
                  order.paymentStatus === 'completed'
                    ? '#10B981'
                    : order.paymentStatus === 'failed'
                    ? '#EF4444'
                    : '#F59E0B',
              }}
            >
              {order.paymentStatus === 'completed' ? 'Paid' : order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-4 py-6">
          {/* Complete Order Button - for customer to confirm delivery (only before completed) */}
          {order.status === 'in_transit' && (
            <TouchableOpacity
              onPress={handleCompleteOrder}
              disabled={isCompleting}
              className="mb-3 rounded-2xl overflow-hidden"
              activeOpacity={0.8}
              style={{
                backgroundColor: '#10B981',
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <View className="flex-row items-center justify-center py-4">
                {isCompleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="checkmark-done-circle" size={22} color="#FFFFFF" />
                    <Text className="text-white font-bold text-base ml-2">Complete Order</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* Row 1: Primary actions */}
          <View className="flex-row gap-3 mb-3">
            {/* Track Order */}
            {!trackingUrl &&
              order.deliveryType !== 'digital' &&
              ['confirmed', 'shipped', 'in_transit', 'processing'].includes(order.status) && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('TrackOrder', { orderId: order._id })}
                  className="flex-1 bg-pink-500 py-3.5 rounded-xl"
                >
                  <View className="flex-row items-center justify-center">
                    <Icon name="location" size={18} color="#FFFFFF" />
                    <Text className="text-white font-bold text-sm ml-1.5">Track</Text>
                  </View>
                </TouchableOpacity>
              )}

            {/* Download Digital Products */}
            {order.deliveryType === 'digital' && order.paymentStatus === 'completed' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('MyDigitalProducts' as any)}
                className="flex-1 bg-purple-500 py-3.5 rounded-xl"
              >
                <View className="flex-row items-center justify-center">
                  <Icon name="cloud-download" size={18} color="#FFFFFF" />
                  <Text className="text-white font-bold text-sm ml-1.5">Download</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Chat with Vendor */}
            <TouchableOpacity
              onPress={() => {
                const firstVendor = order.items[0]?.vendor;
                const vendorId = typeof firstVendor === 'object'
                  ? (firstVendor as any)?._id
                  : firstVendor;
                const vendorName = typeof firstVendor === 'object'
                  ? (firstVendor as any)?.businessName || (firstVendor as any)?.name || 'Vendor'
                  : 'Vendor';
                const orderDetails = `Hi, I have a question about my Order #${order.orderNumber}.\n\nItems: ${order.items.map((i: any) => i.productName).join(', ')}\nTotal: ₦${order.total?.toLocaleString()}\nStatus: ${order.status}`;
                navigation.navigate('Chat', {
                  receiverId: vendorId,
                  receiverName: vendorName,
                  initialMessage: orderDetails,
                });
              }}
              className="flex-1 bg-pink-50 py-3.5 rounded-xl border border-pink-200"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-center">
                <Icon name="chatbubble-ellipses" size={18} color="#CC3366" />
                <Text className="text-pink-600 font-bold text-sm ml-1.5">Chat</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 2: Secondary actions */}
          <View className="flex-row gap-3 mb-3">
            {/* Write Review */}
            {order.status === 'delivered' && order.paymentStatus === 'completed' && (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('WriteReview' as any, {
                    orderId: order._id,
                    items: order.items.map((item: any) => ({
                      product: item.product,
                      productName: item.productName,
                      productImage: item.productImage,
                    })),
                  });
                }}
                className="flex-1 bg-amber-500 py-3.5 rounded-xl"
              >
                <View className="flex-row items-center justify-center">
                  <Icon name="star" size={18} color="#FFFFFF" />
                  <Text className="text-white font-bold text-sm ml-1.5">Review</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Cancel Order */}
            {canCancel && (
              <TouchableOpacity
                onPress={() => setShowCancelModal(true)}
                className="flex-1 bg-red-500 py-3.5 rounded-xl"
              >
                <View className="flex-row items-center justify-center">
                  <Icon name="close-circle" size={18} color="#FFFFFF" />
                  <Text className="text-white font-bold text-sm ml-1.5">Cancel</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Dispute Order */}
            {canDispute && (
              <TouchableOpacity
                onPress={() => {
                  const firstVendor = order.items[0]?.vendor;
                  const vendorId = typeof firstVendor === 'object'
                    ? (firstVendor as any)?._id
                    : firstVendor;
                  navigation.navigate('FileDispute' as any, {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    items: order.items.map((item: any) => ({
                      product: typeof item.product === 'object' ? item.product._id : item.product,
                      productName: item.productName,
                      productImage: item.productImage,
                      quantity: item.quantity,
                      price: item.price,
                      vendor: typeof item.vendor === 'object' ? (item.vendor as any)?._id : item.vendor,
                    })),
                    vendorId,
                  });
                }}
                className="flex-1 py-3.5 rounded-xl border-2 border-red-400"
                style={{ backgroundColor: '#FEF2F2' }}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-center">
                  <Icon name="shield-half" size={18} color="#EF4444" />
                  <Text className="text-red-600 font-bold text-sm ml-1.5">Dispute</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Need Help */}
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Need Help?',
                  'How would you like to reach us?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Chat with Support',
                      onPress: () => navigation.navigate('Chat', {
                        receiverId: supportUserId,
                        receiverName: 'VendorSpot Support',
                        initialMessage: `Hi, I need help with my Order #${order?.orderNumber || ''}.\n\nItems: ${order?.items.map((i: any) => i.productName).join(', ')}\nTotal: ₦${order?.total?.toLocaleString()}\nStatus: ${order?.status}`,
                      }),
                    },
                    {
                      text: 'Email Us',
                      onPress: () => Linking.openURL('mailto:support@vendorspot.com?subject=Help with Order ' + (order?.orderNumber || '')),
                    },
                    {
                      text: 'Call Us',
                      onPress: () => Linking.openURL('tel:+2349000000000'),
                    },
                  ]
                );
              }}
              className="flex-1 bg-gray-100 py-3.5 rounded-xl"
            >
              <View className="flex-row items-center justify-center">
                <Icon name="help-circle-outline" size={18} color="#374151" />
                <Text className="text-gray-900 font-bold text-sm ml-1.5">Help</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Cancel Order Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCancelModal}
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center self-center mb-4">
              <Icon name="close-circle" size={32} color="#EF4444" />
            </View>

            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              Cancel Order
            </Text>
            <Text className="text-sm text-gray-500 text-center mb-6">
              Please tell us why you want to cancel this order
            </Text>

            <TextInput
              className="bg-gray-50 rounded-xl p-4 text-sm text-gray-900 mb-6"
              placeholder="Reason for cancellation..."
              placeholderTextColor="#9CA3AF"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg border border-gray-300"
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
              >
                <Text className="text-gray-700 font-semibold text-center">Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg bg-red-500"
                onPress={handleCancelOrder}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-center">Cancel Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default OrderDetailsScreen;