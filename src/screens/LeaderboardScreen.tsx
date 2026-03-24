import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import {
  getActiveChallenges,
  getChallengeLeaderboard,
  type ChallengeData,
  type LeaderboardEntry,
} from '@/services/challenge.service';

type LeaderboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Leaderboard'>;

const LeaderboardScreen = ({ navigation, route }: LeaderboardScreenProps) => {
  const [challenges, setChallenges] = useState<ChallengeData[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(
    route.params?.challengeId || null
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [challengeInfo, setChallengeInfo] = useState<{
    title: string;
    targetValue: number;
    targetType: string;
  } | null>(null);
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(true);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, []);

  useEffect(() => {
    if (selectedChallengeId) {
      fetchLeaderboard(selectedChallengeId);
    }
  }, [selectedChallengeId]);

  const fetchChallenges = async () => {
    try {
      setIsLoadingChallenges(true);
      const result = await getActiveChallenges();
      if (result.success && result.data.challenges.length > 0) {
        setChallenges(result.data.challenges);
        if (!selectedChallengeId) {
          setSelectedChallengeId(result.data.challenges[0]._id);
        }
      }
    } catch (error) {
      console.error('Failed to load challenges:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load challenges',
      });
    } finally {
      setIsLoadingChallenges(false);
    }
  };

  const fetchLeaderboard = async (challengeId: string) => {
    try {
      setIsLoadingLeaderboard(true);
      const result = await getChallengeLeaderboard(challengeId);
      if (result.success) {
        setChallengeInfo(result.data.challenge);
        setLeaderboard(result.data.leaderboard);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load leaderboard',
      });
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchChallenges();
    if (selectedChallengeId) {
      await fetchLeaderboard(selectedChallengeId);
    }
    setIsRefreshing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return { bg: '#FEF3C7', border: '#F59E0B', text: '#D97706' }; // gold
      case 2:
        return { bg: '#E5E7EB', border: '#9CA3AF', text: '#6B7280' }; // silver
      case 3:
        return { bg: '#FED7AA', border: '#F97316', text: '#EA580C' }; // bronze
      default:
        return { bg: '#F3F4F6', border: '#D1D5DB', text: '#6B7280' };
    }
  };

  // ==================== LOADING ====================
  if (isLoadingChallenges) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#CC3366" />
          <Text className="text-gray-500 mt-4">Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View className="flex-1 flex-row items-center ml-2">
          <Icon name="podium-outline" size={22} color="#CC3366" />
          <Text className="text-xl font-bold ml-2">Leaderboard</Text>
        </View>
      </View>

      {/* Challenge Tabs */}
      {challenges.length > 0 && (
        <View className="bg-white border-b border-gray-100">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
          >
            {challenges.map((challenge) => (
              <TouchableOpacity
                key={challenge._id}
                onPress={() => setSelectedChallengeId(challenge._id)}
                className={`px-4 py-2 rounded-full ${
                  selectedChallengeId === challenge._id
                    ? 'bg-pink-500'
                    : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selectedChallengeId === challenge._id
                      ? 'text-white'
                      : 'text-gray-600'
                  }`}
                  numberOfLines={1}
                >
                  {challenge.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Challenge Info */}
      {challengeInfo && (
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
          <Text className="text-base font-bold text-gray-900">{challengeInfo.title}</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Target: {challengeInfo.targetValue} {challengeInfo.targetType}
          </Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
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
        {isLoadingLeaderboard ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#CC3366" />
            <Text className="text-gray-500 mt-3">Loading leaderboard...</Text>
          </View>
        ) : challenges.length === 0 ? (
          <View className="items-center justify-center py-20 px-4">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Icon name="flag-outline" size={36} color="#9CA3AF" />
            </View>
            <Text className="text-base font-semibold text-gray-700 mb-1">
              No Active Challenges
            </Text>
            <Text className="text-sm text-gray-500 text-center px-8">
              Check back soon for challenges and leaderboards!
            </Text>
          </View>
        ) : leaderboard.length === 0 ? (
          <View className="items-center justify-center py-20 px-4">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Icon name="people-outline" size={36} color="#9CA3AF" />
            </View>
            <Text className="text-base font-semibold text-gray-700 mb-1">
              No Participants Yet
            </Text>
            <Text className="text-sm text-gray-500 text-center px-8">
              Be the first to join this challenge!
            </Text>
          </View>
        ) : (
          <View className="px-4 mt-4">
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <View className="flex-row items-end justify-center pt-6 pb-4">
                  {/* 2nd Place */}
                  <View className="items-center mx-3 flex-1">
                    <View
                      className="w-16 h-16 rounded-full items-center justify-center mb-2"
                      style={{
                        backgroundColor: getRankColor(2).bg,
                        borderWidth: 3,
                        borderColor: getRankColor(2).border,
                      }}
                    >
                      <Text
                        className="text-lg font-bold"
                        style={{ color: getRankColor(2).text }}
                      >
                        {getInitials(leaderboard[1].user.name)}
                      </Text>
                    </View>
                    <View className="bg-gray-200 w-8 h-8 rounded-full items-center justify-center mb-1">
                      <Text className="text-sm font-bold text-gray-600">2</Text>
                    </View>
                    <Text
                      className="text-xs font-semibold text-gray-700 text-center"
                      numberOfLines={1}
                    >
                      {leaderboard[1].user.name.split(' ')[0]}
                    </Text>
                    <Text className="text-xs text-gray-500">{leaderboard[1].progress}</Text>
                  </View>

                  {/* 1st Place */}
                  <View className="items-center mx-3 flex-1 -mt-6">
                    <Icon name="trophy" size={28} color="#F59E0B" />
                    <View
                      className="w-20 h-20 rounded-full items-center justify-center mb-2"
                      style={{
                        backgroundColor: getRankColor(1).bg,
                        borderWidth: 3,
                        borderColor: getRankColor(1).border,
                      }}
                    >
                      <Text
                        className="text-xl font-bold"
                        style={{ color: getRankColor(1).text }}
                      >
                        {getInitials(leaderboard[0].user.name)}
                      </Text>
                    </View>
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center mb-1"
                      style={{ backgroundColor: '#FEF3C7' }}
                    >
                      <Text className="text-sm font-bold" style={{ color: '#D97706' }}>
                        1
                      </Text>
                    </View>
                    <Text
                      className="text-xs font-bold text-gray-900 text-center"
                      numberOfLines={1}
                    >
                      {leaderboard[0].user.name.split(' ')[0]}
                    </Text>
                    <Text className="text-xs font-semibold" style={{ color: '#D97706' }}>
                      {leaderboard[0].progress}
                    </Text>
                  </View>

                  {/* 3rd Place */}
                  <View className="items-center mx-3 flex-1">
                    <View
                      className="w-16 h-16 rounded-full items-center justify-center mb-2"
                      style={{
                        backgroundColor: getRankColor(3).bg,
                        borderWidth: 3,
                        borderColor: getRankColor(3).border,
                      }}
                    >
                      <Text
                        className="text-lg font-bold"
                        style={{ color: getRankColor(3).text }}
                      >
                        {getInitials(leaderboard[2].user.name)}
                      </Text>
                    </View>
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center mb-1"
                      style={{ backgroundColor: '#FED7AA' }}
                    >
                      <Text className="text-sm font-bold" style={{ color: '#EA580C' }}>
                        3
                      </Text>
                    </View>
                    <Text
                      className="text-xs font-semibold text-gray-700 text-center"
                      numberOfLines={1}
                    >
                      {leaderboard[2].user.name.split(' ')[0]}
                    </Text>
                    <Text className="text-xs text-gray-500">{leaderboard[2].progress}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Full Ranked List */}
            <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <View className="px-4 py-3 border-b border-gray-100">
                <Text className="text-base font-bold text-gray-900">All Participants</Text>
              </View>
              {leaderboard.map((entry, index) => {
                const rankColor = getRankColor(entry.rank);
                return (
                  <View
                    key={entry.rank}
                    className={`flex-row items-center px-4 py-3.5 ${
                      index < leaderboard.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    {/* Rank */}
                    <View
                      className="w-9 h-9 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: rankColor.bg }}
                    >
                      <Text
                        className="text-sm font-bold"
                        style={{ color: rankColor.text }}
                      >
                        {entry.rank}
                      </Text>
                    </View>

                    {/* Avatar / Initials */}
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' }}
                    >
                      <Text className="text-sm font-bold text-gray-500">
                        {getInitials(entry.user.name)}
                      </Text>
                    </View>

                    {/* Name + Status */}
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900">
                        {entry.user.name}
                      </Text>
                      {entry.completed && (
                        <View className="flex-row items-center mt-0.5">
                          <Icon name="checkmark-circle" size={12} color="#22C55E" />
                          <Text className="text-xs text-green-500 ml-1">Completed</Text>
                        </View>
                      )}
                    </View>

                    {/* Progress */}
                    <View className="items-end">
                      <Text className="text-sm font-bold text-gray-700">
                        {entry.progress}
                      </Text>
                      {challengeInfo && (
                        <Text className="text-xs text-gray-400">
                          / {challengeInfo.targetValue}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default LeaderboardScreen;
