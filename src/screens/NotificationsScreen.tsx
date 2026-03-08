import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useNotifications } from '@/context/NotificationContext';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  Notification,
} from '@/services/notification.service';

type NotificationsScreenProps = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'order':
    case 'order_update':
    case 'order_status':
      return { name: 'receipt', color: '#CC3366', bg: '#FED7E2' };
    case 'delivery':
    case 'shipping':
      return { name: 'bicycle', color: '#3B82F6', bg: '#DBEAFE' };
    case 'promotion':
    case 'deal':
      return { name: 'pricetag', color: '#F59E0B', bg: '#FEF3C7' };
    case 'review':
      return { name: 'star', color: '#F59E0B', bg: '#FEF3C7' };
    case 'reward':
    case 'points':
      return { name: 'trophy', color: '#8B5CF6', bg: '#EDE9FE' };
    case 'payment':
      return { name: 'card', color: '#10B981', bg: '#D1FAE5' };
    case 'system':
      return { name: 'information-circle', color: '#6B7280', bg: '#F3F4F6' };
    default:
      return { name: 'notifications', color: '#CC3366', bg: '#FED7E2' };
  }
};

const formatTime = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const NotificationsScreen = ({ navigation }: NotificationsScreenProps) => {
  const { refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchNotifications = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      if (pageNum === 1) {
        refresh ? setIsRefreshing(true) : setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await getNotifications(pageNum);
      if (response.success) {
        const newNotifications = response.data.notifications;
        if (pageNum === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }
        setHasMore(
          response.data.pages ? pageNum < response.data.pages : newNotifications.length === 20
        );
        setPage(pageNum);
      }
    } catch (error) {
      if (pageNum === 1) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load notifications',
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    fetchNotifications(1, true);
    refreshUnreadCount();
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchNotifications(page + 1);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await markAsRead(notification._id);
        setNotifications(prev =>
          prev.map(n => (n._id === notification._id ? { ...n, read: true } : n))
        );
        refreshUnreadCount();
      } catch (error) {
        // Continue even if mark-as-read fails
      }
    }

    // Navigate based on notification data
    if (notification.data) {
      const { orderId, productId, vendorId } = notification.data;
      if (orderId) {
        navigation.navigate('OrderDetails', { orderId });
      } else if (productId) {
        navigation.navigate('ProductDetails', { productId });
      } else if (vendorId) {
        navigation.navigate('VendorProfile', { vendorId });
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      refreshUnreadCount();
      Toast.show({
        type: 'success',
        text1: 'All notifications marked as read',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to mark all as read',
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      refreshUnreadCount();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to delete notification',
      });
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
      refreshUnreadCount();
      Toast.show({
        type: 'success',
        text1: 'All notifications cleared',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to clear notifications',
      });
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);
    return (
      <TouchableOpacity
        className={`px-4 py-3 flex-row items-start border-b border-gray-100 ${
          !item.read ? 'bg-pink-50' : 'bg-white'
        }`}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3 mt-0.5"
          style={{ backgroundColor: icon.bg }}
        >
          <Icon name={icon.name as any} size={18} color={icon.color} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className={`text-sm flex-1 mr-2 ${!item.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
              {item.title}
            </Text>
            <Text className="text-xs text-gray-400">{formatTime(item.createdAt)}</Text>
          </View>
          <Text className="text-xs text-gray-500 leading-4">{item.message}</Text>
        </View>

        {!item.read && (
          <View className="w-2 h-2 bg-pink-500 rounded-full ml-2 mt-2" />
        )}

        <TouchableOpacity
          className="ml-2 mt-1 p-1"
          onPress={() => handleDelete(item._id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="close" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center mr-2"
          >
            <Icon name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Notifications</Text>
          {unreadNotifications.length > 0 && (
            <View className="bg-pink-500 px-2 py-0.5 rounded-full ml-2">
              <Text className="text-xs text-white font-bold">{unreadNotifications.length}</Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-3">
          {unreadNotifications.length > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Icon name="checkmark-done" size={22} color="#CC3366" />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll}>
              <Icon name="trash-outline" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.navigate('NotificationSettings')}>
            <Icon name="settings-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#CC3366" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
            <Icon name="notifications-off-outline" size={36} color="#9CA3AF" />
          </View>
          <Text className="text-lg font-bold text-gray-900 mb-2">No notifications yet</Text>
          <Text className="text-sm text-gray-500 text-center">
            When you receive notifications about orders, promotions, and updates, they'll appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item._id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#CC3366']}
              tintColor="#CC3366"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#CC3366" />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;
