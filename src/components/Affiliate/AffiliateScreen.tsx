// screens/AffiliateScreen.tsx - IMPROVED EXPO VERSION WITH BETTER EMPTY STATES
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import * as Clipboard from 'expo-clipboard';
import api from '@/services/api';

type AffiliateScreenProps = NativeStackScreenProps<RootStackParamList, 'Affiliate'>;

interface AffiliateDashboard {
  summary: {
    affiliateCode: string;
    totalClicks: number;
    totalConversions: number;
    totalEarnings: number;
    conversionRate: string;
    availableBalance: number;
  };
  links: any[];
  topPerformingLinks: any[];
  recentConversions: any[];
}

interface EarningsData {
  period: string;
  summary: {
    totalOrders: number;
    totalEarnings: number;
    averageCommission: number;
  };
  earningsByDate: Array<{
    date: string;
    orders: number;
    earnings: number;
  }>;
}

const AffiliateScreen = ({ navigation }: AffiliateScreenProps) => {
  const [dashboard, setDashboard] = useState<AffiliateDashboard | null>(null);
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days' | '90days'>('30days');
  const [chartPeriod, setChartPeriod] = useState<'Weekly' | 'Monthly'>('Weekly');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    console.log('🎨 Current UI State:', {
      isLoading,
      isAffiliate,
      isActivating,
      isRefreshing,
      userName,
      hasDashboard: !!dashboard,
      hasEarningsData: !!earningsData,
    });

    if (isLoading) {
      console.log('🎨 Rendering: Loading Screen');
    } else if (!isAffiliate) {
      console.log('🎨 Rendering: Activation Screen');
    } else {
      console.log('🎨 Rendering: Main Dashboard');
    }
  }, [isLoading, isAffiliate, isActivating, isRefreshing, dashboard, earningsData]);

  useEffect(() => {
    checkAffiliateStatus();
  }, []);

  const checkAffiliateStatus = async () => {
    try {
      console.log('🔍 ==================== CHECKING AFFILIATE STATUS ====================');
      setIsLoading(true);
      const response = await api.get('/auth/me');
      
      console.log('📥 Auth Me Response:', response.data);
      
      if (response.data.success) {
        const user = response.data.data.user;
        console.log('👤 User Data:', {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isAffiliate: user.isAffiliate,
          affiliateCode: user.affiliateCode,
        });
        
        setUserName(`${user.firstName} ${user.lastName}`);
        
        if (user.isAffiliate) {
          console.log('✅ User IS an affiliate');
          setIsAffiliate(true);
          await fetchDashboardData();
        } else {
          console.log('❌ User is NOT an affiliate');
          setIsAffiliate(false);
        }
      }
    } catch (error) {
      console.error('❌ Check affiliate status error:', error);
      setIsAffiliate(false);
    } finally {
      setIsLoading(false);
      console.log('🔍 ==================== AFFILIATE STATUS CHECK COMPLETE ====================');
    }
  };

  const fetchDashboardData = async () => {
    try {
      console.log('📊 ==================== FETCHING DASHBOARD DATA ====================');
      
      // Fetch dashboard
      console.log('🔄 Fetching affiliate dashboard...');
      const dashboardResponse = await api.get('/affiliate/dashboard');
      console.log('📥 Dashboard Response:', dashboardResponse.data);
      
      if (dashboardResponse.data.success) {
        console.log('✅ Dashboard data received');
        const data = dashboardResponse.data.data;
        console.log('📈 Summary:', data.summary);
        console.log('🔗 Links count:', data.links?.length || 0);
        console.log('🏆 Top performing links count:', data.topPerformingLinks?.length || 0);
        console.log('🛒 Recent conversions count:', data.recentConversions?.length || 0);
        setDashboard(data);
      }

      // Fetch earnings
      console.log(`🔄 Fetching affiliate earnings (period: ${selectedPeriod})...`);
      const earningsResponse = await api.get(`/affiliate/earnings?period=${selectedPeriod}`);
      console.log('📥 Earnings Response:', earningsResponse.data);
      
      if (earningsResponse.data.success) {
        console.log('✅ Earnings data received');
        const data = earningsResponse.data.data;
        console.log('💰 Earnings Summary:', {
          period: data.period,
          totalOrders: data.summary.totalOrders,
          totalEarnings: data.summary.totalEarnings,
          averageCommission: data.summary.averageCommission,
        });
        console.log('📅 Earnings by date count:', data.earningsByDate?.length || 0);
        setEarningsData(data);
      }
      
      console.log('📊 ==================== DASHBOARD DATA FETCH COMPLETE ====================');
    } catch (error) {
      console.error('❌ Fetch dashboard error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load affiliate data',
      });
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await checkAffiliateStatus();
    setIsRefreshing(false);
  };

  const handleActivateAffiliate = async () => {
    try {
      setIsActivating(true);
      const response = await api.post('/affiliate/activate');
      
      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Success!',
          text2: 'Affiliate account activated',
        });
        setIsAffiliate(true);
        await fetchDashboardData();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to activate affiliate account',
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!dashboard?.summary.affiliateCode) return;
    
    const affiliateUrl = `https://vendorspot.com/affiliatename/${dashboard.summary.affiliateCode}`;
    await Clipboard.setStringAsync(affiliateUrl);
    
    Toast.show({
      type: 'success',
      text1: 'Copied!',
      text2: 'Affiliate link copied to clipboard',
    });
  };

  const handleShareLink = async () => {
    if (!dashboard?.summary.affiliateCode) return;
    
    const affiliateUrl = `https://vendorspot.com/affiliatename/${dashboard.summary.affiliateCode}`;
    
    try {
      await Share.share({
        message: `Join VendorSpot using my affiliate link: ${affiliateUrl}`,
        url: affiliateUrl,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getPercentageChange = (current: number, previous: number = 0) => {
    if (previous === 0) return '+24';
    const change = ((current - previous) / previous) * 100;
    return change > 0 ? `+${change.toFixed(0)}` : change.toFixed(0);
  };

  // Improved bar chart with sample data when no real data exists
  const SimpleBarChart = () => {
    console.log('📊 Rendering bar chart...');
    
    // Use real data if available, otherwise show sample/placeholder data
    let displayData = earningsData?.earningsByDate || [];
    let isPlaceholder = false;
    
    if (displayData.length === 0) {
      console.log('⚠️ No earnings data available for chart');
      // Show placeholder data - all zeros
      isPlaceholder = true;
      const today = new Date();
      displayData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString(),
          orders: 0,
          earnings: 0,
        };
      });
      console.log('📊 Using placeholder data (7 days of zeros)');
    } else {
      console.log('📊 Using real earnings data:', displayData.length, 'days');
    }

    const data = displayData.slice(-7);
    const maxEarnings = Math.max(...data.map(d => d.earnings), 1);
    const screenWidth = Dimensions.get('window').width - 64;
    const barWidth = (screenWidth - 48) / 7;

    return (
      <View className="py-4">
        {isPlaceholder && (
          <View className="mb-3 px-3 py-2 bg-blue-50 rounded-lg">
            <Text className="text-xs text-blue-600 text-center">
              Start earning to see your commission chart here! 📈
            </Text>
          </View>
        )}
        
        <View className="flex-row items-end justify-between h-40">
          {data.map((item, index) => {
            const height = maxEarnings > 0 ? (item.earnings / maxEarnings) * 140 : 20;
            const date = new Date(item.date);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            // Highlight the day with most earnings, or Wednesday as default
            const isHighlighted = isPlaceholder 
              ? day === 'Wed' 
              : item.earnings === maxEarnings && item.earnings > 0;
            
            return (
              <View key={index} className="items-center flex-1">
                <View 
                  className={`rounded-t-lg ${isHighlighted && !isPlaceholder ? 'bg-pink-500' : 'bg-pink-200'}`}
                  style={{ 
                    width: barWidth - 8,
                    height: Math.max(height, 4),
                    opacity: isPlaceholder ? 0.3 : 1,
                  }}
                />
              </View>
            );
          })}
        </View>
        
        <View className="flex-row justify-between mt-3">
          {data.map((item, index) => {
            const date = new Date(item.date);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            return (
              <Text key={index} className="text-xs text-gray-500 flex-1 text-center">
                {day}
              </Text>
            );
          })}
        </View>
      </View>
    );
  };

  // Activation Screen
  if (!isAffiliate && !isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        {/* Header */}
        <View className="px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 items-center justify-center -ml-2"
            >
              <Icon name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text className="text-xl font-bold ml-2">Affiliate Account</Text>
          </View>
        </View>

        <ScrollView contentContainerClassName="flex-1 justify-center px-6">
          <View className="items-center">
            <View className="w-24 h-24 bg-pink-100 rounded-full items-center justify-center mb-6">
              <MaterialCommunityIcons name="diamond-outline" size={48} color="#EC4899" />
            </View>

            <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
              Become an Affiliate
            </Text>
            <Text className="text-base text-gray-600 text-center mb-8 px-4">
              Earn commissions by promoting VendorSpot products. Share your unique link and get
              rewarded for every successful referral!
            </Text>

            <View className="bg-pink-50 rounded-xl p-4 mb-8 w-full">
              <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 bg-pink-500 rounded-full items-center justify-center mr-3">
                  <Icon name="cash-outline" size={20} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-900">Earn Up to 15%</Text>
                  <Text className="text-xs text-gray-600">Commission on every sale</Text>
                </View>
              </View>

              <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 bg-pink-500 rounded-full items-center justify-center mr-3">
                  <Icon name="link-outline" size={20} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-900">Unique Link</Text>
                  <Text className="text-xs text-gray-600">Track your referrals easily</Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-pink-500 rounded-full items-center justify-center mr-3">
                  <Icon name="trending-up-outline" size={20} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-900">Real-time Analytics</Text>
                  <Text className="text-xs text-gray-600">Monitor your performance</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleActivateAffiliate}
              disabled={isActivating}
              className="bg-pink-500 py-4 px-8 rounded-xl w-full"
            >
              {isActivating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-bold text-center">
                  Activate Affiliate Account
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Loading affiliate data...</Text>
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
          <Text className="text-xl font-bold ml-2">Affiliate Account</Text>
        </View>

        <View className="flex-row items-center gap-3">
          <TouchableOpacity className="w-10 h-10 items-center justify-center">
            <Icon name="notifications-outline" size={24} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 items-center justify-center">
            <Icon name="settings-outline" size={24} color="#111827" />
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
        {/* User Info */}
        <View className="bg-white px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center mb-2">
            <View className="w-12 h-12 bg-pink-500 rounded-full items-center justify-center mr-3">
              <Icon name="person" size={24} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-base font-bold text-gray-900">Hello, {userName}</Text>
                <View className="w-5 h-5 bg-pink-500 rounded-full items-center justify-center ml-2">
                  <Icon name="checkmark" size={12} color="#FFFFFF" />
                </View>
              </View>
              <Text className="text-xs text-gray-500">Track your performance & earnings</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="px-4 py-4">
          <View className="flex-row flex-wrap -mx-2">
            {/* Total Earnings */}
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="w-10 h-10 bg-pink-100 rounded-xl items-center justify-center">
                    <MaterialCommunityIcons name="wallet" size={20} color="#EC4899" />
                  </View>
                  <View className="bg-green-100 px-2 py-1 rounded-full">
                    <Text className="text-green-600 text-xs font-bold">+24%</Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-500 mb-1">Total Earnings</Text>
                <Text className="text-xl font-bold text-gray-900">
                  ₦{(dashboard?.summary.totalEarnings || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Pending Balance */}
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center">
                    <Icon name="time-outline" size={20} color="#3B82F6" />
                  </View>
                  <View className="bg-green-100 px-2 py-1 rounded-full">
                    <Text className="text-green-600 text-xs font-bold">+15%</Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-500 mb-1">Pending Balance</Text>
                <Text className="text-xl font-bold text-gray-900">
                  ₦{(dashboard?.summary.availableBalance || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Total Referrals */}
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="w-10 h-10 bg-purple-100 rounded-xl items-center justify-center">
                    <Icon name="people-outline" size={20} color="#8B5CF6" />
                  </View>
                  <View className="bg-green-100 px-2 py-1 rounded-full">
                    <Text className="text-green-600 text-xs font-bold">+32%</Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-500 mb-1">Total Referrals</Text>
                <Text className="text-xl font-bold text-gray-900">
                  {dashboard?.summary.totalClicks || 0}
                </Text>
              </View>
            </View>

            {/* Conversions */}
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="w-10 h-10 bg-orange-100 rounded-xl items-center justify-center">
                    <Icon name="cart-outline" size={20} color="#F59E0B" />
                  </View>
                  <View className="bg-green-100 px-2 py-1 rounded-full">
                    <Text className="text-green-600 text-xs font-bold">+18%</Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-500 mb-1">Conversions</Text>
                <Text className="text-xl font-bold text-gray-900">
                  {dashboard?.summary.totalConversions || 0}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Invite a Vendor */}
        <View className="px-4 pb-4">
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-base font-bold text-gray-900 mb-3">Invite a Vendor</Text>
            
            <Text className="text-xs text-gray-500 mb-2">Your Unique Link</Text>
            <View className="bg-gray-50 rounded-xl p-3 mb-3">
              <Text className="text-sm text-gray-700" numberOfLines={1}>
                vendorspot.com/affiliatename/{dashboard?.summary.affiliateCode || 'signup'}
              </Text>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleCopyLink}
                className="flex-1 bg-pink-500 py-3 rounded-xl flex-row items-center justify-center"
              >
                <MaterialCommunityIcons name="content-copy" size={18} color="#FFFFFF" />
                <Text className="text-white font-semibold ml-2">Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShareLink}
                className="flex-1 bg-yellow-400 py-3 rounded-xl flex-row items-center justify-center"
              >
                <Icon name="share-social" size={18} color="#000000" />
                <Text className="text-gray-900 font-semibold ml-2">Share Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Commission Overview Chart */}
        <View className="px-4 pb-6">
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-gray-900">Commission Overview</Text>
              
              <View className="flex-row bg-gray-100 rounded-lg p-1">
                <TouchableOpacity
                  onPress={() => setChartPeriod('Weekly')}
                  className={`px-4 py-1.5 rounded-md ${
                    chartPeriod === 'Weekly' ? 'bg-pink-500' : ''
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      chartPeriod === 'Weekly' ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    Weekly
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setChartPeriod('Monthly')}
                  className={`px-4 py-1.5 rounded-md ${
                    chartPeriod === 'Monthly' ? 'bg-pink-500' : ''
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      chartPeriod === 'Monthly' ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    Monthly
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <SimpleBarChart />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AffiliateScreen;