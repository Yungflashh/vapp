// screens/PointsHistoryScreen.tsx
import React, { useState, useEffect } from 'react';
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
import { getPointsHistory } from '@/services/reward.service';

type PointsHistoryScreenProps = NativeStackScreenProps<RootStackParamList, 'PointsHistory'>;

interface PointsHistoryItem {
  date: string;
  type: string;
  description: string;
  points: number;
}

const PointsHistoryScreen = ({ navigation }: PointsHistoryScreenProps) => {
  const [history, setHistory] = useState<PointsHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const response = await getPointsHistory();
      
      if (response.data.success) {
        setHistory(response.data.data.history);
      }
    } catch (error) {
      console.error('❌ Fetch history error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load points history',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchHistory();
    setIsRefreshing(false);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'cart';
      case 'review':
        return 'star';
      case 'share':
        return 'share-social';
      case 'login':
        return 'log-in';
      case 'redeem':
        return 'gift';
      default:
        return 'trophy';
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'purchase':
        return '#10B981';
      case 'review':
        return '#F59E0B';
      case 'share':
        return '#8B5CF6';
      case 'login':
        return '#3B82F6';
      case 'redeem':
        return '#EC4899';
      default:
        return '#6B7280';
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Loading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-2">Points History</Text>
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
        {history.length > 0 ? (
          <View className="px-4 py-4">
            {history.map((item, index) => {
              const icon = getIconForType(item.type);
              const color = getColorForType(item.type);
              const isPositive = item.points > 0;

              return (
                <View
                  key={index}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex-row items-center"
                >
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <Icon name={icon as any} size={20} color={color} />
                  </View>

                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-900 mb-1">
                      {item.description}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatDate(item.date)}
                    </Text>
                  </View>

                  <Text
                    className={`text-lg font-bold ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {item.points}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Icon name="trophy-outline" size={40} color="#9CA3AF" />
            </View>
            <Text className="text-gray-900 font-bold text-lg mb-2">No Points History</Text>
            <Text className="text-gray-500 text-center px-8">
              Start earning points by shopping, reviewing products, and sharing with friends!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PointsHistoryScreen;