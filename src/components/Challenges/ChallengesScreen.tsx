// screens/ChallengesScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import {
  getActiveChallenges,
  getUserChallenges,
  joinChallenge,
  claimChallengeReward,
  getChallengeLeaderboard,
  type ChallengeData,
  type UserChallenge,
  type LeaderboardEntry,
} from '@/services/challenge.service';

type ChallengesScreenProps = NativeStackScreenProps<RootStackParamList, 'Challenges'>;

type TabType = 'active' | 'my_challenges' | 'completed';

const ChallengesScreen = ({ navigation }: ChallengesScreenProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [activeChallenges, setActiveChallenges] = useState<ChallengeData[]>([]);
  const [myChallenges, setMyChallenges] = useState<UserChallenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<UserChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Leaderboard modal
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [leaderboardChallenge, setLeaderboardChallenge] = useState<{
    title: string;
    targetValue: number;
    targetType: string;
  } | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const [activeRes, userRes] = await Promise.all([
        getActiveChallenges(),
        getUserChallenges(),
      ]);

      if (activeRes.success) {
        setActiveChallenges(activeRes.data.challenges);
      }

      if (userRes.success) {
        setMyChallenges(userRes.data.active);
        setCompletedChallenges(userRes.data.completed);
      }
    } catch (error) {
      console.error('❌ Fetch challenges error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load challenges',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      setJoiningId(challengeId);
      const result = await joinChallenge(challengeId);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Joined!',
          text2: result.message,
        });
        await fetchData();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to join challenge',
      });
    } finally {
      setJoiningId(null);
    }
  };

  const handleClaimReward = async (challengeId: string) => {
    try {
      setClaimingId(challengeId);
      const result = await claimChallengeReward(challengeId);

      if (result.success) {
        const reward = result.data;
        Toast.show({
          type: 'success',
          text1: 'Reward Claimed!',
          text2: `You earned ${reward.rewardType === 'cash' ? '₦' : ''}${reward.rewardValue}${reward.rewardType === 'points' ? ' points' : ''}`,
        });
        await fetchData();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to claim reward',
      });
    } finally {
      setClaimingId(null);
    }
  };

  const handleViewLeaderboard = async (challengeId: string) => {
    try {
      setLoadingLeaderboard(true);
      setShowLeaderboard(true);

      const result = await getChallengeLeaderboard(challengeId);

      if (result.success) {
        setLeaderboardChallenge(result.data.challenge);
        setLeaderboardData(result.data.leaderboard);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load leaderboard',
      });
      setShowLeaderboard(false);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 0);
  };

  const getProgressPercentage = (progress: number, target: number) => {
    return Math.min((progress / target) * 100, 100);
  };

  const getChallengeTypeColor = (type: string) => {
    switch (type) {
      case 'buyer':
        return { bg: 'bg-blue-100', text: 'text-blue-600', color: '#3B82F6' };
      case 'seller':
        return { bg: 'bg-green-100', text: 'text-green-600', color: '#22C55E' };
      case 'affiliate':
        return { bg: 'bg-purple-100', text: 'text-purple-600', color: '#8B5CF6' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', color: '#6B7280' };
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'buyer':
        return 'cart-outline';
      case 'seller':
        return 'storefront-outline';
      case 'affiliate':
        return 'link-outline';
      default:
        return 'flag-outline';
    }
  };

  const getRewardIcon = (rewardType: string) => {
    return rewardType === 'cash' ? 'cash-outline' : 'star-outline';
  };

  const formatReward = (type: string, value: number) => {
    return type === 'cash' ? `₦${value.toLocaleString()}` : `${value} points`;
  };

  // Check if user already joined a challenge
  const isJoined = (challengeId: string) => {
    return (
      myChallenges.some((c) => c.challenge.id === challengeId) ||
      completedChallenges.some((c) => c.challenge.id === challengeId)
    );
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'active', label: 'Active', count: activeChallenges.length },
    { key: 'my_challenges', label: 'My Challenges', count: myChallenges.length },
    { key: 'completed', label: 'Completed', count: completedChallenges.length },
  ];

  // ==================== LOADING ====================
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#CC3366" />
          <Text className="text-gray-500 mt-4">Loading challenges...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text className="text-xl font-bold ml-2">Challenges</Text>
        </View>

        <View className="flex-row items-center" style={{ gap: 8 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Leaderboard' as any)}
            className="bg-pink-100 px-3 py-1.5 rounded-full flex-row items-center"
          >
            <Icon name="podium-outline" size={14} color="#CC3366" />
            <Text className="text-pink-600 text-xs font-bold ml-1">Leaderboard</Text>
          </TouchableOpacity>
          <View className="bg-yellow-100 px-3 py-1.5 rounded-full flex-row items-center">
            <Icon name="trophy" size={14} color="#F59E0B" />
            <Text className="text-yellow-700 text-xs font-bold ml-1">
              {completedChallenges.length} completed
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="bg-white px-4 pt-3 pb-0 border-b border-gray-100">
        <View className="flex-row">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 pb-3 items-center border-b-2 ${
                activeTab === tab.key ? 'border-pink-500' : 'border-transparent'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeTab === tab.key ? 'text-pink-500' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View
                  className={`mt-1 px-2 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-pink-100' : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      activeTab === tab.key ? 'text-pink-600' : 'text-gray-500'
                    }`}
                  >
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#CC3366']}
            tintColor="#CC3366"
          />
        }
        className="flex-1"
      >
        {/* ==================== ACTIVE CHALLENGES TAB ==================== */}
        {activeTab === 'active' && (
          <View className="px-4">
            {activeChallenges.length === 0 ? (
              <View className="items-center py-12">
                <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Icon name="flag-outline" size={36} color="#9CA3AF" />
                </View>
                <Text className="text-base font-semibold text-gray-700 mb-1">
                  No Active Challenges
                </Text>
                <Text className="text-sm text-gray-500 text-center px-8">
                  Check back soon for new challenges to participate in!
                </Text>
              </View>
            ) : (
              activeChallenges.map((challenge) => {
                const typeStyle = getChallengeTypeColor(challenge.type);
                const daysLeft = getDaysLeft(challenge.endDate);
                const joined = isJoined(challenge._id);
                const progress = challenge.userProgress?.progress || 0;
                const percentage = getProgressPercentage(progress, challenge.targetValue);

                return (
                  <View
                    key={challenge._id}
                    className="bg-white rounded-2xl p-4 shadow-sm mb-4"
                  >
                    {/* Challenge Header */}
                    <View className="flex-row items-start mb-3">
                      <View
                        className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${typeStyle.bg}`}
                      >
                        <Icon
                          name={getChallengeIcon(challenge.type)}
                          size={22}
                          color={typeStyle.color}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold text-gray-900">
                          {challenge.title}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={2}>
                          {challenge.description}
                        </Text>
                      </View>
                    </View>

                    {/* Challenge Info */}
                    <View className="flex-row items-center mb-3">
                      <View className={`px-2.5 py-1 rounded-full mr-2 ${typeStyle.bg}`}>
                        <Text className={`text-xs font-bold capitalize ${typeStyle.text}`}>
                          {challenge.type}
                        </Text>
                      </View>
                      <View className="bg-gray-100 px-2.5 py-1 rounded-full mr-2">
                        <Text className="text-xs text-gray-600 font-medium">
                          Target: {challenge.targetValue} {challenge.targetType}
                        </Text>
                      </View>
                      <View className="bg-orange-100 px-2.5 py-1 rounded-full">
                        <Text className="text-xs text-orange-600 font-bold">
                          {daysLeft}d left
                        </Text>
                      </View>
                    </View>

                    {/* Reward */}
                    <View className="bg-yellow-50 rounded-xl p-3 flex-row items-center mb-3">
                      <Icon name={getRewardIcon(challenge.rewardType)} size={18} color="#F59E0B" />
                      <Text className="text-sm font-semibold text-yellow-700 ml-2">
                        Reward: {formatReward(challenge.rewardType, challenge.rewardValue)}
                      </Text>
                    </View>

                    {/* Progress (if joined) */}
                    {joined && (
                      <View className="mb-3">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-xs text-gray-500">Progress</Text>
                          <Text className="text-xs font-bold text-gray-700">
                            {progress}/{challenge.targetValue}
                          </Text>
                        </View>
                        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <View
                            className="h-full bg-pink-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </View>
                      </View>
                    )}

                    {/* Actions */}
                    <View className="flex-row gap-2">
                      {!joined ? (
                        <TouchableOpacity
                          onPress={() => handleJoinChallenge(challenge._id)}
                          disabled={joiningId === challenge._id}
                          className="flex-1 bg-pink-500 py-3 rounded-xl items-center justify-center"
                        >
                          {joiningId === challenge._id ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text className="text-white font-bold text-sm">Join Challenge</Text>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <View className="flex-1 bg-green-100 py-3 rounded-xl items-center justify-center">
                          <Text className="text-green-600 font-bold text-sm">Joined</Text>
                        </View>
                      )}

                      <TouchableOpacity
                        onPress={() => handleViewLeaderboard(challenge._id)}
                        className="bg-gray-100 py-3 px-4 rounded-xl items-center justify-center"
                      >
                        <Icon name="podium-outline" size={18} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ==================== MY CHALLENGES TAB ==================== */}
        {activeTab === 'my_challenges' && (
          <View className="px-4">
            {myChallenges.length === 0 ? (
              <View className="items-center py-12">
                <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Icon name="rocket-outline" size={36} color="#9CA3AF" />
                </View>
                <Text className="text-base font-semibold text-gray-700 mb-1">
                  No Active Challenges
                </Text>
                <Text className="text-sm text-gray-500 text-center px-8 mb-4">
                  Join challenges from the Active tab to start competing!
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('active')}
                  className="bg-pink-500 px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-bold text-sm">Browse Challenges</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myChallenges.map((item) => {
                const challenge = item.challenge;
                const percentage = getProgressPercentage(item.progress, challenge.targetValue);
                const daysLeft = getDaysLeft(challenge.endDate);
                const typeStyle = getChallengeTypeColor(challenge.type);

                return (
                  <View
                    key={challenge.id}
                    className="bg-white rounded-2xl p-4 shadow-sm mb-4"
                  >
                    <View className="flex-row items-center mb-3">
                      <View
                        className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${typeStyle.bg}`}
                      >
                        <Icon
                          name={getChallengeIcon(challenge.type)}
                          size={18}
                          color={typeStyle.color}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-gray-900">{challenge.title}</Text>
                        <Text className="text-xs text-gray-500">
                          {daysLeft} days left · {formatReward(challenge.rewardType, challenge.rewardValue)}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View className="mb-3">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-xs text-gray-500">
                          {item.progress} / {challenge.targetValue} {challenge.targetType}
                        </Text>
                        <Text className="text-xs font-bold text-pink-500">
                          {percentage.toFixed(0)}%
                        </Text>
                      </View>
                      <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-pink-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleViewLeaderboard(challenge.id)}
                      className="bg-gray-100 py-2.5 rounded-xl items-center"
                    >
                      <Text className="text-gray-700 font-semibold text-xs">View Leaderboard</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ==================== COMPLETED TAB ==================== */}
        {activeTab === 'completed' && (
          <View className="px-4">
            {completedChallenges.length === 0 ? (
              <View className="items-center py-12">
                <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Icon name="medal-outline" size={36} color="#9CA3AF" />
                </View>
                <Text className="text-base font-semibold text-gray-700 mb-1">
                  No Completed Challenges
                </Text>
                <Text className="text-sm text-gray-500 text-center px-8">
                  Complete challenges to earn rewards and see them here!
                </Text>
              </View>
            ) : (
              completedChallenges.map((item) => {
                const challenge = item.challenge;
                const typeStyle = getChallengeTypeColor(challenge.type);

                return (
                  <View
                    key={challenge.id}
                    className="bg-white rounded-2xl p-4 shadow-sm mb-4"
                  >
                    <View className="flex-row items-center mb-3">
                      <View className="w-10 h-10 rounded-xl items-center justify-center mr-3 bg-green-100">
                        <Icon name="checkmark-circle" size={22} color="#22C55E" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-gray-900">{challenge.title}</Text>
                        <Text className="text-xs text-gray-500">
                          Completed{' '}
                          {item.completedAt
                            ? new Date(item.completedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : ''}
                        </Text>
                      </View>
                      <View className={`px-2.5 py-1 rounded-full ${typeStyle.bg}`}>
                        <Text className={`text-xs font-bold capitalize ${typeStyle.text}`}>
                          {challenge.type}
                        </Text>
                      </View>
                    </View>

                    {/* Reward info */}
                    <View className="bg-green-50 rounded-xl p-3 flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        <Icon name={getRewardIcon(challenge.rewardType)} size={16} color="#22C55E" />
                        <Text className="text-sm font-semibold text-green-700 ml-2">
                          {formatReward(challenge.rewardType, challenge.rewardValue)}
                        </Text>
                      </View>
                      {item.rewardClaimed ? (
                        <View className="bg-green-200 px-3 py-1 rounded-full">
                          <Text className="text-xs font-bold text-green-700">Claimed</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleClaimReward(challenge.id)}
                          disabled={claimingId === challenge.id}
                          className="bg-green-500 px-4 py-1.5 rounded-full"
                        >
                          {claimingId === challenge.id ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text className="text-xs font-bold text-white">Claim</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => handleViewLeaderboard(challenge.id)}
                      className="bg-gray-100 py-2.5 rounded-xl items-center"
                    >
                      <Text className="text-gray-700 font-semibold text-xs">View Leaderboard</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* ==================== LEADERBOARD MODAL ==================== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLeaderboard}
        onRequestClose={() => setShowLeaderboard(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[75%]">
            {/* Modal Header */}
            <View className="px-4 pt-4 pb-3 border-b border-gray-100">
              <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-3" />
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Icon name="podium-outline" size={22} color="#F59E0B" />
                  <Text className="text-lg font-bold text-gray-900 ml-2">Leaderboard</Text>
                </View>
                <TouchableOpacity onPress={() => setShowLeaderboard(false)}>
                  <Icon name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              {leaderboardChallenge && (
                <Text className="text-sm text-gray-500 mt-1">
                  {leaderboardChallenge.title} · Target: {leaderboardChallenge.targetValue}{' '}
                  {leaderboardChallenge.targetType}
                </Text>
              )}
            </View>

            {loadingLeaderboard ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#CC3366" />
                <Text className="text-gray-500 mt-3">Loading leaderboard...</Text>
              </View>
            ) : leaderboardData.length === 0 ? (
              <View className="py-12 items-center">
                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                  <Icon name="people-outline" size={28} color="#9CA3AF" />
                </View>
                <Text className="text-sm font-semibold text-gray-700">No participants yet</Text>
                <Text className="text-xs text-gray-500">Be the first to join!</Text>
              </View>
            ) : (
              <ScrollView className="px-4 py-3" showsVerticalScrollIndicator={false}>
                {/* Top 3 Podium */}
                {leaderboardData.length >= 3 && (
                  <View className="flex-row items-end justify-center mb-6 pt-4">
                    {/* 2nd Place */}
                    <View className="items-center mx-2">
                      <View className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center mb-1">
                        <Text className="text-lg font-bold text-gray-600">2</Text>
                      </View>
                      <Text className="text-xs font-semibold text-gray-700" numberOfLines={1}>
                        {leaderboardData[1]?.user.name.split(' ')[0]}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {leaderboardData[1]?.progress}
                      </Text>
                    </View>

                    {/* 1st Place */}
                    <View className="items-center mx-2 -mt-4">
                      <Icon name="trophy" size={20} color="#F59E0B" />
                      <View className="w-14 h-14 bg-yellow-100 rounded-full items-center justify-center mb-1 border-2 border-yellow-400">
                        <Text className="text-xl font-bold text-yellow-600">1</Text>
                      </View>
                      <Text className="text-xs font-bold text-gray-900" numberOfLines={1}>
                        {leaderboardData[0]?.user.name.split(' ')[0]}
                      </Text>
                      <Text className="text-xs font-semibold text-yellow-600">
                        {leaderboardData[0]?.progress}
                      </Text>
                    </View>

                    {/* 3rd Place */}
                    <View className="items-center mx-2">
                      <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mb-1">
                        <Text className="text-lg font-bold text-orange-600">3</Text>
                      </View>
                      <Text className="text-xs font-semibold text-gray-700" numberOfLines={1}>
                        {leaderboardData[2]?.user.name.split(' ')[0]}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {leaderboardData[2]?.progress}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Full List */}
                {leaderboardData.map((entry) => (
                  <View
                    key={entry.rank}
                    className={`flex-row items-center py-3 ${
                      entry.rank <= leaderboardData.length - 1
                        ? 'border-b border-gray-100'
                        : ''
                    }`}
                  >
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                        entry.rank === 1
                          ? 'bg-yellow-100'
                          : entry.rank === 2
                            ? 'bg-gray-200'
                            : entry.rank === 3
                              ? 'bg-orange-100'
                              : 'bg-gray-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          entry.rank === 1
                            ? 'text-yellow-600'
                            : entry.rank === 2
                              ? 'text-gray-600'
                              : entry.rank === 3
                                ? 'text-orange-600'
                                : 'text-gray-500'
                        }`}
                      >
                        {entry.rank}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900">
                        {entry.user.name}
                      </Text>
                      {entry.completed && (
                        <Text className="text-xs text-green-500">Completed</Text>
                      )}
                    </View>

                    <Text className="text-sm font-bold text-gray-700">{entry.progress}</Text>
                  </View>
                ))}

                <View className="h-6" />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ChallengesScreen;