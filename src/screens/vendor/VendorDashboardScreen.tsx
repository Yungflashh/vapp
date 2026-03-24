// ============================================================
// PROFESSIONAL VENDOR DASHBOARD SCREEN
// File: screens/vendor/VendorDashboardScreen.tsx
// Clean, modular, and enterprise-ready implementation
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { getVendorDashboard } from '@/services/vendor.service';
import { getWallet } from '@/services/wallet.service';
import { LinearGradient } from 'expo-linear-gradient';
import TierBadge from '@/components/TierBadge';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import WelcomeTour from '@/components/WelcomeTour';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 92;

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface DashboardData {
  overview: {
    todaySales: number;
    todaySalesChange: number;
    todayOrders: number;
    totalProducts: number;
    totalOrders: number;
    ordersChange: number;
    totalViews: number;
    viewsChange: number;
    totalRevenue: number;
    revenueChange: number;
  };
  salesChart: {
    daily: Array<{ day: string; sales: number; orders: number }>;
    totalWeeklySales: number;
    totalWeeklyOrders: number;
    highestDay: { day: string; sales: number };
  };
  topProducts: Array<{
    id: string;
    name: string;
    image: string;
    totalSales: number;
    price: number;
    rating: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    itemsCount: number;
    customer: { name: string } | null;
  }>;
  inventory: {
    lowStockCount: number;
    outOfStockCount: number;
    lowStockProducts: Array<{ id: string; name: string; quantity: number }>;
  };
  profile: {
    verificationProgress: number;
    businessName: string;
    businessLogo?: string;
  };
  rewardsTier?: {
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
    points: number;
    pointsToNextTier: number;
    badges: string[];
  };
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  change?: number;
  iconColor: string;
  iconBg: string;
  shadowColor: string;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

const formatCurrency = (amount: number): string => {
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getTierConfig = (tier: string) => {
  const configs: Record<string, { color: string; gradient: string[] }> = {
    Bronze: { color: '#8C2BE7', gradient: ['#8C2BE7', '#7B1FA2'] },
    Silver: { color: '#B3B3B3', gradient: ['#B3B3B3', '#9E9E9E'] },
    Gold: { color: '#CCA94F', gradient: ['#CCA94F', '#B8943A'] },
    Platinum: { color: '#D7195B', gradient: ['#D7195B', '#C2185B'] },
    Diamond: { color: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] },
  };
  return configs[tier] || configs.Bronze;
};

const getNextTier = (currentTier: string): string => {
  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  const currentIndex = tiers.indexOf(currentTier);
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : 'Diamond';
};

// ============================================================
// COMPONENTS
// ============================================================

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  change,
  iconColor,
  iconBg,
  shadowColor,
}) => (
  <View
    className="w-[48%] bg-white rounded-2xl p-5 mb-4"
    style={{
      shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    }}
  >
    <View className="flex-row items-start justify-between mb-3">
      <View className={`w-11 h-11 rounded-xl ${iconBg} items-center justify-center`}>
        <Icon name={icon} size={22} color={iconColor} />
      </View>
      {change !== undefined && change !== 0 && (
        <View
          className={`px-2.5 py-1 rounded-full ${
            change >= 0 ? 'bg-green-100' : 'bg-red-100'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change >= 0 ? '↑' : '↓'}
            {Math.abs(change).toFixed(0)}%
          </Text>
        </View>
      )}
    </View>
    <Text className="text-sm text-gray-500 mb-2">{label}</Text>
    <Text className="text-2xl font-bold text-gray-900">{value}</Text>
  </View>
);

interface DashboardHeaderProps {
  businessName: string;
  businessLogo?: string;
  onSettingsPress: () => void;
  onNotificationsPress: () => void;
  notificationCount?: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  businessName,
  businessLogo,
  onSettingsPress,
  onNotificationsPress,
  notificationCount = 0,
}) => (
  <View className="px-6 pt-4 pb-2">
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <View className="w-14 h-14 rounded-full bg-white items-center justify-center mr-3 border-2 border-pink-300 shadow-sm">
          {businessLogo ? (
            <Image
              source={{ uri: businessLogo }}
              className="w-full h-full rounded-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-2xl font-bold text-pink-500">
              {businessName?.charAt(0) || 'V'}
            </Text>
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
              {businessName || 'Vendor'}
            </Text>
            <View className="w-2 h-2 rounded-full bg-pink-500 ml-2" />
          </View>
          <Text className="text-sm text-gray-500 mt-1">
            Welcome back to your dashboard
          </Text>
        </View>
      </View>

      <View className="flex-row items-center ml-3">
        <TouchableOpacity
          onPress={onNotificationsPress}
          className="mr-4"
          activeOpacity={0.7}
        >
          <Icon name="notifications-outline" size={26} color="#6B7280" />
          {notificationCount > 0 && (
            <View className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full items-center justify-center">
              <Text className="text-[10px] text-white font-bold">{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onSettingsPress} activeOpacity={0.7}>
          <Icon name="settings-outline" size={26} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

interface VerificationBannerProps {
  progress: number;
  onVerifyPress: () => void;
}

const VerificationBanner: React.FC<VerificationBannerProps> = ({
  progress,
  onVerifyPress,
}) => (
  <View className="mx-6 mb-4">
    <View
      className="bg-white rounded-2xl p-5 overflow-hidden"
      style={{
        shadowColor: '#CC3366',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1 pr-3">
          <Text className="text-sm text-gray-500 mb-1">Account Verification</Text>
          <Text className="text-base font-bold text-gray-900">
            {progress}% Complete
          </Text>
          <Text className="text-xs text-gray-500 mt-1">
            Complete verification to unlock all features
          </Text>
        </View>
        <TouchableOpacity
          onPress={onVerifyPress}
          className="bg-pink-500 px-5 py-2.5 rounded-lg"
          activeOpacity={0.8}
          style={{
            shadowColor: '#CC3366',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text className="text-white font-bold text-sm">Verify</Text>
        </TouchableOpacity>
      </View>

      <View className="h-2 bg-pink-100 rounded-full overflow-hidden">
        <LinearGradient
          colors={['#CC3366', '#F97316']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: '100%',
            width: `${progress}%`,
            borderRadius: 9999,
          }}
        />
      </View>
    </View>
  </View>
);

interface RewardsTierCardProps {
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  points: number;
  pointsToNextTier: number;
}

const RewardsTierCard: React.FC<RewardsTierCardProps> = ({
  tier,
  points,
  pointsToNextTier,
}) => {
  const tierConfig = getTierConfig(tier);
  const nextTier = getNextTier(tier);
  const progressPercentage =
    pointsToNextTier > 0
      ? (points / (points + pointsToNextTier)) * 100
      : 100;

  return (
    <View className="mx-6 mb-4">
      <View
        className="rounded-2xl p-5 overflow-hidden"
        style={{
          shadowColor: tierConfig.color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <LinearGradient
          colors={['#FFFFFF', '#FFF7FB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 rounded-xl items-center justify-center overflow-hidden">
              <TierBadge tier={tier} size={48} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-lg font-bold text-gray-900">
                {tier} Tier
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                {pointsToNextTier > 0
                  ? `${pointsToNextTier} pts to ${nextTier}`
                  : 'Maximum tier reached'}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text
              className="text-base font-bold"
              style={{ color: tierConfig.color }}
            >
              {formatNumber(points)}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">points</Text>
          </View>
        </View>

        {pointsToNextTier > 0 && (
          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: tierConfig.color,
              }}
            />
          </View>
        )}
      </View>
    </View>
  );
};

interface SalesChartProps {
  data: Array<{ day: string; sales: number; orders: number }>;
  chartPeriod: 'weekly' | 'monthly';
  onPeriodChange: (period: 'weekly' | 'monthly') => void;
}

const SalesChart: React.FC<SalesChartProps> = ({
  data,
  chartPeriod,
  onPeriodChange,
}) => (
  <View className="mx-6 mb-4">
    <View
      className="bg-white rounded-2xl p-5"
      style={{
        shadowColor: '#CC3366',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold text-gray-900">Sales Overview</Text>
        <View className="flex-row bg-pink-50 rounded-xl p-1">
          <TouchableOpacity
            onPress={() => onPeriodChange('weekly')}
            className={`px-4 py-1.5 rounded-lg ${
              chartPeriod === 'weekly' ? 'bg-pink-500' : 'bg-transparent'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-bold ${
                chartPeriod === 'weekly' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onPeriodChange('monthly')}
            className={`px-4 py-1.5 rounded-lg ${
              chartPeriod === 'monthly' ? 'bg-pink-500' : 'bg-transparent'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-bold ${
                chartPeriod === 'monthly' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <BarChart
        data={{
          labels: data.map((d) => d.day),
          datasets: [{ data: data.map((d) => d.sales) }],
        }}
        width={CHART_WIDTH}
        height={200}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: '#FFFFFF',
          backgroundGradientFrom: '#FFFFFF',
          backgroundGradientTo: '#FFF7FB',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(236, 72, 153, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
          style: { borderRadius: 16 },
          barPercentage: 0.6,
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: '#FDE2F3',
            strokeWidth: 1,
          },
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </View>
  </View>
);

const LoadingState: React.FC = () => (
  <SafeAreaView
    className="flex-1"
    style={{ backgroundColor: '#FFF8FA' }}
    edges={['top', 'bottom']}
  >
    <StatusBar barStyle="dark-content" backgroundColor="#FFF8FA" />
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#CC3366" />
      <Text className="text-gray-600 mt-4 text-base">Loading dashboard...</Text>
    </View>
  </SafeAreaView>
);

interface ErrorStateProps {
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ onRetry }) => (
  <SafeAreaView
    className="flex-1"
    style={{ backgroundColor: '#FFF8FA' }}
    edges={['top', 'bottom']}
  >
    <StatusBar barStyle="dark-content" backgroundColor="#FFF8FA" />
    <View className="flex-1 items-center justify-center px-6">
      <Icon name="warning-outline" size={64} color="#EF4444" />
      <Text className="text-xl font-bold text-gray-900 mt-4">
        Failed to Load Dashboard
      </Text>
      <Text className="text-gray-600 text-center mt-2">
        Unable to load your dashboard data. Please try again.
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        className="bg-pink-500 px-6 py-3 rounded-lg mt-6"
        activeOpacity={0.8}
      >
        <Text className="text-white font-semibold">Retry</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

const VendorDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { unreadCount: notificationCount } = useNotifications();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [response, walletRes] = await Promise.all([
        getVendorDashboard(),
        getWallet().catch(() => null),
      ]);
      if (response.success) {
        const data = response.data;
        // Merge wallet data into overview if available
        if (walletRes?.success && walletRes.data?.wallet) {
          const w = walletRes.data.wallet;
          console.log('💰 Dashboard wallet:', JSON.stringify(w, null, 2));
          data.overview.todaySales = w.balance ?? data.overview.todaySales;
          (data.overview as any).totalWithdrawn = w.totalWithdrawn ?? 0;
        }
        setDashboard(data);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, []);

  const handleSettingsPress = () => {
    navigation.navigate('VendorStoreSetup' as never);
  };

  const handleNotificationsPress = () => {
    navigation.navigate('Notifications' as never);
  };

  const handleVerificationPress = () => {
    navigation.navigate('VendorStoreSetup' as never);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!dashboard) {
    return <ErrorState onRetry={fetchDashboard} />;
  }

  const statsData = [
    {
      icon: 'cash-outline',
      label: 'Total Revenue',
      value: formatCurrency(dashboard.overview.totalRevenue),
      change: dashboard.overview.revenueChange,
      iconColor: '#10B981',
      iconBg: 'bg-green-100',
      shadowColor: '#10B981',
    },
    {
      icon: 'wallet-outline',
      label: 'Available Balance',
      value: formatCurrency(dashboard.overview.todaySales),
      change: dashboard.overview.todaySalesChange,
      iconColor: '#CC3366',
      iconBg: 'bg-pink-100',
      shadowColor: '#CC3366',
    },
    {
      icon: 'arrow-down-circle-outline',
      label: 'Total Withdrawn',
      value: formatCurrency((dashboard.overview as any).totalWithdrawn || 0),
      change: undefined,
      iconColor: '#F59E0B',
      iconBg: 'bg-yellow-100',
      shadowColor: '#F59E0B',
    },
    {
      icon: 'bag-handle-outline',
      label: 'Total Orders',
      value: dashboard.overview.totalOrders.toString(),
      change: dashboard.overview.ordersChange,
      iconColor: '#3B82F6',
      iconBg: 'bg-blue-100',
      shadowColor: '#3B82F6',
    },
  ];

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: '#FFF8FA' }}
      edges={['top', 'bottom']}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8FA" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: '#FFF8FA' }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#CC3366"
            colors={['#CC3366']}
          />
        }
      >
        <DashboardHeader
          businessName={dashboard.profile.businessName}
          businessLogo={dashboard.profile.businessLogo || (user as any)?.avatar}
          onSettingsPress={handleSettingsPress}
          onNotificationsPress={handleNotificationsPress}
          notificationCount={notificationCount}
        />

        {/* Stats Grid */}
        <View className="px-6 py-2">
          <View className="flex-row flex-wrap justify-between">
            {statsData.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </View>
        </View>

        {/* Rewards Tier Card */}
        {dashboard.rewardsTier && (
          <RewardsTierCard
            tier={dashboard.rewardsTier.tier}
            points={dashboard.rewardsTier.points}
            pointsToNextTier={dashboard.rewardsTier.pointsToNextTier}
          />
        )}

        {/* Quick Actions */}
        <View className="px-6 mb-4">
          <Text className="text-base font-bold text-gray-900 mb-3">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            {[
              { icon: 'add-circle-outline', label: 'Add Product', route: 'AddProduct', color: '#CC3366' },
              { icon: 'clipboard-outline', label: 'Orders', route: 'VendorOrders', color: '#3B82F6' },
              { icon: 'shield-outline', label: 'Disputes', route: 'DisputeCenter', color: '#EF4444' },
              { icon: 'wallet-outline', label: 'Withdraw', route: 'VendorEarnings', color: '#F59E0B' },
              { icon: 'trophy-outline', label: 'Rewards', route: 'Rewards', color: '#10B981' },
              { icon: 'gift-outline', label: 'Refer & Earn', route: 'Affiliate', color: '#8B5CF6' },
              { icon: 'storefront-outline', label: 'Store Setup', route: 'VendorStoreSetup', color: '#6366F1' },
              { icon: 'card-outline', label: 'Bank Setup', route: 'VendorBankSetup', color: '#0EA5E9' },
            ].map((action, idx) => (
              <TouchableOpacity
                key={idx}
                className="w-[48%] bg-white rounded-2xl p-4 mb-3 flex-row items-center"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}
                onPress={() => navigation.navigate(action.route as never)}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: action.color + '20' }}>
                  <Icon name={action.icon} size={20} color={action.color} />
                </View>
                <Text className="text-sm font-semibold text-gray-900 flex-1" numberOfLines={1}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Verification Banner */}
        {dashboard.profile.verificationProgress < 100 && (
          <VerificationBanner
            progress={dashboard.profile.verificationProgress}
            onVerifyPress={handleVerificationPress}
          />
        )}

        {/* Sales Chart */}
        <SalesChart
          data={dashboard.salesChart.daily}
          chartPeriod={chartPeriod}
          onPeriodChange={setChartPeriod}
        />

        {/* Top Selling Products */}
        {dashboard.topProducts && dashboard.topProducts.length > 0 && (
          <View className="mx-6 mb-4">
            <View
              className="bg-white rounded-2xl p-5"
              style={{ shadowColor: '#CC3366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}
            >
              <Text className="text-lg font-bold text-gray-900 mb-4">Top Selling Products</Text>
              {dashboard.topProducts.slice(0, 5).map((product, index) => (
                <TouchableOpacity
                  key={product.id}
                  className="flex-row items-center py-3"
                  style={index < dashboard.topProducts.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' } : {}}
                  onPress={() => navigation.navigate('VendorProductDetail' as never, { productId: product.id } as never)}
                  activeOpacity={0.7}
                >
                  <Text className="text-sm font-bold text-gray-400 w-6">{index + 1}</Text>
                  <View className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden mr-3">
                    {product.image ? (
                      <Image source={{ uri: product.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <Icon name="cube-outline" size={20} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>{product.name}</Text>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-xs text-gray-500">{formatCurrency(product.price)}</Text>
                      <Text className="text-xs text-gray-400 mx-2">|</Text>
                      <Text className="text-xs text-pink-500 font-semibold">{product.totalSales} sold</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Icon name="star" size={12} color="#FBBF24" />
                    <Text className="text-xs font-semibold text-gray-700 ml-1">{product.rating?.toFixed(1) || '0.0'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View className="h-24" />
      </ScrollView>

      {/* Welcome Tour for vendors */}
      <WelcomeTour
        role="vendor"
        userName={dashboard.profile?.businessName}
        onComplete={() => {}}
      />
    </SafeAreaView>
  );
};

export default VendorDashboardScreen;