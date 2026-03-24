// screens/TrackOrderScreen.tsx - ENHANCED VERSION WITH __DEV__
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { trackOrder, getOrderById, Order } from '@/services/order.service';
import { refreshOrderStatus } from '@/services/tracking.service';

// ✅ TypeScript declaration for __DEV__
declare const __DEV__: boolean;

type TrackOrderScreenProps = NativeStackScreenProps<RootStackParamList, 'TrackOrder'>;

interface TrackingEvent {
  status: string;
  description: string;
  timestamp: string;
  location?: string;
}

const TrackOrderScreen = ({ route, navigation }: TrackOrderScreenProps) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ Sandbox testing state
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  
  // ✅ Use __DEV__ to detect development mode
  const isSandbox = __DEV__;

  useEffect(() => {
    console.log('\n🚚 ============ TrackOrderScreen MOUNTED ============');
    console.log('📦 Order ID:', orderId);
    console.log('🧪 Development Mode:', isSandbox);
    fetchTrackingData();
  }, [orderId]);

  const fetchTrackingData = async (showRefresh = false) => {
    try {
      console.log('\n🔄 ============ FETCHING TRACKING DATA ============');
      console.log('📦 Order ID:', orderId);
      
      if (!showRefresh) {
        setIsLoading(true);
      }
      
      // Get order details
      const orderResponse = await getOrderById(orderId);
      console.log('📥 Order API Response:', JSON.stringify(orderResponse, null, 2));
      
      if (orderResponse.success && orderResponse.data?.order) {
        const orderData = orderResponse.data.order;
        
        console.log('\n✅ ============ ORDER DATA RECEIVED ============');
        console.log('📋 Order Number:', orderData.orderNumber);
        console.log('📊 Order Status:', orderData.status);
        console.log('💰 Total:', orderData.total);
        console.log('📦 Items Count:', orderData.items?.length || 0);
        
        // ✅ Check for tracking number in vendorShipments or top-level
        const hasVendorShipments = orderData.vendorShipments && orderData.vendorShipments.length > 0;
        const vendorTrackingNumber = hasVendorShipments ? orderData.vendorShipments[0].trackingNumber : null;
        const actualTrackingNumber = orderData.trackingNumber || vendorTrackingNumber;
        
        console.log('🚚 Has Tracking Number:', !!actualTrackingNumber);
        console.log('🚚 Tracking Number:', actualTrackingNumber || 'none');
        console.log('🚚 Courier:', orderData.courier || (hasVendorShipments ? orderData.vendorShipments[0].courier : 'none'));
        console.log('📍 Delivery Type:', orderData.deliveryType || 'standard');
        console.log('🏪 Is Pickup:', orderData.isPickup || false);
        console.log('📦 Vendor Shipments:', hasVendorShipments ? orderData.vendorShipments.length : 0);
        
        setOrder(orderData);
        console.log('✅ Order state set');
        
        // ✅ Get tracking info
        if (orderData.trackingNumber || orderData.vendorShipments?.length > 0) {
          console.log('\n🚚 ============ FETCHING TRACKING INFO ============');
          
          try {
            const trackingResponse = await trackOrder(orderId);
            console.log('📍 Tracking API Response:', JSON.stringify(trackingResponse, null, 2));
            
            if (trackingResponse.success) {
              // ✅ Handle multi-vendor tracking
              if (trackingResponse.data.multiVendor && trackingResponse.data.tracking) {
                const trackings = trackingResponse.data.tracking;
                console.log('📦 Multi-vendor tracking:', trackings.length, 'shipments');
                
                // Get first shipment's tracking URL or data
                if (trackings.length > 0) {
                  const firstTracking = trackings[0];
                  
                  // Check for tracking URL in the response
                  if (firstTracking.trackingUrl) {
                    setTrackingUrl(firstTracking.trackingUrl);
                    console.log('✅ Tracking URL set from tracking data:', firstTracking.trackingUrl);
                  } else if (orderData.vendorShipments && orderData.vendorShipments[0]?.trackingUrl) {
                    // Fallback to vendor shipment tracking URL
                    setTrackingUrl(orderData.vendorShipments[0].trackingUrl);
                    console.log('✅ Tracking URL set from vendor shipment:', orderData.vendorShipments[0].trackingUrl);
                  } else {
                    console.log('⚠️ No tracking URL available');
                  }
                  
                  setTrackingData(firstTracking.tracking || null);
                }
              } else {
                // Single vendor tracking
                setTrackingData(trackingResponse.data.tracking);
                if (trackingResponse.data.trackingUrl) {
                  setTrackingUrl(trackingResponse.data.trackingUrl);
                  console.log('✅ Tracking URL set:', trackingResponse.data.trackingUrl);
                }
              }
              
              console.log('✅ Tracking data set');
            } else {
              console.log('⚠️ Tracking fetch successful but no data');
            }
          } catch (error: any) {
            console.log('⚠️ Tracking fetch failed:', error.message);
          }
        } else {
          console.log('\nℹ️ No tracking number available - skipping tracking fetch');
        }
        
        console.log('\n✅ ============ TRACKING DATA FETCH COMPLETE ============\n');
      } else {
        console.log('❌ Order response failed or no order data');
      }
    } catch (error: any) {
      console.error('\n❌ ============ FETCH ERROR ============');
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load tracking information',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      console.log('✅ Loading state set to false\n');
    }
  };

  // ✅ Refresh handler (pull to refresh)
  const handleRefresh = () => {
    console.log('🔄 Pull to refresh triggered');
    setIsRefreshing(true);
    fetchTrackingData(true);
  };

  // ✅ Simulate status change (sandbox only)
  const handleStatusUpdate = async (statusCode: string) => {
    if (!order) return;

    console.log('🧪 Simulating status change:', statusCode);
    setShowStatusSelector(false);

    try {
      Toast.show({
        type: 'info',
        text1: 'Updating Status',
        text2: 'Simulating shipment update...',
        visibilityTime: 2000,
      });

      await refreshOrderStatus({
        orderId: order._id,
        statusCode: statusCode as any,
      });

      // Wait a moment for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Refresh order data
      await fetchTrackingData();

      Toast.show({
        type: 'success',
        text1: 'Status Updated',
        text2: `Order status changed to ${statusCode}`,
        visibilityTime: 3000,
      });
    } catch (error: any) {
      console.error('❌ Status update failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.response?.data?.message || 'Failed to update status',
        visibilityTime: 4000,
      });
    }
  };

  const getStatusFromOrder = (order: Order): TrackingEvent[] => {
    console.log('\n🎯 ============ GENERATING TRACKING EVENTS ============');
    console.log('📊 Order Status:', order.status);
    
    const events: TrackingEvent[] = [];
    
    // Order Placed
    events.push({
      status: 'Order Placed',
      description: 'Your order has been confirmed',
      timestamp: order.createdAt,
      location: '',
    });
    console.log('✅ Added: Order Placed');

    // Processing
    if (['processing', 'shipped', 'in_transit', 'delivered'].includes(order.status)) {
      events.push({
        status: 'Processing',
        description: 'Vendor is preparing your order',
        timestamp: order.createdAt,
        location: '',
      });
      console.log('✅ Added: Processing');
    }

    // Shipped
    if (['shipped', 'in_transit', 'delivered'].includes(order.status)) {
      events.push({
        status: 'Shipped',
        description: 'Package picked up by courier',
        timestamp: order.createdAt,
        location: '',
      });
      console.log('✅ Added: Shipped');
    }

    // In Transit
    if (['in_transit', 'delivered'].includes(order.status)) {
      events.push({
        status: 'In Transit',
        description: 'Package is on the way',
        timestamp: order.createdAt,
        location: '',
      });
      console.log('✅ Added: In Transit');
    }

    // Delivered
    if (order.status === 'delivered') {
      events.push({
        status: 'Delivered',
        description: 'Package has been delivered',
        timestamp: order.updatedAt,
        location: '',
      });
      console.log('✅ Added: Delivered');
    }

    console.log('📊 Total Events:', events.length);
    console.log('📋 Events:', events.map(e => e.status).join(' → '));
    
    return events;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getEstimatedDelivery = () => {
    if (!order) return '';

    // Use the real estimatedDelivery from the order if available
    const estDate = (order as any).estimatedDelivery;
    if (!estDate) return 'Pending';

    const delivery = new Date(estDate);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeStr = delivery.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (delivery.toDateString() === today.toDateString()) {
      return `Today, ${timeStr}`;
    }

    if (delivery.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${timeStr}`;
    }

    return delivery.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#CC3366';
      case 'confirmed':
      case 'processing': return '#F59E0B';
      case 'shipped':
      case 'in_transit': return '#3B82F6';
      case 'delivered': return '#10B981';
      case 'cancelled': return '#EF4444';
      case 'disputed': return '#7C3AED';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'processing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'in_transit': return 'In Transit';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      case 'disputed': return 'Disputed';
      default: return status;
    }
  };

  const getStatusIndex = (status: string): number => {
    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'delivered'];
    return statusOrder.indexOf(status.toLowerCase());
  };

  const openTrackingUrl = () => {
    if (trackingUrl) {
      console.log('🔗 Opening tracking URL:', trackingUrl);
      Linking.openURL(trackingUrl);
    }
  };

  if (isLoading) {
    console.log('⏳ Rendering: LOADING STATE');
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#CC3366" />
          <Text className="text-gray-500 mt-4">Loading tracking information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    console.log('❌ Rendering: ORDER NOT FOUND STATE');
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-6">
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

  const firstItem = order.items[0];
  const trackingEvents = getStatusFromOrder(order);
  const currentStatusIndex = getStatusIndex(order.status);
  const estimatedDelivery = getEstimatedDelivery();

  // ✅ Check for tracking number in vendorShipments or top-level
  const hasVendorShipments = order.vendorShipments && order.vendorShipments.length > 0;
  const actualTrackingNumber = order.trackingNumber ||
    (hasVendorShipments ? order.vendorShipments[0].trackingNumber : null);
  const actualCourier = order.courier ||
    (hasVendorShipments ? order.vendorShipments[0].courier : null);

  // Split items into digital and physical
  const digitalItems = order.items.filter((item: any) => {
    const pt = (item as any).productType?.toUpperCase();
    return pt === 'DIGITAL' || pt === 'SERVICE';
  });
  const physicalItems = order.items.filter((item: any) => {
    const pt = (item as any).productType?.toUpperCase();
    return pt !== 'DIGITAL' && pt !== 'SERVICE';
  });
  const isMixedOrder = digitalItems.length > 0 && physicalItems.length > 0;

  console.log('\n🎨 ============ RENDERING TRACK ORDER SCREEN ============');
  console.log('📊 Render State:', {
    orderNumber: order.orderNumber,
    status: order.status,
    currentStatusIndex: currentStatusIndex,
    eventsCount: trackingEvents.length,
    hasTracking: !!actualTrackingNumber,
    hasTrackingUrl: !!trackingUrl,
    estimatedDelivery: estimatedDelivery,
    showSimulator: isSandbox && !!actualTrackingNumber,
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold ml-2">Track Order</Text>
        </View>
        
        {/* ✅ Refresh button */}
        <TouchableOpacity
          onPress={handleRefresh}
          className="w-10 h-10 items-center justify-center"
          disabled={isRefreshing}
        >
          <Icon 
            name="refresh" 
            size={24} 
            color={isRefreshing ? "#9CA3AF" : "#111827"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 40 }}
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#CC3366"
            colors={["#CC3366"]}
          />
        }
      >
        {/* Order Number Card */}
        <View className="bg-white px-4 py-4 border-b border-gray-100">
          <Text className="text-xs text-gray-500 mb-1">Order Number</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-gray-900">#{order.orderNumber}</Text>
            <View className="bg-yellow-100 px-3 py-1 rounded-full">
              <Text className="text-xs font-semibold text-yellow-800">
                {order.status === 'delivered' ? 'Delivered' : 'In Transit'}
              </Text>
            </View>
          </View>
        </View>

        {/* ===== DIGITAL PRODUCTS SECTION ===== */}
        {digitalItems.length > 0 && (
          <View className="mx-4 mt-4">
            <View className="bg-white rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Icon name="cloud-download" size={20} color="#8B5CF6" />
                  <Text className="text-base font-bold text-gray-900 ml-2">
                    Digital Products ({digitalItems.length})
                  </Text>
                </View>
                {order.paymentStatus === 'completed' ? (
                  <View className="bg-green-100 px-2.5 py-1 rounded-full">
                    <Text className="text-xs font-bold text-green-700">Delivered</Text>
                  </View>
                ) : (
                  <View className="bg-yellow-100 px-2.5 py-1 rounded-full">
                    <Text className="text-xs font-bold text-yellow-700">Awaiting Payment</Text>
                  </View>
                )}
              </View>

              {digitalItems.map((item, index) => (
                <View key={`digital-${index}`} className="flex-row items-center mb-3">
                  <View className="w-14 h-14 bg-purple-50 rounded-xl overflow-hidden mr-3">
                    {item.productImage ? (
                      <Image
                        source={{ uri: item.productImage }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <Icon name="document" size={24} color="#8B5CF6" />
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-900" numberOfLines={2}>
                      {item.productName}
                    </Text>
                    <Text className="text-xs text-purple-600 mt-1">Instant Delivery</Text>
                  </View>
                  <Text className="text-sm font-bold text-gray-900">
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </Text>
                </View>
              ))}

              {/* Digital delivery timeline - always completed */}
              {order.paymentStatus === 'completed' && (
                <View className="bg-purple-50 rounded-xl p-3 mt-2">
                  <View className="flex-row items-center mb-2">
                    <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center">
                      <Icon name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                    <View className="flex-1 h-0.5 bg-green-500 mx-2" />
                    <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center">
                      <Icon name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                    <View className="flex-1 h-0.5 bg-green-500 mx-2" />
                    <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center">
                      <Icon name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-[10px] text-purple-700 font-semibold">Paid</Text>
                    <Text className="text-[10px] text-purple-700 font-semibold">Processed</Text>
                    <Text className="text-[10px] text-purple-700 font-semibold">Ready</Text>
                  </View>
                </View>
              )}

              {/* Download button */}
              {order.paymentStatus === 'completed' && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('MyDigitalProducts' as any)}
                  className="bg-green-500 py-3 rounded-xl mt-3"
                >
                  <View className="flex-row items-center justify-center">
                    <Icon name="cloud-download" size={18} color="#FFFFFF" />
                    <Text className="text-white font-bold ml-2">Download Now</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Separator for mixed orders */}
        {isMixedOrder && (
          <View className="mx-4 mt-4">
            <View className="flex-row items-center">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="text-xs text-gray-400 mx-3 font-semibold">SHIPPING</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>
          </View>
        )}

        {/* ===== PHYSICAL PRODUCTS SECTION ===== */}
        {physicalItems.length > 0 && (
          <>
            {/* Physical Product Cards */}
            <View className="bg-white px-4 py-4 mt-4 mx-4 rounded-2xl">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Icon name="cube" size={20} color="#CC3366" />
                  <Text className="text-base font-bold text-gray-900 ml-2">
                    {isMixedOrder ? `Physical Products (${physicalItems.length})` : `Products (${physicalItems.length})`}
                  </Text>
                </View>
                <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${getStatusColor(order.status)}15` }}>
                  <Text className="text-xs font-bold" style={{ color: getStatusColor(order.status) }}>
                    {getStatusLabel(order.status)}
                  </Text>
                </View>
              </View>

              {physicalItems.map((item, index) => (
                <View key={`physical-${index}`} className="flex-row items-center mb-3">
                  <View className="w-14 h-14 bg-pink-50 rounded-xl overflow-hidden mr-3">
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
                    <Text className="text-sm font-bold text-gray-900" numberOfLines={2}>
                      {item.productName}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      Quantity: {item.quantity}
                    </Text>
                  </View>
                  <Text className="text-sm font-bold text-gray-900">
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>

            {/* Estimated Delivery Banner */}
            <View className="mx-4 mt-4">
              <View className="rounded-2xl p-4"
                style={{
                  backgroundColor: '#CC3366',
                  shadowColor: '#CC3366',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <View className="flex-row items-center mb-2">
                  <View className="w-8 h-8 bg-white/20 rounded-full items-center justify-center mr-2">
                    <Icon name="time" size={20} color="#FFFFFF" />
                  </View>
                  <Text className="text-white text-xs font-semibold">Estimated Delivery</Text>
                </View>
                <Text className="text-white text-2xl font-bold mb-1">
                  {getEstimatedDelivery()}
                </Text>
                <Text className="text-white/80 text-xs">Your package will arrive shortly</Text>
              </View>
            </View>

            {/* Track Shipment Button */}
            {trackingUrl && (
              <View className="mx-4 mt-4">
                <TouchableOpacity
                  onPress={openTrackingUrl}
                  className="bg-blue-500 rounded-2xl p-4 flex-row items-center justify-center"
                  style={{
                    shadowColor: '#3B82F6',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <Icon name="locate" size={24} color="#FFFFFF" />
                  <Text className="text-white text-base font-bold ml-2">
                    Track Shipment on ShipBubble
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Sandbox Status Simulator */}
            {isSandbox && actualTrackingNumber && (
              <View className="mx-4 mt-4">
                <TouchableOpacity
                  onPress={() => setShowStatusSelector(!showStatusSelector)}
                  className="bg-purple-500 rounded-2xl p-3 flex-row items-center justify-center"
                  style={{
                    shadowColor: '#A855F7',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <Icon name="flask" size={20} color="#FFFFFF" />
                  <Text className="text-white text-sm font-bold ml-2">
                    {showStatusSelector ? 'Hide Status Simulator' : 'Simulate Status Change'}
                  </Text>
                </TouchableOpacity>

                {showStatusSelector && (
                  <View className="bg-white rounded-2xl p-4 mt-2"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Text className="text-sm font-bold text-gray-900 mb-3">
                      Test Status Updates (Sandbox)
                    </Text>

                    {[
                      { code: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
                      { code: 'picked_up', label: 'Picked Up', color: 'bg-green-500' },
                      { code: 'in_transit', label: 'In Transit', color: 'bg-yellow-500' },
                      { code: 'completed', label: 'Delivered', color: 'bg-green-600' },
                    ].map((status) => (
                      <TouchableOpacity
                        key={status.code}
                        onPress={() => handleStatusUpdate(status.code)}
                        className={`${status.color} rounded-xl p-3 mb-2`}
                        style={{
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.2,
                          shadowRadius: 2,
                          elevation: 2,
                        }}
                      >
                        <Text className="text-white text-center font-semibold">
                          {status.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Delivery Progress */}
            <View className="bg-white mx-4 mt-4 rounded-2xl p-4">
              <Text className="text-base font-bold text-gray-900 mb-4">Delivery Progress</Text>

              {trackingEvents.map((event, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isLast = index === trackingEvents.length - 1;

                return (
                  <View key={index} className="flex-row">
                    <View className="items-center mr-4">
                      <View
                        className={`w-10 h-10 rounded-full items-center justify-center ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      >
                        {isCompleted ? (
                          <Icon name="checkmark" size={20} color="#FFFFFF" />
                        ) : (
                          <View className="w-3 h-3 bg-white rounded-full" />
                        )}
                      </View>
                      {!isLast && (
                        <View
                          className={`w-0.5 h-16 ${
                            isCompleted ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </View>
                    <View className="flex-1 pb-6">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text
                          className={`text-sm font-bold ${
                            isCompleted ? 'text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {event.status}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {formatTime(event.timestamp)}
                        </Text>
                      </View>
                      <Text
                        className={`text-xs ${
                          isCompleted ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
                        {event.description}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {formatDate(event.timestamp)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Tracking Information */}
            {actualTrackingNumber && (
              <View className="bg-white mx-4 mt-4 rounded-2xl p-4">
                <Text className="text-base font-bold text-gray-900 mb-3">Tracking Information</Text>

                <View className="bg-blue-50 rounded-xl p-3 mb-3">
                  <Text className="text-xs text-gray-600 mb-1">Shipment ID</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-blue-600">
                      {actualTrackingNumber}
                    </Text>
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
                </View>

                {actualCourier && (
                  <View className="bg-gray-50 rounded-xl p-3">
                    <Text className="text-xs text-gray-600 mb-1">Courier</Text>
                    <Text className="text-sm font-semibold text-gray-900">
                      {actualCourier}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Delivery Address */}
            {order.shippingAddress && order.shippingAddress.city && (
              <View className="bg-white mx-4 mt-4 rounded-2xl p-4 mb-6">
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
                    {order.shippingAddress.phone && (
                      <Text className="text-sm text-gray-600 mt-2">
                        {order.shippingAddress.phone}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {/* Digital-only order - no physical items, show some bottom spacing */}
        {physicalItems.length === 0 && <View className="h-6" />}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TrackOrderScreen;