// ============================================================
// PREMIUM VENDOR ORDER DETAIL SCREEN - WITH WEBHOOK SIMULATOR
// File: screens/vendor/VendorOrderDetailScreen.tsx
// Clean, spacious design with refined visual hierarchy
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/services/api';
import { RootStackParamList } from '@/navigation/index';

// ✅ TypeScript declaration for __DEV__
declare const __DEV__: boolean;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, 'VendorOrderDetail'>;

// ============================================================
// TYPES
// ============================================================

interface OrderItem {
  _id?: string;
  product: {
    _id: string;
    name: string;
    images: string[];
    slug?: string;
    productType?: string;
    digitalFile?: { url?: string; fileSize?: number; fileType?: string };
  } | string;
  productName?: string;
  productImage?: string;
  productType?: string;
  variant?: string;
  quantity: number;
  price: number;
  vendor: { _id: string; firstName: string; lastName: string; email?: string } | string;
}

interface VendorShipment {
  vendor: string | { _id: string; firstName: string; lastName: string };
  vendorName: string;
  items: string[];
  origin?: { street?: string; city: string; state: string; country: string };
  shippingCost: number;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shipmentId?: string;
  courier?: string;
}

interface OrderDetail {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentReference?: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
  };
  couponCode?: string;
  notes?: string;
  deliveryType?: string;
  isDigital?: boolean;
  isPickup?: boolean;
  trackingNumber?: string;
  trackingUrl?: string;
  vendorShipments?: VendorShipment[];
  vendorShipment?: VendorShipment;
  cancelReason?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const STATUS_CONFIG: Record<string, { 
  bg: string; 
  text: string; 
  icon: string; 
  gradient: string[] 
}> = {
  pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: 'time-outline',
    gradient: ['#FEF3C7', '#FDE68A'],
  },
  confirmed: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    icon: 'checkmark-circle-outline',
    gradient: ['#CFFAFE', '#A5F3FC'],
  },
  processing: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    icon: 'cog-outline',
    gradient: ['#F3E8FF', '#E9D5FF'],
  },
  shipped: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: 'airplane-outline',
    gradient: ['#DBEAFE', '#BFDBFE'],
  },
  in_transit: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    icon: 'car-outline',
    gradient: ['#E0E7FF', '#C7D2FE'],
  },
  delivered: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: 'checkmark-done-outline',
    gradient: ['#D1FAE5', '#A7F3D0'],
  },
  cancelled: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    icon: 'close-circle-outline',
    gradient: ['#FFE4E6', '#FECDD3'],
  },
  failed: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: 'alert-circle-outline',
    gradient: ['#FEE2E2', '#FECACA'],
  },
};

const PAYMENT_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'time-outline' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'checkmark-circle' },
  failed: { bg: 'bg-rose-100', text: 'text-rose-700', icon: 'close-circle' },
  refunded: { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'refresh-outline' },
};

const STATUS_FLOW: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'processing',
  processing: 'shipped',
  shipped: 'in_transit',
  in_transit: 'delivered',
};

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'in_transit', label: 'Transit' },
  { key: 'delivered', label: 'Delivered' },
];

// ============================================================
// HELPERS
// ============================================================

const fmt = (s: string) => s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';

const fmtDate = (d: string) => {
  return new Date(d).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const fmtDateTime = (d: string) => {
  const dt = new Date(d);
  const date = dt.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const time = dt.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date} at ${time}`;
};

const fmtPrice = (n: number) => {
  return `₦${(n || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const getImg = (item: OrderItem): string | null => {
  if (item.productImage) return item.productImage;
  if (typeof item.product === 'object' && item.product?.images?.[0]) {
    return item.product.images[0];
  }
  return null;
};

const getName = (item: OrderItem): string => {
  if (item.productName) return item.productName;
  if (typeof item.product === 'object' && item.product?.name) {
    return item.product.name;
  }
  return 'Unknown Product';
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

interface SectionProps {
  icon: string;
  title: string;
  children: React.ReactNode;
  iconColor?: string;
  badge?: string;
}

const Section: React.FC<SectionProps> = ({
  icon,
  title,
  children,
  iconColor = '#EC4899',
  badge,
}) => (
  <View
    className="bg-white mx-5 mt-4 rounded-3xl p-6"
    style={{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 6,
    }}
  >
    <View className="flex-row items-center justify-between mb-4">
      <View className="flex-row items-center">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Ionicons name={icon as any} size={20} color={iconColor} />
        </View>
        <Text className="text-lg font-bold text-gray-900" style={{ letterSpacing: -0.5 }}>
          {title}
        </Text>
      </View>
      {badge && (
        <View className="bg-gray-100 px-3 py-1.5 rounded-lg">
          <Text className="text-xs font-bold text-gray-700">{badge}</Text>
        </View>
      )}
    </View>
    {children}
  </View>
);

interface InfoRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, mono = false }) => (
  <View className="flex-row justify-between items-start py-2.5">
    <Text className="text-sm text-gray-500 flex-1">{label}</Text>
    <Text
      className={`text-sm text-gray-800 font-semibold text-right flex-1 ${
        mono ? 'font-mono' : ''
      }`}
      numberOfLines={2}
    >
      {value}
    </Text>
  </View>
);

// ============================================================
// MAIN SCREEN
// ============================================================

const VendorOrderDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRoute>();
  
  const orderId = route.params?.orderId;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  
  // ✅ Development mode detection
  const isSandbox = __DEV__;

  useEffect(() => {
    if (!orderId) {
      setError('Order ID is missing');
      setLoading(false);
    }
  }, [orderId]);

  // ── Fetch Order ──
  const fetchOrder = useCallback(
    async (isRefresh = false) => {
      if (!orderId) {
        setError('Order ID is missing');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        isRefresh ? setRefreshing(true) : setLoading(true);
        setError('');

        const res = await api.get(`/orders/vendor/orders/${orderId}`);

        if (res.data?.success) {
          setOrder(res.data.data?.order || null);
        }
      } catch (err: any) {
        console.error('❌ Fetch vendor order error:', err?.response?.data || err?.message);
        setError(
          err?.response?.data?.message || err?.message || 'Failed to load order'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId]
  );

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [fetchOrder, orderId]);

  // ── Update Status ──
  const handleUpdate = async (newStatus: string) => {
    if (!order) return;
    try {
      setUpdating(true);
      const res = await api.put(`/orders/${order._id}/status`, { status: newStatus });
      if (res.data?.success) {
        setOrder(prev => (prev ? { ...prev, status: newStatus } : prev));
        Alert.alert('Success', `Order marked as ${fmt(newStatus)}`);
        // Refresh to get updated tracking info
        setTimeout(() => fetchOrder(true), 1000);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const confirmUpdate = (newStatus: string) => {
    Alert.alert(
      'Update Order Status',
      `Are you sure you want to mark this order as "${fmt(newStatus)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => handleUpdate(newStatus) },
      ]
    );
  };

  // ✅ Simulate Webhook (Sandbox only)
  const simulateWebhook = async (statusCode: string) => {
    if (!order) return;

    try {
      Alert.alert('Simulating...', 'Updating shipment status');
      
      const res = await api.post('/webhooks/vendor/simulate', {
        orderId: order._id,
        statusCode,
      });

      if (res.data?.success) {
        Alert.alert('Success', 'Status updated! Refreshing order...');
        // Wait for webhook to process
        setTimeout(() => fetchOrder(true), 2000);
      }
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Failed to simulate webhook'
      );
    }
  };

  const callCustomer = () => {
    const phone = order?.user?.phone || order?.shippingAddress?.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const emailCustomer = () => {
    if (order?.user?.email) Linking.openURL(`mailto:${order.user.email}`);
  };

  // ── Loading State ──
  if (loading) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        <View
          className="flex-row items-center px-6 pt-14 pb-5 bg-white"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.03,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900" style={{ letterSpacing: -0.5 }}>
            Order Details
          </Text>
        </View>

        <View className="flex-1 justify-center items-center">
          <View
            className="w-20 h-20 rounded-3xl bg-white items-center justify-center mb-5"
            style={{
              shadowColor: '#EC4899',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <ActivityIndicator size="large" color="#EC4899" />
          </View>
          <Text className="text-base font-semibold text-gray-900">Loading Order</Text>
          <Text className="text-sm text-gray-500 mt-2">Please wait...</Text>
        </View>
      </View>
    );
  }

  // ── Error State ──
  if (error && !order) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        <View
          className="flex-row items-center px-6 pt-14 pb-5 bg-white"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.03,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900" style={{ letterSpacing: -0.5 }}>
            Order Details
          </Text>
        </View>

        <View className="flex-1 justify-center items-center px-8">
          <View
            className="w-24 h-24 rounded-3xl bg-rose-50 items-center justify-center mb-6"
            style={{
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-2" style={{ letterSpacing: -0.5 }}>
            Unable to Load
          </Text>
          <Text className="text-sm text-gray-500 text-center leading-6 mb-8">
            {error}
          </Text>

          <TouchableOpacity
            onPress={() => fetchOrder()}
            activeOpacity={0.8}
            style={{
              shadowColor: '#EC4899',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <LinearGradient
              colors={['#EC4899', '#DB2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 32,
                borderRadius: 16,
              }}
            >
              <Text className="text-white text-base font-bold">Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!order) return null;

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const paymentConfig = PAYMENT_CONFIG[order.paymentStatus] || PAYMENT_CONFIG.pending;
  const nextStatus = STATUS_FLOW[order.status] || null;
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const currentIdx = TIMELINE_STEPS.findIndex(s => s.key === order.status);
  const vendorTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipment =
    order.vendorShipment ||
    (order.vendorShipments && order.vendorShipments.length > 0
      ? order.vendorShipments[0]
      : null);

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Header */}
      <View
        className="px-6 pt-14 pb-5 bg-white"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.03,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-4"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#111" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Order
              </Text>
              <Text
                className="text-xl font-bold text-gray-900"
                numberOfLines={1}
                style={{ letterSpacing: -0.5 }}
              >
                #{order.orderNumber}
              </Text>
            </View>
          </View>

          <View className={`px-4 py-2 rounded-xl ${statusConfig.bg}`}>
            <Text
              className={`text-xs font-bold ${statusConfig.text} uppercase tracking-wide`}
            >
              {fmt(order.status)}
            </Text>
          </View>
        </View>

        <Text className="text-xs text-gray-400 mt-3">
          {fmtDateTime(order.createdAt)}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOrder(true)}
            colors={['#EC4899']}
            tintColor="#EC4899"
          />
        }
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* ── Order Timeline ── */}
        {!isCancelled && (
          <View
            className="bg-white mx-5 mt-5 rounded-3xl p-6"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <View className="flex-row items-center mb-5">
              <View className="w-10 h-10 rounded-xl bg-pink-100 items-center justify-center mr-3">
                <Ionicons name="git-branch-outline" size={20} color="#EC4899" />
              </View>
              <Text className="text-lg font-bold text-gray-900" style={{ letterSpacing: -0.5 }}>
                Order Progress
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              {TIMELINE_STEPS.map((step, idx) => {
                const done = idx <= currentIdx;
                const current = idx === currentIdx;
                const isLast = idx === TIMELINE_STEPS.length - 1;
                const stepConfig = STATUS_CONFIG[step.key];

                return (
                  <React.Fragment key={step.key}>
                    <View className="items-center" style={{ width: 48 }}>
                      <View
                        className={`w-10 h-10 rounded-full items-center justify-center ${
                          current
                            ? 'bg-pink-500'
                            : done
                            ? 'bg-emerald-500'
                            : 'bg-gray-200'
                        }`}
                        style={
                          current
                            ? {
                                shadowColor: '#EC4899',
                                shadowOffset: { width: 0, height: 3 },
                                shadowOpacity: 0.4,
                                shadowRadius: 6,
                                elevation: 4,
                              }
                            : {}
                        }
                      >
                        <Ionicons
                          name={
                            done && !current
                              ? 'checkmark'
                              : (stepConfig?.icon as any) || 'ellipse'
                          }
                          size={18}
                          color={done || current ? '#fff' : '#9CA3AF'}
                        />
                      </View>
                      <Text
                        className={`text-[10px] mt-2 text-center font-semibold ${
                          current
                            ? 'text-pink-500'
                            : done
                            ? 'text-emerald-600'
                            : 'text-gray-400'
                        }`}
                        numberOfLines={1}
                      >
                        {step.label}
                      </Text>
                    </View>
                    {!isLast && (
                      <View
                        className={`flex-1 h-1 rounded-full mx-1 ${
                          idx < currentIdx ? 'bg-emerald-400' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Cancelled Banner ── */}
        {isCancelled && (
          <View
            className="mx-5 mt-5 rounded-3xl p-6 overflow-hidden"
            style={{
              backgroundColor: '#FFF1F2',
              borderWidth: 2,
              borderColor: '#FECDD3',
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 rounded-full bg-rose-100 items-center justify-center mr-3">
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </View>
              <Text className="text-lg font-bold text-rose-700">Order Cancelled</Text>
            </View>
            {order.cancelReason && (
              <Text className="text-sm text-rose-600 leading-6">
                Reason: {order.cancelReason}
              </Text>
            )}
            {(order.refundAmount ?? 0) > 0 && (
              <Text className="text-sm text-rose-600 mt-2">
                Refunded: {fmtPrice(order.refundAmount!)}
              </Text>
            )}
          </View>
        )}

        {/* ── Customer Section ── */}
        <Section icon="person-outline" title="Customer" iconColor="#8B5CF6">
          <View className="flex-row items-center mb-4">
            <View className="w-14 h-14 rounded-full bg-purple-100 items-center justify-center mr-4">
              <Text className="text-xl font-bold text-purple-600">
                {order.user?.firstName?.charAt(0) || 'C'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900">
                {order.user?.firstName || ''} {order.user?.lastName || ''}
              </Text>
              {order.user?.email && (
                <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
                  {order.user.email}
                </Text>
              )}
            </View>
          </View>

          {(order.user?.phone || order.shippingAddress?.phone) && (
            <View className="flex-row items-center bg-gray-50 px-4 py-3 rounded-xl mb-3">
              <Ionicons name="call-outline" size={18} color="#6B7280" />
              <Text className="text-sm text-gray-700 ml-3 flex-1">
                {order.user?.phone || order.shippingAddress?.phone}
              </Text>
            </View>
          )}

          <View className="flex-row gap-3">
            {(order.user?.phone || order.shippingAddress?.phone) && (
              <TouchableOpacity
                onPress={callCustomer}
                className="flex-1"
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-center bg-emerald-50 py-3 rounded-xl">
                  <Ionicons name="call" size={18} color="#10B981" />
                  <Text className="text-sm font-bold text-emerald-600 ml-2">Call</Text>
                </View>
              </TouchableOpacity>
            )}
            {order.user?.email && (
              <TouchableOpacity
                onPress={emailCustomer}
                className="flex-1"
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-center bg-blue-50 py-3 rounded-xl">
                  <Ionicons name="mail" size={18} color="#2563EB" />
                  <Text className="text-sm font-bold text-blue-600 ml-2">Email</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </Section>

        {/* ── Order Items ── */}
        <Section
          icon="cube-outline"
          title="Order Items"
          iconColor="#EC4899"
          badge={`${order.items.length} ${order.items.length === 1 ? 'item' : 'items'}`}
        >
          {order.items.map((item, idx) => {
            const img = getImg(item);
            const name = getName(item);
            const pType =
              (item.productType ||
                (typeof item.product === 'object' ? item.product.productType : '') ||
                'physical'
              ).toUpperCase();
            const isDigital = pType === 'DIGITAL' || pType === 'SERVICE';
            const lineTotal = item.price * item.quantity;

            return (
              <View
                key={idx}
                className={`flex-row py-4 ${idx > 0 ? 'border-t border-gray-100' : ''}`}
              >
                {img ? (
                  <Image
                    source={{ uri: img }}
                    className="w-20 h-20 rounded-2xl bg-gray-100"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-20 h-20 rounded-2xl bg-gray-50 items-center justify-center">
                    <Ionicons name="cube-outline" size={32} color="#D1D5DB" />
                  </View>
                )}

                <View className="flex-1 ml-4">
                  <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
                    {name}
                  </Text>
                  {item.variant && (
                    <Text className="text-xs text-gray-400 mt-1">{item.variant}</Text>
                  )}
                  {isDigital && (
                    <View className="flex-row items-center mt-2">
                      <View className="bg-purple-100 px-2.5 py-1 rounded-lg flex-row items-center">
                        <Ionicons name="cloud-download-outline" size={12} color="#8B5CF6" />
                        <Text className="text-xs font-bold text-purple-700 ml-1">
                          Digital
                        </Text>
                      </View>
                    </View>
                  )}

                  <View className="flex-row items-center justify-between mt-3">
                    <Text className="text-xs text-gray-500">
                      {fmtPrice(item.price)} × {item.quantity}
                    </Text>
                    <Text className="text-base font-bold text-gray-900">
                      {fmtPrice(lineTotal)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </Section>

        {/* ── Shipping Address ── */}
        {order.shippingAddress && !order.isDigital && (
          <Section icon="location-outline" title="Shipping Address" iconColor="#F59E0B">
            {order.shippingAddress.fullName && (
              <Text className="text-base font-bold text-gray-900 mb-3">
                {order.shippingAddress.fullName}
              </Text>
            )}

            <View className="bg-gray-50 px-4 py-4 rounded-xl">
              <Text className="text-sm text-gray-700 leading-6">
                {[
                  order.shippingAddress.street,
                  order.shippingAddress.city,
                  order.shippingAddress.state,
                  order.shippingAddress.country,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>

            {order.shippingAddress.phone && (
              <View className="flex-row items-center mt-3">
                <Ionicons name="call-outline" size={16} color="#6B7280" />
                <Text className="text-sm text-gray-600 ml-2">
                  {order.shippingAddress.phone}
                </Text>
              </View>
            )}
          </Section>
        )}

        {/* ── Digital Delivery Banner ── */}
        {order.isDigital && (
          <View
            className="mx-5 mt-4 rounded-3xl p-6"
            style={{
              backgroundColor: '#FAF5FF',
              borderWidth: 2,
              borderColor: '#E9D5FF',
              shadowColor: '#8B5CF6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center mr-4">
                <Ionicons name="cloud-download-outline" size={24} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-purple-900">
                  Digital Delivery
                </Text>
                <Text className="text-sm text-purple-600 mt-1 leading-5">
                  No physical shipping required
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Shipment Details ── */}
        {shipment && (
          <Section icon="airplane-outline" title="Shipment Details" iconColor="#3B82F6">
            <View className="bg-blue-50 px-4 py-4 rounded-xl mb-4">
              <Text className="text-base font-bold text-blue-900 mb-3">
                {shipment.vendorName}
              </Text>
              
              <InfoRow label="Status" value={fmt(shipment.status)} />
              {shipment.courier && <InfoRow label="Courier" value={shipment.courier} />}
              {shipment.trackingNumber && (
                <InfoRow label="Tracking ID" value={shipment.trackingNumber} mono />
              )}
              <InfoRow label="Shipping Cost" value={fmtPrice(shipment.shippingCost)} />
            </View>

            {/* ✅ Track Shipment Button */}
            {shipment.trackingUrl && (
              <TouchableOpacity
                onPress={() => Linking.openURL(shipment.trackingUrl!)}
                activeOpacity={0.8}
                style={{
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="locate" size={18} color="#fff" />
                  <Text className="text-white text-sm font-bold ml-2">
                    Track Shipment
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* ✅ Sandbox Webhook Simulator for Vendors */}
            {isSandbox && shipment.trackingNumber && (
              <View className="mt-4">
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Simulate Status Update',
                      'Test shipment status changes (Sandbox only)',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: '✅ Confirmed',
                          onPress: () => simulateWebhook('confirmed')
                        },
                        {
                          text: '📦 Picked Up',
                          onPress: () => simulateWebhook('picked_up')
                        },
                        {
                          text: '🚚 In Transit',
                          onPress: () => simulateWebhook('in_transit')
                        },
                        {
                          text: '🎉 Delivered',
                          onPress: () => simulateWebhook('completed')
                        },
                      ],
                      { cancelable: true }
                    );
                  }}
                  activeOpacity={0.8}
                  style={{
                    shadowColor: '#8B5CF6',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 4,
                  }}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="flask" size={18} color="#fff" />
                    <Text className="text-white text-sm font-bold ml-2">
                      Simulate Status Change (Dev)
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </Section>
        )}

        {/* ── Payment Summary ── */}
        <Section icon="card-outline" title="Payment Details" iconColor="#10B981">
          <View className="bg-gray-50 px-4 py-4 rounded-xl mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm text-gray-600">Payment Method</Text>
              <Text className="text-sm font-bold text-gray-900">
                {fmt(order.paymentMethod || 'N/A')}
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm text-gray-600">Payment Status</Text>
              <View className={`px-3 py-1.5 rounded-lg ${paymentConfig.bg} flex-row items-center`}>
                <Ionicons
                  name={paymentConfig.icon as any}
                  size={12}
                  color={paymentConfig.text.replace('text-', '#')}
                />
                <Text className={`text-xs font-bold ${paymentConfig.text} ml-1`}>
                  {fmt(order.paymentStatus || '')}
                </Text>
              </View>
            </View>

            {order.paymentReference && (
              <View className="flex-row justify-between items-center pt-3 border-t border-gray-200">
                <Text className="text-sm text-gray-600">Reference</Text>
                <Text className="text-sm text-gray-800 font-mono">
                  {order.paymentReference}
                </Text>
              </View>
            )}
          </View>

          <View className="space-y-2">
            <InfoRow label="Subtotal" value={fmtPrice(order.subtotal)} />
            {order.discount > 0 && (
              <InfoRow label="Discount" value={`-${fmtPrice(order.discount)}`} />
            )}
            {order.shippingCost > 0 && (
              <InfoRow label="Shipping" value={fmtPrice(order.shippingCost)} />
            )}
            {order.tax > 0 && <InfoRow label="Tax" value={fmtPrice(order.tax)} />}
            {order.couponCode && (
              <InfoRow label="Coupon Applied" value={order.couponCode} mono />
            )}
          </View>

          <View className="h-px bg-gray-200 my-4" />

          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-gray-900">Order Total</Text>
            <Text className="text-2xl font-bold text-pink-500" style={{ letterSpacing: -0.5 }}>
              {fmtPrice(order.total)}
            </Text>
          </View>

          {vendorTotal !== order.total && (
            <View className="flex-row justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <Text className="text-sm text-gray-600">Your Items Total</Text>
              <Text className="text-lg font-bold text-gray-900">
                {fmtPrice(vendorTotal)}
              </Text>
            </View>
          )}
        </Section>

        {/* ── Customer Notes ── */}
        {order.notes && (
          <Section
            icon="chatbubble-ellipses-outline"
            title="Customer Notes"
            iconColor="#F59E0B"
          >
            <View className="bg-amber-50 px-4 py-4 rounded-xl">
              <Text className="text-sm text-gray-700 leading-6">{order.notes}</Text>
            </View>
          </Section>
        )}

        {/* ── Order Information ── */}
        <Section
          icon="information-circle-outline"
          title="Order Information"
          iconColor="#6B7280"
        >
          <View className="bg-gray-50 px-4 py-4 rounded-xl">
            <InfoRow label="Order Number" value={order.orderNumber} mono />
            <InfoRow label="Delivery Type" value={fmt(order.deliveryType || 'Standard')} />
            <InfoRow label="Created" value={fmtDateTime(order.createdAt)} />
            <InfoRow label="Last Updated" value={fmtDateTime(order.updatedAt)} />
          </View>
        </Section>
      </ScrollView>

      {/* ── Bottom Action Bar ── */}
      {!isCancelled && !isDelivered && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-4 pb-8"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <View className="flex-row gap-3">
            {nextStatus && (
              <TouchableOpacity
                onPress={() => confirmUpdate(nextStatus)}
                disabled={updating}
                activeOpacity={0.8}
                className="flex-1"
                style={{
                  shadowColor: '#EC4899',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <LinearGradient
                  colors={['#EC4899', '#DB2777']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {updating ? (
                    <ActivityIndicator size={18} color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text className="text-white text-base font-bold ml-2">
                        Mark {fmt(nextStatus)}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {(order.status === 'pending' || order.status === 'confirmed') && (
              <TouchableOpacity
                onPress={() => confirmUpdate('cancelled')}
                disabled={updating}
                activeOpacity={0.8}
                className="flex-row items-center justify-center border-2 border-rose-500 px-6 py-4 rounded-16"
              >
                <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                <Text className="text-rose-500 text-base font-bold ml-2">Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default VendorOrderDetailScreen;