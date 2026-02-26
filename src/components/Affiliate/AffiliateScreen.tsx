// screens/AffiliateScreen.tsx - COMPLETE FIXED VERSION
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
import { getCurrentUser } from '@/services/auth.service';
import {
  activateAffiliate,
  getAffiliateDashboard,
  getAffiliateEarnings,
  type AffiliateDashboard,
  type AffiliateEarnings,
} from '@/services/affiliate.service';

type AffiliateScreenProps = NativeStackScreenProps<RootStackParamList, 'Affiliate'>;

const AffiliateScreen = ({ navigation }: AffiliateScreenProps) => {
  const [dashboard, setDashboard] = useState<AffiliateDashboard | null>(null);
  const [earningsData, setEarningsData] = useState<AffiliateEarnings | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days' | '90days'>('30days');
  const [chartPeriod, setChartPeriod] = useState<'Weekly' | 'Monthly'>('Weekly');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    checkAffiliateStatus();
  }, []);

  const checkAffiliateStatus = async () => {
    try {
      setIsLoading(true);

      const result = await getCurrentUser();

      if (result.success) {
        const user = result.data.user;
        setUserName(`${user.firstName} ${user.lastName}`);

        if (user.isAffiliate) {
          setIsAffiliate(true);
          await fetchDashboardData();
        } else {
          setIsAffiliate(false);
        }
      }
    } catch (error) {
      console.error('❌ Check affiliate status error:', error);
      setIsAffiliate(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const dashboardResult = await getAffiliateDashboard();

      if (dashboardResult.success) {
        setDashboard(dashboardResult.data);
      }

      const earningsResult = await getAffiliateEarnings(selectedPeriod);

      if (earningsResult.success) {
        setEarningsData(earningsResult.data);
      }
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
      const result = await activateAffiliate();

      if (result.success) {
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

  const handleCopyAffiliateLink = async (code: string) => {
    const url = `https://vendorspot.com/products?ref=${code}`;
    await Clipboard.setStringAsync(url);

    Toast.show({
      type: 'success',
      text1: 'Copied!',
      text2: 'Link copied to clipboard',
    });
  };

  const handleShareAffiliateLink = async (code: string, productName?: string) => {
    const url = `https://vendorspot.com/products?ref=${code}`;
    const message = productName
      ? `Check out ${productName} on VendorSpot: ${url}`
      : `Shop on VendorSpot using my link: ${url}`;

    try {
      await Share.share({ message, url });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Bar chart component
  const SimpleBarChart = () => {
    let displayData = earningsData?.earningsByDate || [];
    let isPlaceholder = false;

    if (displayData.length === 0) {
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
    }

    const data = displayData.slice(-7);
    const maxEarnings = Math.max(...data.map((d) => d.earnings), 1);
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

  // ==================== ACTIVATION SCREEN ====================
  if (!isAffiliate && !isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
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

  // ==================== LOADING SCREEN ====================
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

  // ==================== MAIN DASHBOARD ====================
  const affiliateLinks = dashboard?.links || [];
  const hasLinks = affiliateLinks.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header - Analytics icon instead of notification/settings */}
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

        <TouchableOpacity
          onPress={() => {
            Toast.show({
              type: 'info',
              text1: 'Analytics',
              text2: 'Scroll down to see your performance analytics',
            });
          }}
          className="w-10 h-10 items-center justify-center"
        >
          <Icon name="analytics-outline" size={24} color="#EC4899" />
        </TouchableOpacity>
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
                </View>
                <Text className="text-xs text-gray-500 mb-1">Total Earnings</Text>
                <Text className="text-xl font-bold text-gray-900">
                  ₦{(dashboard?.summary.totalEarnings || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Available Balance */}
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center">
                    <MaterialCommunityIcons name="cash-check" size={20} color="#22C55E" />
                  </View>
                </View>
                <Text className="text-xs text-gray-500 mb-1">Available Balance</Text>
                <Text className="text-xl font-bold text-gray-900">
                  ₦{(dashboard?.summary.availableBalance || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Pending Commission */}
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="w-10 h-10 bg-orange-100 rounded-xl items-center justify-center">
                    <Icon name="time-outline" size={20} color="#F59E0B" />
                  </View>
                </View>
                <Text className="text-xs text-gray-500 mb-1">Pending Commission</Text>
                <Text className="text-xl font-bold text-gray-900">
                  ₦{(dashboard?.summary.pendingBalance || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Conversions */}
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center">
                    <Icon name="cart-outline" size={20} color="#3B82F6" />
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

        {/* My Affiliate Links */}
        <View className="px-4 pb-4">
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-gray-900">My Affiliate Links</Text>
              <View className="bg-pink-100 px-3 py-1 rounded-full">
                <Text className="text-pink-600 text-xs font-bold">
                  {affiliateLinks.length} {affiliateLinks.length === 1 ? 'link' : 'links'}
                </Text>
              </View>
            </View>

            {!hasLinks ? (
              <View className="items-center py-6">
                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                  <Icon name="link-outline" size={28} color="#9CA3AF" />
                </View>
                <Text className="text-sm font-semibold text-gray-700 mb-1">
                  No affiliate links yet
                </Text>
                <Text className="text-xs text-gray-500 text-center px-4">
                  Generate links for products you want to promote and start earning commissions!
                </Text>
              </View>
            ) : (
              <View>
                {affiliateLinks.map((link: any, index: number) => {
                  const isProductLink = !!link.product;
                  const productName = isProductLink
                    ? link.product?.name || 'Unknown Product'
                    : 'General Link';
                  const conversionRate =
                    link.clicks > 0
                      ? ((link.conversions / link.clicks) * 100).toFixed(1)
                      : '0.0';

                  return (
                    <View
                      key={link._id || index}
                      className={`${
                        index < affiliateLinks.length - 1
                          ? 'mb-4 pb-4 border-b border-gray-100'
                          : ''
                      }`}
                    >
                      {/* Link Header */}
                      <View className="flex-row items-center mb-3">
                        <View
                          className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                            isProductLink ? 'bg-pink-100' : 'bg-purple-100'
                          }`}
                        >
                          {isProductLink ? (
                            <Icon name="pricetag-outline" size={18} color="#EC4899" />
                          ) : (
                            <Icon name="globe-outline" size={18} color="#8B5CF6" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-sm font-semibold text-gray-900"
                            numberOfLines={1}
                          >
                            {productName}
                          </Text>
                          <Text className="text-xs text-gray-400">Code: {link.code}</Text>
                        </View>
                        <View
                          className={`px-2 py-1 rounded-full ${
                            link.isActive !== false ? 'bg-green-100' : 'bg-gray-100'
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              link.isActive !== false ? 'text-green-600' : 'text-gray-500'
                            }`}
                          >
                            {link.isActive !== false ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      </View>

                      {/* Link Stats */}
                      <View className="flex-row mb-3">
                        <View className="flex-1 items-center bg-gray-50 rounded-lg py-2 mr-2">
                          <Text className="text-xs text-gray-500">Clicks</Text>
                          <Text className="text-sm font-bold text-gray-900">
                            {link.clicks || 0}
                          </Text>
                        </View>
                        <View className="flex-1 items-center bg-gray-50 rounded-lg py-2 mr-2">
                          <Text className="text-xs text-gray-500">Conversions</Text>
                          <Text className="text-sm font-bold text-gray-900">
                            {link.conversions || 0}
                          </Text>
                        </View>
                        <View className="flex-1 items-center bg-gray-50 rounded-lg py-2 mr-2">
                          <Text className="text-xs text-gray-500">Rate</Text>
                          <Text className="text-sm font-bold text-gray-900">
                            {conversionRate}%
                          </Text>
                        </View>
                        <View className="flex-1 items-center bg-gray-50 rounded-lg py-2">
                          <Text className="text-xs text-gray-500">Earned</Text>
                          <Text className="text-sm font-bold text-green-600">
                            ₦{(link.totalEarned || 0).toLocaleString()}
                          </Text>
                        </View>
                      </View>

                      {/* Link Actions */}
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => handleCopyAffiliateLink(link.code)}
                          className="flex-1 bg-gray-100 py-2.5 rounded-lg flex-row items-center justify-center"
                        >
                          <MaterialCommunityIcons
                            name="content-copy"
                            size={14}
                            color="#6B7280"
                          />
                          <Text className="text-gray-700 text-xs font-semibold ml-1.5">
                            Copy
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            handleShareAffiliateLink(
                              link.code,
                              isProductLink ? link.product?.name : undefined
                            )
                          }
                          className="flex-1 bg-pink-500 py-2.5 rounded-lg flex-row items-center justify-center"
                        >
                          <Icon name="share-social-outline" size={14} color="#FFFFFF" />
                          <Text className="text-white text-xs font-semibold ml-1.5">Share</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Top Performing Links */}
        {dashboard?.topPerformingLinks && dashboard.topPerformingLinks.length > 0 && (
          <View className="px-4 pb-4">
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center mb-4">
                <Icon name="trophy-outline" size={20} color="#F59E0B" />
                <Text className="text-base font-bold text-gray-900 ml-2">Top Performing</Text>
              </View>

              {dashboard.topPerformingLinks.slice(0, 3).map((link: any, index: number) => {
                const productName = link.product?.name || 'General Link';

                return (
                  <View
                    key={link._id || index}
                    className={`flex-row items-center py-3 ${
                      index < Math.min(dashboard.topPerformingLinks.length, 3) - 1
                        ? 'border-b border-gray-100'
                        : ''
                    }`}
                  >
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                        index === 0
                          ? 'bg-yellow-100'
                          : index === 1
                            ? 'bg-gray-200'
                            : 'bg-orange-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          index === 0
                            ? 'text-yellow-600'
                            : index === 1
                              ? 'text-gray-600'
                              : 'text-orange-600'
                        }`}
                      >
                        #{index + 1}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                        {productName}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {link.clicks || 0} clicks · {link.conversions || 0} conversions
                      </Text>
                    </View>
                    <Text className="text-sm font-bold text-green-600">
                      ₦{(link.totalEarned || 0).toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent Conversions */}
        {dashboard?.recentConversions && dashboard.recentConversions.length > 0 && (
          <View className="px-4 pb-4">
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center mb-4">
                <Icon name="receipt-outline" size={20} color="#3B82F6" />
                <Text className="text-base font-bold text-gray-900 ml-2">
                  Recent Conversions
                </Text>
              </View>

              {dashboard.recentConversions.slice(0, 5).map((conversion: any, index: number) => {
                const date = new Date(conversion.createdAt);
                const formattedDate = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <View
                    key={conversion._id || index}
                    className={`flex-row items-center py-3 ${
                      index < Math.min(dashboard.recentConversions.length, 5) - 1
                        ? 'border-b border-gray-100'
                        : ''
                    }`}
                  >
                    <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                      <Icon name="checkmark-circle-outline" size={20} color="#22C55E" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900">
                        Order #{conversion.orderNumber}
                      </Text>
                      <Text className="text-xs text-gray-500">{formattedDate}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-sm font-bold text-green-600">
                        +₦{(conversion.affiliateCommission || 0).toLocaleString()}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        ₦{(conversion.total || 0).toLocaleString()} order
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

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