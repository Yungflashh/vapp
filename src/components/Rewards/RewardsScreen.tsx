// screens/RewardsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { getUserPoints, getAvailableRewards, redeemPoints } from '@/services/reward.service';

type RewardsScreenProps = NativeStackScreenProps<RootStackParamList, 'Rewards'>;

interface UserPoints {
  points: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  pointsToNextTier: number;
  badges: string[];
  achievements: string[];
}

interface AvailableReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  available: boolean;
}

const RewardsScreen = ({ navigation }: RewardsScreenProps) => {
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [availableRewards, setAvailableRewards] = useState<AvailableReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<AvailableReward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    fetchRewardsData();
  }, []);

  const fetchRewardsData = async () => {
    try {
      setIsLoading(true);

      // Fetch user points
      const pointsResponse = await getUserPoints();
      if (pointsResponse.success) {
        setUserPoints(pointsResponse.data);
      }

      // Fetch available rewards
      const rewardsResponse = await getAvailableRewards();
      if (rewardsResponse.success) {
        setAvailableRewards(rewardsResponse.data.rewards);
      }
    } catch (error) {
      console.error('❌ Fetch rewards error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load rewards data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchRewardsData();
    setIsRefreshing(false);
  };

  const handleRedeemPress = (reward: AvailableReward) => {
    if (!reward.available) {
      Toast.show({
        type: 'error',
        text1: 'Insufficient Points',
        text2: `You need ${reward.pointsCost} points to redeem this reward`,
      });
      return;
    }

    setSelectedReward(reward);
    setShowRedeemModal(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;

    try {
      setIsRedeeming(true);

      const response = await redeemPoints(selectedReward.pointsCost);

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Success!',
          text2: response.message,
        });

        // Refresh data
        await fetchRewardsData();
        setShowRedeemModal(false);
        setSelectedReward(null);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to redeem points',
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Bronze':
        return '#CD7F32';
      case 'Silver':
        return '#C0C0C0';
      case 'Gold':
        return '#FFD700';
      case 'Platinum':
        return '#E5E4E2';
      case 'Diamond':
        return '#B9F2FF';
      default:
        return '#CD7F32';
    }
  };

  const getTierIcon = (tier: string) => {
    return 'trophy';
  };

  const getTierPoints = (tier: string) => {
    switch (tier) {
      case 'Bronze':
        return '0 - 499 Pts';
      case 'Silver':
        return '500 - 1,999 Pts';
      case 'Gold':
        return '2,000 - 4,999 Pts';
      case 'Platinum':
        return '5,000 - 9,999 Pts';
      case 'Diamond':
        return '10,000+ Pts';
      default:
        return '0 - 499 Pts';
    }
  };

  const bonusItems = [
    {
      id: 'daily-login',
      icon: 'calendar-outline',
      title: 'Daily login bonus',
      points: '+120',
      description:
        'Log in every day for 7-days and get +20 points, 14-day streak and get +50 points, on 30-day streak and +120 points',
      color: '#10B981',
    },
    {
      id: 'buying-products',
      icon: 'cart-outline',
      title: 'Buying Products',
      points: '+1,000',
      description:
        '20 points up to ₦5,000 product and get 50 points, ₦20,000 purchase and get 200 points',
      color: '#F59E0B',
    },
    {
      id: 'reviewing-products',
      icon: 'star-outline',
      title: 'Reviewing Products',
      points: '+20',
      description:
        '20 points per approved review. Only for verified purchases. One review per product and must meet quality guidelines.',
      color: '#EC4899',
    },
    {
      id: 'sharing-products',
      icon: 'share-social-outline',
      title: 'Sharing Products',
      points: '+20',
      description:
        '5 points per product shared. 20 bonus points if share leads to a purchase',
      color: '#8B5CF6',
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Loading rewards...</Text>
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
          <Text className="text-xl font-bold ml-2">Rewards</Text>
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
        {/* User Status Card */}
        <View className="px-4 py-4">
          <View
            className="rounded-2xl p-4 shadow-sm"
            style={{ backgroundColor: getTierColor(userPoints?.tier || 'Bronze') }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-sm font-medium mb-1">
                  You are Vendorspot
                </Text>
                <Text className="text-white text-xl font-bold mb-2">
                  {userPoints?.tier.toUpperCase()} USER
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('PointsHistory' as any)}
                  className="flex-row items-center"
                >
                  <Text className="text-white text-sm font-semibold">Points history</Text>
                  <Icon name="chevron-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View className="w-16 h-16 bg-white/20 rounded-2xl items-center justify-center">
                <Icon name="trophy" size={32} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </View>

        {/* Tier Badges */}
        <View className="px-4 pb-4">
          <View className="flex-row justify-between">
            {['Bronze', 'Silver', 'Gold', 'Platinum'].map((tier) => {
              const isActive = userPoints?.tier === tier;
              const tierColor = getTierColor(tier);

              return (
                <View key={tier} className="items-center" style={{ width: '22%' }}>
                  <View
                    className={`w-16 h-16 rounded-full items-center justify-center mb-2 ${
                      isActive ? '' : 'opacity-40'
                    }`}
                    style={{
                      backgroundColor: isActive ? tierColor : '#E5E7EB',
                    }}
                  >
                    <Icon
                      name={getTierIcon(tier)}
                      size={28}
                      color={isActive ? '#FFFFFF' : '#9CA3AF'}
                    />
                  </View>
                  <Text
                    className={`text-xs font-semibold mb-1 ${
                      isActive ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {tier}
                  </Text>
                  <Text className="text-xs text-gray-500 text-center">
                    {getTierPoints(tier)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Bonus Section */}
        <View className="px-4 pb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Bonus</Text>

          {bonusItems.map((item) => (
            <View key={item.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <View className="flex-row items-start">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Icon name={item.icon as any} size={20} color={item.color} />
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-bold text-gray-900">
                      {item.title}{' '}
                      <Text className="text-green-600 font-bold">{item.points}</Text>
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-600 leading-5">
                    {item.description}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* How it works */}
        <View className="px-4 pb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">How it works</Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-start mb-4">
              <View className="w-8 h-8 bg-pink-100 rounded-full items-center justify-center mr-3">
                <Text className="text-pink-600 font-bold text-sm">1</Text>
              </View>
              <Text className="flex-1 text-sm text-gray-700 leading-5">
                You earn 1 point for every time you log in, 5 points when you buy, 2 points
                when you share product with other buyers.
              </Text>
            </View>

            <View className="flex-row items-start">
              <View className="w-8 h-8 bg-pink-100 rounded-full items-center justify-center mr-3">
                <Text className="text-pink-600 font-bold text-sm">2</Text>
              </View>
              <Text className="flex-1 text-sm text-gray-700 leading-5">
                Use your points to buy amazing and beautiful products on Vendorspot.
              </Text>
            </View>
          </View>
        </View>

        {/* Redeem Points Section */}
        <View className="px-4 pb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Redeem Points</Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm mb-3">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm text-gray-600">Your Points Balance</Text>
              <Text className="text-2xl font-bold text-pink-600">
                {userPoints?.points || 0}
              </Text>
            </View>

            {userPoints && userPoints.pointsToNextTier > 0 && (
              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-xs text-gray-600 text-center">
                  Earn {userPoints.pointsToNextTier} more points to reach{' '}
                  {userPoints.tier === 'Bronze'
                    ? 'Silver'
                    : userPoints.tier === 'Silver'
                    ? 'Gold'
                    : userPoints.tier === 'Gold'
                    ? 'Platinum'
                    : 'Diamond'}{' '}
                  tier! 🎯
                </Text>
              </View>
            )}
          </View>

          {/* Reward Options */}
          {availableRewards.map((reward) => (
            <TouchableOpacity
              key={reward.id}
              onPress={() => handleRedeemPress(reward)}
              className={`bg-white rounded-2xl p-4 mb-3 shadow-sm ${
                !reward.available ? 'opacity-50' : ''
              }`}
              disabled={!reward.available}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900 mb-1">
                    {reward.name}
                  </Text>
                  <Text className="text-xs text-gray-600">{reward.description}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-lg font-bold text-pink-600">
                    {reward.pointsCost}
                  </Text>
                  <Text className="text-xs text-gray-500">points</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Redeem Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showRedeemModal}
        onRequestClose={() => setShowRedeemModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="w-16 h-16 bg-pink-100 rounded-full items-center justify-center self-center mb-4">
              <MaterialCommunityIcons name="gift" size={32} color="#EC4899" />
            </View>

            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              Redeem Points
            </Text>
            <Text className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to redeem {selectedReward?.pointsCost} points for{' '}
              {selectedReward?.name}?
            </Text>

            <View className="bg-pink-50 rounded-xl p-4 mb-6">
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Points to redeem:</Text>
                <Text className="text-sm font-bold text-gray-900">
                  {selectedReward?.pointsCost}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Cash value:</Text>
                <Text className="text-sm font-bold text-pink-600">
                  {selectedReward?.name}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-600">Remaining points:</Text>
                <Text className="text-sm font-bold text-gray-900">
                  {(userPoints?.points || 0) - (selectedReward?.pointsCost || 0)}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg border border-gray-300"
                onPress={() => setShowRedeemModal(false)}
              >
                <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg bg-pink-500"
                onPress={handleConfirmRedeem}
                disabled={isRedeeming}
              >
                {isRedeeming ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-center">Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default RewardsScreen;