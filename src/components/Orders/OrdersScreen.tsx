// screens/OrdersScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { getOrders, Order } from '@/services/api';
import { useFocusEffect } from '@react-navigation/native';

type OrdersScreenProps = NativeStackScreenProps<RootStackParamList, 'Orders'>;

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

const OrdersScreen = ({ navigation }: OrdersScreenProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(2);

  const statusTabs: { label: string; value: OrderStatus | 'all' }[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Completed', value: 'completed' },
  ];

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await getOrders(1, 50);
      
      if (response.success) {
        setOrders(response.data.orders);
        filterOrders(response.data.orders, selectedStatus, searchQuery);
      }
    } catch (error: any) {
      console.error('❌ Fetch orders error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load orders',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  const filterOrders = (
    ordersList: Order[],
    status: OrderStatus | 'all',
    search: string
  ) => {
    let filtered = ordersList;

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter((order) => {
        if (status === 'completed') {
          return order.status === 'delivered';
        }
        return order.status === status;
      });
    }

    // Filter by search query
    if (search.trim()) {
      filtered = filtered.filter((order) =>
        order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        order.items.some((item) =>
          item.productName.toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    setFilteredOrders(filtered);
  };

  const handleStatusChange = (status: OrderStatus | 'all') => {
    setSelectedStatus(status);
    filterOrders(orders, status, searchQuery);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterOrders(orders, selectedStatus, text);
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
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderOrderCard = (order: Order) => {
    const firstItem = order.items[0];
    const statusColor = getStatusColor(order.status);
    const statusLabel = getStatusLabel(order.status);

    return (
      <TouchableOpacity
        key={order._id}
        onPress={() => navigation.navigate('OrderDetails', { orderId: order._id })}
        className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
      >
        <View className="flex-row items-start">
          {/* Product Image */}
          <View className="w-16 h-16 bg-pink-50 rounded-xl overflow-hidden mr-3">
            {firstItem.productImage ? (
              <Image
                source={{ uri: firstItem.productImage }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Icon name="image-outline" size={24} color="#EC4899" />
              </View>
            )}
          </View>

          {/* Order Details */}
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
              {firstItem.productName}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              Item ID: {order.orderNumber}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              Date: {formatDate(order.createdAt)}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">Product Location:</Text>
            <Text className="text-xs text-gray-600">Yaba, Lagos</Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              Shop: {firstItem.productName.split(' ')[0]} Footwear
            </Text>
          </View>

          {/* More Options */}
          <TouchableOpacity className="p-2">
            <Icon name="ellipsis-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Quantity and Price Row */}
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <Text className="text-sm text-gray-700">
            Qty: {order.items.reduce((sum, item) => sum + item.quantity, 0)}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-base font-bold text-gray-900 mr-3">
              ₦{order.total.toLocaleString()}
            </Text>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: `${statusColor}15` }}
            >
              <Text className="text-xs font-semibold" style={{ color: statusColor }}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text className="text-xl font-bold ml-2">Orders</Text>
        </View>

        <View className="flex-row items-center gap-3">
          <TouchableOpacity className="w-10 h-10 items-center justify-center">
            <Icon name="notifications-outline" size={24} color="#111827" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('Cart' as any)}
            className="w-10 h-10 items-center justify-center relative"
          >
            <Icon name="cart-outline" size={24} color="#111827" />
            {cartItemCount > 0 && (
              <View className="absolute top-1 right-1 w-4 h-4 bg-pink-500 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity className="w-10 h-10 items-center justify-center">
            <Icon name="settings-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2.5">
          <Icon name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-sm text-gray-900"
            placeholder="Search products..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* Status Tabs */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {statusTabs.map((tab) => (
            <TouchableOpacity
              key={tab.value}
              onPress={() => handleStatusChange(tab.value)}
              className={`px-5 py-2 rounded-full ${
                selectedStatus === tab.value
                  ? 'bg-pink-500'
                  : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  selectedStatus === tab.value
                    ? 'text-white'
                    : 'text-gray-600'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView
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
        <View className="px-4 py-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map(renderOrderCard)
          ) : (
            <View className="items-center justify-center py-20">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Icon name="receipt-outline" size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 font-bold text-lg mb-2">No Orders Found</Text>
              <Text className="text-gray-500 text-center px-8">
                {searchQuery
                  ? 'No orders match your search'
                  : selectedStatus === 'all'
                  ? "You haven't placed any orders yet"
                  : `No ${selectedStatus} orders found`}
              </Text>
              {selectedStatus === 'all' && !searchQuery && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Home' as any)}
                  className="bg-pink-500 px-6 py-3 rounded-xl mt-6"
                >
                  <Text className="text-white font-semibold">Start Shopping</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrdersScreen;