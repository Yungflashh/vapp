// screens/tabScreen/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import { BottomTabParamList } from '@/navigation/BottomTabNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { logout, getCurrentUser } from '@/services/auth.service';
import { getCart } from '@/services/cart.service';
import { getOrders } from '@/services/order.service';
import { getUserPoints } from '@/services/reward.service';
import { getWallet } from '@/services/wallet.service';

type ProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  points?: number;
  badges?: string[];
  achievements?: string[];
}

interface OrderStats {
  activeOrders: number;
  vouchers: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  total: number;
  items: Array<{
    productName: string;
    productImage?: string;
  }>;
}

const ProfileScreen = ({ navigation }: ProfileScreenProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [orderStats, setOrderStats] = useState<OrderStats>({ activeOrders: 0, vouchers: 3 });
  const [userPoints, setUserPoints] = useState(0);
  const [userTier, setUserTier] = useState('BRONZE');
  const [pointsToNextTier, setPointsToNextTier] = useState(0);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user profile
      const profileResponse = await getCurrentUser();
      if (profileResponse.success) {
        setUser(profileResponse.data.user);
      }

      // Fetch wallet balance
      try {
        const walletResponse = await getWallet();
        if (walletResponse.success) {
          setWalletBalance(walletResponse.data.wallet.balance || 0);
        }
      } catch (err) {
        console.log('⚠️ Wallet fetch error:', err);
      }

      // Fetch order stats
      try {
        const ordersResponse = await getOrders(1, 100);
        if (ordersResponse.success) {
          const orders = ordersResponse.data.orders;
          
          const active = orders.filter((order: any) => 
            ['pending', 'confirmed', 'processing', 'shipped', 'in_transit'].includes(order.status)
          ).length;
          
          setOrderStats({
            activeOrders: active,
            vouchers: 3,
          });

          setRecentOrders(orders.slice(0, 3));
        }
      } catch (err) {
        console.log('⚠️ Orders fetch error:', err);
      }

      // Fetch reward points
      try {
        const rewardsResponse = await getUserPoints();
        if (rewardsResponse.success) {
          const points = rewardsResponse.data.points || 0;
          const tier = rewardsResponse.data.tier || 'Bronze';
          const toNext = rewardsResponse.data.pointsToNextTier || 500;
          
          setUserPoints(points);
          setUserTier(tier.toUpperCase());
          setPointsToNextTier(toNext);
        }
      } catch (err) {
        console.log('⚠️ Rewards fetch error:', err);
      }

    } catch (error: any) {
      console.error('❌ Error fetching profile data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load profile data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfileData();
    setIsRefreshing(false);
  };

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setShowLogoutModal(false);
      await logout();
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been logged out successfully',
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to logout',
      });
    }
  };

// Updated ProfileScreen.tsx - Add this line to the quickActions array

const quickActions = [
  { id: 'orders', icon: 'receipt', label: 'Orders', color: '#EC4899', screen: 'Orders' },
  { id: 'rewards', icon: 'trophy', label: 'Rewards', color: '#F59E0B', screen: 'Rewards' },
  { id: 'addresses', icon: 'location', label: 'Addresses', color: '#10B981', screen: 'SavedAddresses' },
  { id: 'reviews', icon: 'star', label: 'Reviews', color: '#3B82F6', screen: null },
  { id: 'wishlist', icon: 'heart', label: 'Wishlist', color: '#EF4444', screen: 'Wishlist' },
  { id: 'affiliate', icon: 'diamond', label: 'Affiliate', color: '#8B5CF6', screen: 'Affiliate' }, // ✅ Updated this line
  { id: 'dispute', icon: 'help-circle', label: 'Dispute', color: '#6B7280', screen: null },
  { id: 'leaderboards', icon: 'bar-chart', label: 'Leaderboards', color: '#06B6D4', screen: null },
];



 
  const getTierColor = () => {
    switch (userTier.toUpperCase()) {
      case 'BRONZE':
        return '#CD7F32';
      case 'SILVER':
        return '#C0C0C0';
      case 'GOLD':
        return '#FFD700';
      case 'PLATINUM':
        return '#E5E4E2';
      default:
        return '#CD7F32';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
        <Text className="text-xl font-bold">
          <Text className="text-pink-500">My</Text>
          <Text className="text-gray-900"> Profile</Text>
        </Text>

        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center"
            onPress={() => navigation.navigate('Settings' as any)}
          >
            <Icon name="settings-outline" size={24} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center"
            onPress={handleLogoutPress}
          >
            <Icon name="log-out-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

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
        {/* Profile Info */}
        <View className="px-4 py-4 bg-white">
          <View className="flex-row items-center">
            <View className="relative">
              <View className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden border-2 border-pink-500">
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="w-full h-full items-center justify-center bg-pink-100">
                    <Icon name="person" size={32} color="#EC4899" />
                  </View>
                )}
              </View>
              {user?.emailVerified && (
                <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-pink-500 rounded-full items-center justify-center border-2 border-white">
                  <Icon name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>

            <View className="flex-1 ml-3">
              <Text className="text-base font-bold text-gray-900">
                {user?.firstName} {user?.lastName}
              </Text>
              <Text className="text-xs text-gray-500 mb-1">{user?.email}</Text>
              
              {/* Star Rating */}
              <View className="flex-row items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon key={star} name="star" size={12} color="#FBBF24" />
                ))}
                <Text className="text-xs text-gray-600 ml-1">Verified Buyer</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Wallet Balance Card */}
        <View className="px-4 py-3">
          <View className="bg-pink-500 rounded-2xl p-4 shadow-md">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white text-xs font-medium">Wallet Balance</Text>
              <TouchableOpacity className="flex-row items-center bg-white/20 px-3 py-1.5 rounded-full">
                <Icon name="arrow-up-circle" size={14} color="#FFFFFF" />
                <Text className="text-white text-xs font-semibold ml-1">Top Up</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-white text-3xl font-bold mb-3">
              ₦{walletBalance.toLocaleString()}
            </Text>

            <View className="flex-row items-center">
              <View className="flex-row items-center mr-4">
                <Icon name="receipt" size={14} color="#FFFFFF" />
                <Text className="text-white text-xs ml-1">
                  {orderStats.activeOrders} Active Orders
                </Text>
              </View>
              <View className="flex-row items-center">
                <Icon name="ticket" size={14} color="#FFFFFF" />
                <Text className="text-white text-xs ml-1">
                  {orderStats.vouchers} Vouchers
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Points Card */}
        <View className="px-4 pb-3">
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View 
                  className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: getTierColor() }}
                >
                  <Icon name="trophy" size={24} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-900">{userTier}</Text>
                  <Text className="text-xs text-gray-500">
                    Earn {pointsToNextTier} points more to reach next tier
                  </Text>
                </View>
              </View>
              <Text className="text-base font-bold" style={{ color: getTierColor() }}>
                {userPoints} points
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions - 4 per row */}
        <View className="px-4 pb-3">
          <Text className="text-base font-bold text-gray-900 mb-3">Quick actions</Text>
          <View className="flex-row flex-wrap -mx-1">
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                className="w-[25%] px-1 mb-4 items-center"
                onPress={() => action.screen && navigation.navigate(action.screen as any)}
              >
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <Icon name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text className="text-xs text-gray-700 text-center">{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Orders */}
        <View className="px-4 pb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-gray-900">Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders' as any)}>
              <Text className="text-xs text-pink-500 font-semibold">See All</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <TouchableOpacity
                key={order._id}
                className="bg-white rounded-xl p-3 mb-3 flex-row items-center shadow-sm"
                onPress={() => navigation.navigate('OrderDetails', { orderId: order._id })}
              >
                <View className="w-14 h-14 bg-pink-100 rounded-lg overflow-hidden mr-3">
                  {order.items[0]?.productImage ? (
                    <Image
                      source={{ uri: order.items[0].productImage }}
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
                  <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                    {order.items[0]?.productName || 'Order'}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    Order #VN-{order.orderNumber}
                  </Text>
                </View>

                <Text className="text-sm font-bold text-gray-900">
                  ₦{order.total.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View className="bg-white rounded-xl p-8 items-center">
              <Icon name="receipt-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2 text-sm">No recent orders</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center self-center mb-4">
              <Icon name="log-out-outline" size={32} color="#EF4444" />
            </View>

            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              Logout
            </Text>
            <Text className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to logout? You'll need to login again to access your account.
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg border border-gray-300"
                onPress={() => setShowLogoutModal(false)}
              >
                <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg bg-red-500"
                onPress={handleLogoutConfirm}
              >
                <Text className="text-white font-semibold text-center">Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;