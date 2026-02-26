// screens/OrderDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { getOrderById, trackOrder, cancelOrder, Order } from '@/services/order.service';

type OrderDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'OrderDetails'>;

const DISPUTE_WINDOW_DAYS = 7;

const OrderDetailsScreen = ({ route, navigation }: OrderDetailsScreenProps) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<any>(null);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

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
        return '#EC4899';
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
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
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
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(order.status);
  const statusLabel = getStatusLabel(order.status);
  const canCancel = canCancelOrder();
  const canDispute = canDisputeOrder();
  const disputeDeadline = getDisputeDeadline();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
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
          {order.items.map((item, index) => (
            <View key={index} className="flex-row items-center mb-4">
              <View className="w-16 h-16 bg-pink-50 rounded-xl overflow-hidden mr-3">
                {item.productImage ? (
                  <Image
                    source={{ uri: item.productImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <Icon name="image-outline" size={24} color="#EC4899" />
                  </View>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</Text>
              </View>
              <Text className="text-sm font-bold text-gray-900">
                ₦{(item.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        {order.shippingAddress && order.shippingAddress.city && (
          <View className="bg-white px-4 py-4 mt-3">
            <Text className="text-base font-bold text-gray-900 mb-3">Delivery Address</Text>
            <View className="flex-row items-start">
              <Icon name="location" size={20} color="#EC4899" />
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
              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-4 py-6">
          {/* Download Digital Products Button */}
          {order.deliveryType === 'digital' && order.paymentStatus === 'completed' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('MyDigitalProducts' as any)}
              className="bg-purple-500 py-4 rounded-xl mb-3"
            >
              <View className="flex-row items-center justify-center">
                <Icon name="cloud-download" size={20} color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">Download Products</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Track Order Button - Legacy */}
          {!trackingUrl &&
            order.deliveryType !== 'digital' &&
            ['confirmed', 'shipped', 'in_transit', 'processing'].includes(order.status) && (
              <TouchableOpacity
                onPress={() => navigation.navigate('TrackOrder', { orderId: order._id })}
                className="bg-pink-500 py-4 rounded-xl mb-3"
              >
                <View className="flex-row items-center justify-center">
                  <Icon name="location" size={20} color="#FFFFFF" />
                  <Text className="text-white font-bold ml-2">Track Order</Text>
                </View>
              </TouchableOpacity>
            )}

          {/* Cancel Order Button */}
          {canCancel && (
            <TouchableOpacity
              onPress={() => setShowCancelModal(true)}
              className="bg-red-500 py-4 rounded-xl mb-3"
            >
              <Text className="text-white font-bold text-center">Cancel Order</Text>
            </TouchableOpacity>
          )}

          {/* Write Review Button */}
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
              className="bg-amber-500 py-4 rounded-xl mb-3"
            >
              <View className="flex-row items-center justify-center">
                <Icon name="star" size={20} color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">Write a Review</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* ✅ NEW: Dispute Order Button */}
          {canDispute && (
            <TouchableOpacity
              onPress={() => {
                // Extract vendorId properly — could be populated object or string
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
              className="py-4 rounded-xl mb-3 border-2 border-red-400"
              style={{ backgroundColor: '#FEF2F2' }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-center">
                <Icon name="shield-half" size={20} color="#EF4444" />
                <Text className="text-red-600 font-bold ml-2">Dispute Order</Text>
              </View>
              {disputeDeadline && (
                <Text className="text-xs text-red-400 text-center mt-1">
                  {disputeDeadline} to file a dispute
                </Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              // Could navigate to help/support
            }}
            className="bg-gray-100 py-4 rounded-xl"
          >
            <Text className="text-gray-900 font-bold text-center">Need Help?</Text>
          </TouchableOpacity>
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
    </SafeAreaView>
  );
};

export default OrderDetailsScreen;