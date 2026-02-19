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
import { getOrderById, trackOrder, cancelOrder, Order } from '@/services/api';

type OrderDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'OrderDetails'>;

const OrderDetailsScreen = ({ route, navigation }: OrderDetailsScreenProps) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<any>(null);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null); // ✅ NEW
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    console.log('🔵 ============ OrderDetailsScreen MOUNTED ============');
    console.log('📦 Order ID:', orderId);
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      console.log('\n🔄 ============ FETCHING ORDER DETAILS ============');
      console.log('📦 Fetching order ID:', orderId);
      
      setIsLoading(true);
      const response = await getOrderById(orderId);
      
      console.log('📥 API Response:', JSON.stringify(response, null, 2));
      console.log('✅ Response success:', response.success);
      console.log('📊 Has order data:', !!response.data?.order);
      
      if (response.success && response.data?.order) {
        const orderData = response.data.order;
        
        console.log('\n✅ ============ ORDER DATA RECEIVED ============');
        console.log('📋 Order Number:', orderData.orderNumber);
        console.log('📊 Order Status:', orderData.status);
        console.log('💰 Order Total:', orderData.total);
        console.log('💳 Payment Status:', orderData.paymentStatus);
        console.log('💳 Payment Method:', orderData.paymentMethod);
        console.log('📦 Items Count:', orderData.items?.length || 0);
        console.log('🚚 Has Tracking:', !!orderData.trackingNumber);
        console.log('🚚 Tracking Number:', orderData.trackingNumber || 'none');
        console.log('🚚 Courier:', orderData.courier || 'none');
        
        // Log each item
        console.log('\n📦 ============ ORDER ITEMS ============');
        orderData.items?.forEach((item: any, index: number) => {
          console.log(`  ${index + 1}. ${item.productName}`);
          console.log(`     - Quantity: ${item.quantity}`);
          console.log(`     - Price: ₦${item.price.toLocaleString()}`);
          console.log(`     - Total: ₦${(item.price * item.quantity).toLocaleString()}`);
          console.log(`     - Has Image: ${!!item.productImage}`);
          console.log(`     - Image URL: ${item.productImage || 'none'}`);
        });
        
        // Log shipping address
        console.log('\n📍 ============ SHIPPING ADDRESS ============');
        console.log('👤 Full Name:', orderData.shippingAddress?.fullName || 'not provided');
        console.log('📍 Street:', orderData.shippingAddress?.street || 'not provided');
        console.log('🏙️ City:', orderData.shippingAddress?.city || 'not provided');
        console.log('🗺️ State:', orderData.shippingAddress?.state || 'not provided');
        console.log('🌍 Country:', orderData.shippingAddress?.country || 'not provided');
        console.log('📞 Phone:', orderData.shippingAddress?.phone || 'not provided');
        
        // Log payment details
        console.log('\n💰 ============ PAYMENT DETAILS ============');
        console.log('💵 Subtotal: ₦', orderData.subtotal?.toLocaleString());
        console.log('🎁 Discount: ₦', orderData.discount?.toLocaleString());
        console.log('🚚 Shipping: ₦', orderData.shippingCost?.toLocaleString());
        console.log('📊 Tax: ₦', orderData.tax?.toLocaleString());
        console.log('💰 TOTAL: ₦', orderData.total?.toLocaleString());
        
        setOrder(orderData);
        
        // ✅ Fetch tracking if order has tracking number
        if (orderData.trackingNumber) {
          console.log('\n🚚 ============ FETCHING TRACKING ============');
          console.log('📦 Has tracking number:', orderData.trackingNumber);
          
          try {
            const trackingResponse = await trackOrder(orderId);
            console.log('📥 Tracking Response:', trackingResponse);
            
            if (trackingResponse.success) {
              console.log('✅ Tracking data received');
              
              // ✅ Handle multi-vendor tracking
              if (trackingResponse.data.multiVendor && trackingResponse.data.tracking) {
                const trackings = trackingResponse.data.tracking;
                console.log('📦 Multi-vendor tracking:', trackings.length, 'shipments');
                
                // Get first shipment's tracking URL
                if (trackings.length > 0 && trackings[0].trackingUrl) {
                  setTrackingUrl(trackings[0].trackingUrl);
                  console.log('✅ Tracking URL set:', trackings[0].trackingUrl);
                }
                
                setTracking(trackings[0]?.tracking || null);
              } else {
                // Single vendor tracking
                setTracking(trackingResponse.data.tracking);
                if (trackingResponse.data.trackingUrl) {
                  setTrackingUrl(trackingResponse.data.trackingUrl);
                  console.log('✅ Tracking URL set:', trackingResponse.data.trackingUrl);
                }
              }
              
              console.log('✅ Tracking info set');
            } else {
              console.log('⚠️ Tracking fetch successful but no data');
            }
          } catch (error: any) {
            console.log('⚠️ Tracking not available:', error.message);
          }
        } else {
          console.log('\nℹ️ No tracking number - skipping tracking fetch');
        }
        
        console.log('\n✅ ============ ORDER FETCH COMPLETE ============\n');
      } else {
        console.log('❌ Response success is false or no order data');
      }
    } catch (error: any) {
      console.error('\n❌ ============ FETCH ORDER ERROR ============');
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Full error:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load order details',
      });
    } finally {
      setIsLoading(false);
      console.log('✅ Loading state set to false\n');
    }
  };

  const handleCancelOrder = async () => {
    console.log('\n🔴 ============ CANCEL ORDER INITIATED ============');
    console.log('📝 Cancel reason:', cancelReason);
    
    if (!cancelReason.trim()) {
      console.log('⚠️ No cancel reason provided');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please provide a reason for cancellation',
      });
      return;
    }

    try {
      setIsCancelling(true);
      console.log('🔄 Sending cancel request for order:', orderId);
      
      const response = await cancelOrder(orderId, cancelReason);
      console.log('📥 Cancel response:', response);
      
      if (response.success) {
        console.log('✅ Order cancelled successfully');
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Order cancelled successfully',
        });
        setShowCancelModal(false);
        await fetchOrderDetails();
      } else {
        console.log('❌ Cancel failed:', response.message);
      }
    } catch (error: any) {
      console.error('❌ Cancel order error:', error.message);
      console.error('❌ Error response:', error.response?.data);
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to cancel order',
      });
    } finally {
      setIsCancelling(false);
      console.log('🔴 Cancel order process complete\n');
    }
  };

  // ✅ NEW: Open tracking URL
  const openTrackingUrl = () => {
    if (trackingUrl) {
      console.log('🔗 Opening tracking URL:', trackingUrl);
      Linking.openURL(trackingUrl);
    }
  };

  const getStatusColor = (status: string) => {
    const color = (() => {
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
        default:
          return '#6B7280';
      }
    })();
    
    console.log('🎨 Status color for "' + status + '" → ' + color);
    return color;
  };

  const getStatusLabel = (status: string) => {
    const label = (() => {
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
        default:
          return status;
      }
    })();
    
    console.log('🏷️ Status label for "' + status + '" → "' + label + '"');
    return label;
  };

  const canCancelOrder = () => {
    if (!order) {
      console.log('❌ Cannot cancel: No order loaded');
      return false;
    }
    const canCancel = ['pending', 'confirmed'].includes(order.status);
    console.log('🔍 Can cancel order?', {
      status: order.status,
      canCancel: canCancel,
    });
    return canCancel;
  };

  if (isLoading) {
    console.log('⏳ Rendering: LOADING STATE');
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
    console.log('❌ Rendering: ORDER NOT FOUND STATE');
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

  console.log('\n🎨 ============ RENDERING ORDER DETAILS SCREEN ============');
  console.log('📊 Render State:', {
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: statusLabel,
    statusColor: statusColor,
    itemsCount: order.items?.length || 0,
    total: order.total,
    hasTracking: !!order.trackingNumber,
    hasTrackingUrl: !!trackingUrl,
    canCancel: canCancel,
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => {
              console.log('⬅️ Back button pressed');
              navigation.goBack();
            }}
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold ml-2">Order Details</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        {(() => {
          console.log('🎨 Rendering Status Banner');
          return null;
        })()}
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

        {/* Order Items */}
        {(() => {
          console.log('🎨 Rendering Order Items section');
          console.log('  📦 Items count:', order.items?.length || 0);
          order.items?.forEach((item: any, i: number) => {
            console.log(`  ${i + 1}. ${item.productName} - Qty: ${item.quantity}, Price: ₦${item.price.toLocaleString()}`);
          });
          return null;
        })()}
        <View className="bg-white px-4 py-4 mt-3">
          <Text className="text-base font-bold text-gray-900 mb-3">Order Items</Text>
          {order.items.map((item, index) => {
            console.log(`  🛍️ Rendering item ${index + 1}: ${item.productName}`);
            return (
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
            );
          })}
        </View>

        {/* Delivery Address - Only show for physical products */}
        {(() => {
          const hasShippingAddress = order.shippingAddress && order.shippingAddress.city;
          console.log('🎨 Rendering Delivery Address section');
          console.log('  📍 Has shipping address:', hasShippingAddress);
          console.log('  📍 Delivery type:', order.deliveryType);
          console.log('  📍 Is digital:', order.isDigital);
          if (hasShippingAddress) {
            console.log('  📍 Address:', {
              fullName: order.shippingAddress?.fullName || 'not provided',
              street: order.shippingAddress?.street,
              city: order.shippingAddress?.city,
              state: order.shippingAddress?.state,
            });
          } else {
            console.log('  ℹ️ No shipping address (digital product)');
          }
          return null;
        })()}
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
                <Text className="text-sm font-bold text-gray-900 ml-3">
                  Digital Delivery
                </Text>
              </View>
              <Text className="text-xs text-gray-600">
                Instant access after payment confirmation
              </Text>
            </View>
          </View>
        )}

        {/* ✅ Track Shipment Button - Prominent Display */}
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
        {(() => {
          const shouldShowTracking = order.trackingNumber;
          console.log('🎨 Tracking Information section');
          console.log('  📊 Should show:', shouldShowTracking);
          console.log('  📊 Status:', order.status);
          console.log('  📊 Has tracking number:', !!order.trackingNumber);
          console.log('  📊 Tracking number:', order.trackingNumber || 'none');
          console.log('  📊 Courier:', order.courier || 'none');
          return null;
        })()}
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
              <Text className="text-sm font-bold text-blue-600">
                {order.trackingNumber}
              </Text>
              {order.courier && (
                <Text className="text-xs text-gray-600 mt-2">
                  Courier: {order.courier}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Payment Summary */}
        {(() => {
          console.log('🎨 Rendering Payment Summary section');
          console.log('  💰 Subtotal:', order.subtotal);
          console.log('  🎁 Discount:', order.discount);
          console.log('  🚚 Shipping:', order.shippingCost);
          console.log('  📊 Tax:', order.tax);
          console.log('  💰 Total:', order.total);
          console.log('  💳 Method:', order.paymentMethod);
          console.log('  ✅ Status:', order.paymentStatus);
          return null;
        })()}
        <View className="bg-white px-4 py-4 mt-3">
          <Text className="text-base font-bold text-gray-900 mb-3">Payment Summary</Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">Subtotal</Text>
            <Text className="text-sm text-gray-900">₦{order.subtotal.toLocaleString()}</Text>
          </View>

          {order.discount > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Discount</Text>
              <Text className="text-sm text-green-600">
                -₦{order.discount.toLocaleString()}
              </Text>
            </View>
          )}

          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">Shipping</Text>
            <Text className="text-sm text-gray-900">
              ₦{order.shippingCost.toLocaleString()}
            </Text>
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
        {(() => {
          console.log('🎨 Rendering Action Buttons section');
          console.log('  🔴 Can cancel:', canCancel);
          console.log('  🔴 Show cancel button:', canCancel);
          console.log('  📥 Is digital order:', order.deliveryType === 'digital');
          console.log('  🚚 Show legacy track:', !trackingUrl && order.deliveryType !== 'digital' && ['confirmed', 'shipped', 'in_transit', 'processing'].includes(order.status));
          return null;
        })()}
        <View className="px-4 py-6">
          {/* Download Digital Products Button */}
          {order.deliveryType === 'digital' && order.paymentStatus === 'completed' && (
            <TouchableOpacity
              onPress={() => {
                console.log('📥 Download button pressed for digital order');
                navigation.navigate('MyDigitalProducts' as any);
              }}
              className="bg-purple-500 py-4 rounded-xl mb-3"
            >
              <View className="flex-row items-center justify-center">
                <Icon name="cloud-download" size={20} color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">Download Products</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Track Order Button - Legacy (only show if no tracking URL) */}
          {!trackingUrl && order.deliveryType !== 'digital' && ['confirmed', 'shipped', 'in_transit', 'processing'].includes(order.status) && (
            <TouchableOpacity
              onPress={() => {
                console.log('🚚 Track order button pressed (legacy)');
                navigation.navigate('TrackOrder', { orderId: order._id });
              }}
              className="bg-pink-500 py-4 rounded-xl mb-3"
            >
              <View className="flex-row items-center justify-center">
                <Icon name="location" size={20} color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">Track Order</Text>
              </View>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              onPress={() => {
                console.log('🔴 Cancel button pressed');
                setShowCancelModal(true);
              }}
              className="bg-red-500 py-4 rounded-xl mb-3"
            >
              <Text className="text-white font-bold text-center">Cancel Order</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              console.log('ℹ️ Help button pressed');
              // Navigate to support or help
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
                  console.log('🔙 Cancel modal - Go Back pressed');
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