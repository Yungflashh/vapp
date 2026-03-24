// screens/NotificationSettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNotificationPreferences, updateNotificationPreferences } from '@/services/notification.service';

type NotificationSettingsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'NotificationSettings'
>;

interface NotificationPreference {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  enabled: boolean;
}

const NotificationSettingsScreen = ({ navigation }: NotificationSettingsScreenProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  const [orderNotifications, setOrderNotifications] = useState<NotificationPreference[]>([
    {
      id: 'order_updates',
      title: 'Order Updates',
      description: 'Status changes, shipping & delivery',
      icon: 'receipt',
      iconColor: '#CC3366',
      iconBg: '#FED7E2',
      enabled: true,
    },
    {
      id: 'order_confirmation',
      title: 'Order Confirmation',
      description: 'Receive confirmation for new orders',
      icon: 'checkmark-circle',
      iconColor: '#10B981',
      iconBg: '#D1FAE5',
      enabled: true,
    },
    {
      id: 'delivery_alerts',
      title: 'Delivery Alerts',
      description: 'Real-time delivery tracking updates',
      icon: 'bicycle',
      iconColor: '#3B82F6',
      iconBg: '#DBEAFE',
      enabled: true,
    },
  ]);

  const [promoNotifications, setPromoNotifications] = useState<NotificationPreference[]>([
    {
      id: 'deals',
      title: 'Deals & Offers',
      description: 'Flash sales, discounts & special offers',
      icon: 'pricetag',
      iconColor: '#F59E0B',
      iconBg: '#FEF3C7',
      enabled: true,
    },
    {
      id: 'new_arrivals',
      title: 'New Arrivals',
      description: 'Get notified about new products',
      icon: 'sparkles',
      iconColor: '#8B5CF6',
      iconBg: '#EDE9FE',
      enabled: false,
    },
    {
      id: 'price_drops',
      title: 'Price Drops',
      description: 'Alerts for wishlist price changes',
      icon: 'trending-down',
      iconColor: '#EF4444',
      iconBg: '#FEE2E2',
      enabled: true,
    },
  ]);

  const [socialNotifications, setSocialNotifications] = useState<NotificationPreference[]>([
    {
      id: 'reviews',
      title: 'Review Reminders',
      description: 'Reminders to review purchased items',
      icon: 'star',
      iconColor: '#F59E0B',
      iconBg: '#FEF3C7',
      enabled: false,
    },
    {
      id: 'rewards',
      title: 'Rewards & Points',
      description: 'Points earned, tier updates & rewards',
      icon: 'trophy',
      iconColor: '#CC3366',
      iconBg: '#FED7E2',
      enabled: true,
    },
    {
      id: 'referral',
      title: 'Referral Updates',
      description: 'When friends sign up with your link',
      icon: 'people',
      iconColor: '#06B6D4',
      iconBg: '#CFFAFE',
      enabled: true,
    },
  ]);

  // Load saved preferences on mount (backend first, fallback to AsyncStorage)
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        let prefs: any = null;

        // Try backend first
        try {
          const response = await getNotificationPreferences();
          if (response?.data && (response.data.order?.length > 0 || response.data.promo?.length > 0)) {
            prefs = response.data;
          }
        } catch (err) {
          console.log('Backend preferences not available, using local');
        }

        // Fallback to AsyncStorage
        if (!prefs) {
          const saved = await AsyncStorage.getItem('notificationPreferences');
          if (saved) {
            prefs = JSON.parse(saved);
          }
        }

        if (prefs) {
          setPushEnabled(prefs.pushEnabled ?? true);
          if (prefs.order) {
            setOrderNotifications(prev =>
              prev.map(n => {
                const savedPref = prefs.order.find((p: any) => p.id === n.id);
                return savedPref ? { ...n, enabled: savedPref.enabled } : n;
              })
            );
          }
          if (prefs.promo) {
            setPromoNotifications(prev =>
              prev.map(n => {
                const savedPref = prefs.promo.find((p: any) => p.id === n.id);
                return savedPref ? { ...n, enabled: savedPref.enabled } : n;
              })
            );
          }
          if (prefs.social) {
            setSocialNotifications(prev =>
              prev.map(n => {
                const savedPref = prefs.social.find((p: any) => p.id === n.id);
                return savedPref ? { ...n, enabled: savedPref.enabled } : n;
              })
            );
          }
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPreferences();
  }, []);

  // Auto-save whenever any preference changes (local + backend)
  const savePreferences = async (
    push: boolean,
    order: NotificationPreference[],
    promo: NotificationPreference[],
    social: NotificationPreference[],
  ) => {
    try {
      const preferences = {
        pushEnabled: push,
        order: order.map(n => ({ id: n.id, enabled: n.enabled })),
        promo: promo.map(n => ({ id: n.id, enabled: n.enabled })),
        social: social.map(n => ({ id: n.id, enabled: n.enabled })),
      };
      // Save locally
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(preferences));
      // Sync to backend (fire-and-forget)
      updateNotificationPreferences(preferences).catch(err =>
        console.log('Backend sync failed, saved locally:', err.message)
      );
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  };

  const togglePush = (value: boolean) => {
    setPushEnabled(value);
    savePreferences(value, orderNotifications, promoNotifications, socialNotifications);
  };

  const togglePreference = (
    section: 'order' | 'promo' | 'social',
    id: string,
  ) => {
    const updateFn = (prefs: NotificationPreference[]) =>
      prefs.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p));

    switch (section) {
      case 'order': {
        const updated = updateFn(orderNotifications);
        setOrderNotifications(updated);
        savePreferences(pushEnabled, updated, promoNotifications, socialNotifications);
        break;
      }
      case 'promo': {
        const updated = updateFn(promoNotifications);
        setPromoNotifications(updated);
        savePreferences(pushEnabled, orderNotifications, updated, socialNotifications);
        break;
      }
      case 'social': {
        const updated = updateFn(socialNotifications);
        setSocialNotifications(updated);
        savePreferences(pushEnabled, orderNotifications, promoNotifications, updated);
        break;
      }
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await savePreferences(pushEnabled, orderNotifications, promoNotifications, socialNotifications);
      Toast.show({
        type: 'success',
        text1: 'Settings Saved',
        text2: 'Notification preferences updated',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save preferences',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderSection = (
    title: string,
    items: NotificationPreference[],
    section: 'order' | 'promo' | 'social',
  ) => (
    <View className="mb-5">
      <Text className="text-sm font-bold text-gray-900 mb-3 px-4">{title}</Text>
      <View className="px-4">
        {items.map((item, index) => (
          <View
            key={item.id}
            className={`bg-white rounded-2xl p-4 flex-row items-center shadow-sm ${
              index < items.length - 1 ? 'mb-3' : ''
            }`}
          >
            <View
              className="w-11 h-11 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: item.iconBg }}
            >
              <Icon name={item.icon as any} size={20} color={item.iconColor} />
            </View>

            <View className="flex-1 mr-3">
              <Text className="text-sm font-bold text-gray-900 mb-0.5">{item.title}</Text>
              <Text className="text-xs text-gray-500">{item.description}</Text>
            </View>

            <Switch
              value={pushEnabled && item.enabled}
              onValueChange={() => togglePreference(section, item.id)}
              disabled={!pushEnabled}
              trackColor={{ false: '#E5E7EB', true: '#F9A8D4' }}
              thumbColor={pushEnabled && item.enabled ? '#CC3366' : '#D1D5DB'}
            />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center mr-2"
        >
          <Icon name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Notifications</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Master Toggle */}
        <View className="px-4 pt-4 mb-4">
          <View className="bg-white rounded-2xl p-4 flex-row items-center shadow-sm">
            <View className="w-11 h-11 rounded-xl items-center justify-center mr-3 bg-gray-100">
              <Icon name="notifications" size={20} color="#111827" />
            </View>
            <View className="flex-1 mr-3">
              <Text className="text-sm font-bold text-gray-900 mb-0.5">Push Notifications</Text>
              <Text className="text-xs text-gray-500">
                {pushEnabled ? 'Receiving notifications' : 'All notifications paused'}
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={togglePush}
              trackColor={{ false: '#E5E7EB', true: '#F9A8D4' }}
              thumbColor={pushEnabled ? '#CC3366' : '#D1D5DB'}
            />
          </View>
        </View>

        {/* Sections */}
        {renderSection('Order Notifications', orderNotifications, 'order')}
        {renderSection('Promotions & Deals', promoNotifications, 'promo')}
        {renderSection('Social & Rewards', socialNotifications, 'social')}
      </ScrollView>

      {/* Save Button */}
      <View className="px-5 pb-6 pt-3 bg-gray-50">
        <TouchableOpacity
          className="bg-pink-500 py-4 rounded-xl items-center justify-center shadow-sm"
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-base font-bold">Save Preferences</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default NotificationSettingsScreen;