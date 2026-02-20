// ============================================================
// PREMIUM VENDOR ORDERS SCREEN
// File: screens/vendor/VendorOrdersScreen.tsx
// Clean, spacious design with refined visual hierarchy
// ============================================================

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  Animated,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getVendorOrders, updateVendorOrderStatus } from '@/services/order.service';
import { RootStackParamList } from '@/navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ============================================================
// TYPES
// ============================================================

interface VendorOrderItem {
  product: { _id: string; name: string; images: string[] } | string;
  productName?: string;
  productImage?: string;
  productType?: string;
  variant?: string;
  quantity: number;
  price: number;
  vendor: string;
}

interface VendorShipment {
  vendor: string;
  vendorName: string;
  items: string[];
  shippingCost: number;
  status: string;
  trackingNumber?: string;
  courier?: string;
}

interface VendorOrder {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  items: VendorOrderItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    street: string;
    city: string;
    state: string;
    country: string;
  };
  deliveryType?: string;
  isDigital?: boolean;
  vendorShipment?: VendorShipment;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const ORDER_STATUSES = [
  { key: 'all', label: 'All Orders', icon: 'layers-outline' },
  { key: 'pending', label: 'Pending', icon: 'time-outline' },
  { key: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle-outline' },
  { key: 'processing', label: 'Processing', icon: 'sync-outline' },
  { key: 'shipped', label: 'Shipped', icon: 'airplane-outline' },
  { key: 'delivered', label: 'Delivered', icon: 'checkmark-done-outline' },
  { key: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; gradient: string[] }> = {
  pending: { 
    bg: 'bg-amber-50', 
    text: 'text-amber-700',
    gradient: ['#FEF3C7', '#FDE68A']
  },
  confirmed: { 
    bg: 'bg-cyan-50', 
    text: 'text-cyan-700',
    gradient: ['#CFFAFE', '#A5F3FC']
  },
  processing: { 
    bg: 'bg-purple-50', 
    text: 'text-purple-700',
    gradient: ['#F3E8FF', '#E9D5FF']
  },
  shipped: { 
    bg: 'bg-blue-50', 
    text: 'text-blue-700',
    gradient: ['#DBEAFE', '#BFDBFE']
  },
  in_transit: { 
    bg: 'bg-indigo-50', 
    text: 'text-indigo-700',
    gradient: ['#E0E7FF', '#C7D2FE']
  },
  delivered: { 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-700',
    gradient: ['#D1FAE5', '#A7F3D0']
  },
  cancelled: { 
    bg: 'bg-rose-50', 
    text: 'text-rose-700',
    gradient: ['#FFE4E6', '#FECDD3']
  },
  failed: { 
    bg: 'bg-red-50', 
    text: 'text-red-700',
    gradient: ['#FEE2E2', '#FECACA']
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

// ============================================================
// SUCCESS TOAST
// ============================================================

const SuccessToast = ({ 
  message, 
  visible, 
  onDismiss 
}: { 
  message: string; 
  visible: boolean; 
  onDismiss: () => void 
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={{ opacity }} className="absolute top-20 left-4 right-4 z-50">
      <View 
        className="bg-white rounded-2xl px-5 py-4 flex-row items-center"
        style={{
          shadowColor: '#10B981',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mr-3">
          <Ionicons name="checkmark" size={20} color="#10B981" />
        </View>
        <Text className="flex-1 text-sm text-gray-800 font-medium" numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity 
          onPress={onDismiss} 
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="ml-2"
        >
          <Ionicons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ============================================================
// ERROR TOAST
// ============================================================

const ErrorToast = ({ 
  message, 
  visible, 
  onDismiss 
}: { 
  message: string; 
  visible: boolean; 
  onDismiss: () => void 
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(4000),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={{ opacity }} className="absolute top-20 left-4 right-4 z-50">
      <View 
        className="bg-white rounded-2xl px-5 py-4 flex-row items-center"
        style={{
          shadowColor: '#EF4444',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <View className="w-10 h-10 rounded-full bg-rose-100 items-center justify-center mr-3">
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
        </View>
        <Text className="flex-1 text-sm text-gray-800 font-medium" numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity 
          onPress={onDismiss} 
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="ml-2"
        >
          <Ionicons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ============================================================
// HELPERS
// ============================================================

const fmtStatus = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const fmtDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString('en-NG', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
};

const fmtPrice = (n: number) => {
  return `₦${(n || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const getItemImage = (item: VendorOrderItem): string | null => {
  if (item.productImage) return item.productImage;
  if (typeof item.product === 'object' && item.product?.images?.[0]) return item.product.images[0];
  return null;
};

const getItemName = (item: VendorOrderItem): string => {
  if (item.productName) return item.productName;
  if (typeof item.product === 'object' && item.product?.name) return item.product.name;
  return 'Unknown Product';
};

// ============================================================
// MAIN SCREEN
// ============================================================

const VendorOrdersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);

  // ── Fetch Orders ──
  const fetchOrders = useCallback(async (pg = 1, isRefresh = false) => {
    try {
      if (pg === 1) {
        isRefresh ? setRefreshing(true) : setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await getVendorOrders(pg, 20);

      if (res.data?.success) {
        const fetched: VendorOrder[] = res.data.data?.orders || [];
        const meta = res.data.meta;

        if (pg === 1) {
          setOrders(fetched);
        } else {
          setOrders(prev => {
            const ids = new Set(prev.map(o => o._id));
            return [...prev, ...fetched.filter(o => !ids.has(o._id))];
          });
        }
        
        setTotalPages(meta?.totalPages || 1);
        setTotalOrders(meta?.total || fetched.length);
        setPage(pg);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load orders';
      setErrorMsg(msg);
      setErrorVisible(true);
      if (pg === 1) setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { 
    fetchOrders(1); 
  }, []);

  // ── Client-side Filter ──
  const filteredOrders = useMemo(() => {
    let result = [...orders];
    
    if (activeTab !== 'all') {
      result = result.filter(o => o.status === activeTab);
    }
    
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(o => {
        const matchOrder = o.orderNumber?.toLowerCase().includes(q);
        const matchCustomer = `${o.user?.firstName || ''} ${o.user?.lastName || ''}`.toLowerCase().includes(q);
        const matchProduct = o.items.some(i => getItemName(i).toLowerCase().includes(q));
        return matchOrder || matchCustomer || matchProduct;
      });
    }
    
    return result;
  }, [orders, activeTab, search]);

  const statusCount = (key: string) => {
    return key === 'all' ? orders.length : orders.filter(o => o.status === key).length;
  };

  // ── Actions ──
  const onRefresh = () => fetchOrders(1, true);
  
  const onLoadMore = () => { 
    if (!loadingMore && page < totalPages) {
      fetchOrders(page + 1);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      const res = await updateVendorOrderStatus(orderId, newStatus);
      
      if (res.data?.success) {
        setOrders(prev => prev.map(o => 
          o._id === orderId ? { ...o, status: newStatus } : o
        ));
        setSuccessMsg(`Order marked as ${fmtStatus(newStatus)}`);
        setSuccessVisible(true);
        setExpandedId(null);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update status';
      setErrorMsg(msg);
      setErrorVisible(true);
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmUpdate = (orderId: string, newStatus: string) => {
    Alert.alert(
      'Update Order Status',
      `Are you sure you want to mark this order as "${fmtStatus(newStatus)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => handleUpdateStatus(orderId, newStatus),
          style: 'default'
        },
      ]
    );
  };

  // ── RENDER: Header ──
  const renderHeader = () => (
    <View 
      className="bg-white pt-14 pb-5 px-6"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View className="flex-row justify-between items-center mb-5">
        <View>
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Order Management
          </Text>
          <Text 
            className="text-2xl font-bold text-gray-900" 
            style={{ letterSpacing: -0.5 }}
          >
            Orders
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-gray-500 font-medium mb-1">Total</Text>
          <Text className="text-2xl font-bold text-pink-500">
            {totalOrders}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View 
        className="flex-row items-center bg-gray-50 rounded-2xl px-4 h-12"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.02,
          shadowRadius: 4,
          elevation: 1,
        }}
      >
        <Ionicons name="search-outline" size={20} color="#9CA3AF" />
        <TextInput
          className="flex-1 text-sm text-gray-800 ml-3"
          placeholder="Search orders, products, customers..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearch('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ── RENDER: Tabs ──
  const renderTabs = () => (
    <View className="bg-white pb-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {ORDER_STATUSES.map(tab => {
          const active = activeTab === tab.key;
          const count = statusCount(tab.key);
          
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
              className={`flex-row items-center h-10 px-4 rounded-xl ${
                active ? 'bg-pink-500' : 'bg-gray-100'
              }`}
              style={active ? {
                shadowColor: '#EC4899',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 4,
              } : {}}
            >
              <Ionicons 
                name={tab.icon} 
                size={16} 
                color={active ? '#FFF' : '#6B7280'} 
              />
              <Text 
                className={`text-sm font-semibold ml-1.5 ${
                  active ? 'text-white' : 'text-gray-600'
                }`}
              >
                {tab.label}
              </Text>
              {count > 0 && (
                <View 
                  className={`ml-2 min-w-[22px] h-5 rounded-full items-center justify-center px-2 ${
                    active ? 'bg-white/25' : 'bg-gray-200'
                  }`}
                >
                  <Text 
                    className={`text-xs font-bold ${
                      active ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // ── RENDER: Order Card ──
  const renderCard = ({ item: order }: { item: VendorOrder }) => {
    const expanded = expandedId === order._id;
    const nextStatus = STATUS_FLOW[order.status] || null;
    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const paymentConfig = PAYMENT_CONFIG[order.paymentStatus] || PAYMENT_CONFIG.pending;
    const isUpdating = updatingId === order._id;
    const vendorTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => setExpandedId(expanded ? null : order._id)}
        className="bg-white rounded-3xl mb-4 overflow-hidden"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <View className="p-5">
          {/* Header Row */}
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Order
              </Text>
              <Text className="text-lg font-bold text-gray-900" style={{ letterSpacing: -0.5 }}>
                #{order.orderNumber}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">
                {fmtDate(order.createdAt)}
              </Text>
            </View>
            
            <View className={`px-4 py-2 rounded-xl ${statusConfig.bg}`}>
              <Text className={`text-xs font-bold ${statusConfig.text} uppercase tracking-wide`}>
                {fmtStatus(order.status)}
              </Text>
            </View>
          </View>

          {/* Customer Info */}
          <View className="flex-row items-center mb-4 pb-4 border-b border-gray-100">
            <View className="w-10 h-10 rounded-full bg-pink-100 items-center justify-center mr-3">
              <Ionicons name="person" size={18} color="#EC4899" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                {order.user?.firstName || ''} {order.user?.lastName || ''}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                {order.user?.email}
              </Text>
            </View>
            
            <View className={`px-3 py-1.5 rounded-lg ${paymentConfig.bg} flex-row items-center`}>
              <Ionicons name={paymentConfig.icon} size={12} color={paymentConfig.text.replace('text-', '#')} />
              <Text className={`text-xs font-bold ${paymentConfig.text} ml-1`}>
                {fmtStatus(order.paymentStatus || '')}
              </Text>
            </View>
          </View>

          {/* Items Preview (show first 2 when collapsed) */}
          {order.items.slice(0, expanded ? undefined : 2).map((item, idx) => {
            const img = getItemImage(item);
            const name = getItemName(item);
            const isDigital = (item.productType || '').toUpperCase() === 'DIGITAL';

            return (
              <View 
                key={idx} 
                className={`flex-row items-center py-3 ${
                  idx > 0 ? 'border-t border-gray-50' : ''
                }`}
              >
                {img ? (
                  <Image 
                    source={{ uri: img }} 
                    className="w-16 h-16 rounded-xl bg-gray-100" 
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-16 h-16 rounded-xl bg-gray-50 items-center justify-center">
                    <Ionicons name="cube-outline" size={24} color="#D1D5DB" />
                  </View>
                )}
                
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
                    {name}
                  </Text>
                  {item.variant && (
                    <Text className="text-xs text-gray-400 mt-1">
                      {item.variant}
                    </Text>
                  )}
                  {isDigital && (
                    <View className="flex-row items-center mt-1">
                      <View className="bg-purple-100 px-2 py-0.5 rounded-md flex-row items-center">
                        <Ionicons name="cloud-download-outline" size={10} color="#8B5CF6" />
                        <Text className="text-xs font-semibold text-purple-700 ml-1">
                          Digital
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
                
                <View className="items-end ml-3">
                  <Text className="text-xs text-gray-400 mb-1">×{item.quantity}</Text>
                  <Text className="text-sm font-bold text-gray-900">
                    {fmtPrice(item.price)}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Show more items indicator */}
          {!expanded && order.items.length > 2 && (
            <View className="py-2 items-center border-t border-gray-50">
              <Text className="text-xs text-gray-500 font-medium">
                +{order.items.length - 2} more {order.items.length - 2 === 1 ? 'item' : 'items'}
              </Text>
            </View>
          )}

          {/* Total Bar */}
          <View className="flex-row justify-between items-center mt-4 pt-4 border-t border-gray-100">
            <View>
              <Text className="text-xs text-gray-500 font-medium mb-1">
                Order Total
              </Text>
              <Text className="text-xl font-bold text-gray-900" style={{ letterSpacing: -0.5 }}>
                {fmtPrice(vendorTotal)}
              </Text>
            </View>
            
            {order.deliveryType && (
              <View className="bg-gray-50 px-4 py-2 rounded-xl flex-row items-center">
                <Ionicons
                  name={
                    order.deliveryType === 'digital' 
                      ? 'cloud-download-outline' 
                      : order.deliveryType === 'pickup' 
                      ? 'storefront-outline' 
                      : 'bicycle-outline'
                  }
                  size={16}
                  color="#6B7280"
                />
                <Text className="text-xs text-gray-600 font-semibold ml-2">
                  {fmtStatus(order.deliveryType)}
                </Text>
              </View>
            )}
          </View>

          {/* Expanded Details */}
          {expanded && (
            <View className="mt-5 pt-5 border-t border-gray-100">
              {/* Contact Details */}
              {order.user?.phone && (
                <View className="flex-row items-center mb-3">
                  <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center mr-3">
                    <Ionicons name="call-outline" size={16} color="#6B7280" />
                  </View>
                  <Text className="text-sm text-gray-700 flex-1">
                    {order.user.phone}
                  </Text>
                </View>
              )}

              {/* Payment Method */}
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center mr-3">
                  <Ionicons name="card-outline" size={16} color="#6B7280" />
                </View>
                <Text className="text-sm text-gray-700 flex-1">
                  {fmtStatus(order.paymentMethod || 'N/A')}
                </Text>
              </View>

              {/* Shipping Address */}
              {order.shippingAddress && !order.isDigital && (
                <View className="flex-row items-start mb-3">
                  <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center mr-3">
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                  </View>
                  <Text className="text-sm text-gray-700 flex-1 leading-5">
                    {[
                      order.shippingAddress.street,
                      order.shippingAddress.city,
                      order.shippingAddress.state,
                    ].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}

              {/* Tracking */}
              {order.vendorShipment?.trackingNumber && (
                <View className="flex-row items-center mb-3">
                  <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center mr-3">
                    <Ionicons name="navigate-outline" size={16} color="#6B7280" />
                  </View>
                  <Text className="text-sm text-gray-700 flex-1">
                    Tracking: {order.vendorShipment.trackingNumber}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View className="flex-row flex-wrap gap-3 mt-5">
                {/* Update Status Button */}
                {nextStatus && order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <TouchableOpacity
                    onPress={() => confirmUpdate(order._id, nextStatus)}
                    disabled={isUpdating}
                    activeOpacity={0.8}
                    className="flex-1 min-w-[140px]"
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
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size={16} color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={18} color="#fff" />
                          <Text className="text-white text-sm font-bold ml-2">
                            Mark {fmtStatus(nextStatus)}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {/* View Details Button */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('VendorOrderDetail', { orderId: order._id })}
                  activeOpacity={0.8}
                  className="flex-row items-center justify-center border-2 border-pink-500 px-4 py-3 rounded-xl flex-1 min-w-[120px]"
                >
                  <Ionicons name="eye-outline" size={18} color="#EC4899" />
                  <Text className="text-pink-500 text-sm font-bold ml-2">
                    View Details
                  </Text>
                </TouchableOpacity>

                {/* Cancel Button */}
                {(order.status === 'pending' || order.status === 'confirmed') && (
                  <TouchableOpacity
                    onPress={() => confirmUpdate(order._id, 'cancelled')}
                    disabled={isUpdating}
                    activeOpacity={0.8}
                    className="flex-row items-center justify-center border-2 border-rose-500 px-4 py-3 rounded-xl"
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                    <Text className="text-rose-500 text-sm font-bold ml-2">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Expand/Collapse Indicator */}
          <View className="items-center mt-3">
            <View className="w-10 h-1 rounded-full bg-gray-200" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── RENDER: Empty State ──
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View className="flex-1 items-center justify-center px-8 py-20">
        <View 
          className="w-24 h-24 rounded-3xl bg-gray-50 items-center justify-center mb-6"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
        </View>
        
        <Text className="text-xl font-bold text-gray-900 mb-2" style={{ letterSpacing: -0.5 }}>
          {activeTab === 'all' ? 'No Orders Yet' : `No ${fmtStatus(activeTab)} Orders`}
        </Text>
        
        <Text className="text-sm text-gray-500 text-center leading-6 mb-6">
          {activeTab === 'all'
            ? "When customers order your products,\nthey'll appear here."
            : `You don't have any ${activeTab} orders\nat the moment.`}
        </Text>
        
        {activeTab !== 'all' && (
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
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
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 14,
              }}
            >
              <Text className="text-white text-sm font-bold">
                View All Orders
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── RENDER: Loading State ──
  if (loading) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {renderHeader()}
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
          <Text className="text-base font-semibold text-gray-900">Loading Orders</Text>
          <Text className="text-sm text-gray-500 mt-2">Please wait...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {renderHeader()}
      {renderTabs()}

      <FlatList
        data={filteredOrders}
        renderItem={renderCard}
        keyExtractor={o => o._id}
        contentContainerStyle={{ 
          paddingHorizontal: 20, 
          paddingTop: 16, 
          paddingBottom: 100,
          flexGrow: 1 
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#EC4899']}
            tintColor="#EC4899"
          />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" color="#EC4899" />
            </View>
          ) : null
        }
      />

      <SuccessToast 
        message={successMsg} 
        visible={successVisible} 
        onDismiss={() => setSuccessVisible(false)} 
      />
      
      <ErrorToast 
        message={errorMsg} 
        visible={errorVisible} 
        onDismiss={() => setErrorVisible(false)} 
      />
    </View>
  );
};

export default VendorOrdersScreen;