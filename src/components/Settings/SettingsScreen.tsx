// screens/SettingsScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import { getMyDisputes } from '@/services/dispute.service';
import api from '@/services/api.config';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const SettingsScreen = ({ navigation }: SettingsScreenProps) => {
  const [openDisputeCount, setOpenDisputeCount] = useState(0);
  const [supportUserId, setSupportUserId] = useState<string>('');

  useEffect(() => {
    const fetchSupportUser = async () => {
      try {
        const res = await api.get('/auth/support-user');
        if (res.data.success) {
          setSupportUserId(res.data.data.user.id);
        }
      } catch (err) {
        console.log('Could not fetch support user:', err);
      }
    };
    fetchSupportUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchDisputeCount = async () => {
        try {
          const response = await getMyDisputes({ limit: 50 });
          if (response.success) {
            const disputes = response.data?.disputes || [];
            const openCount = disputes.filter((d: any) =>
              ['open', 'vendor_responded', 'under_review'].includes(d.status)
            ).length;
            setOpenDisputeCount(openCount);
          }
        } catch (err) {
          console.log('⚠️ Dispute count fetch error:', err);
        }
      };
      fetchDisputeCount();
    }, [])
  );

  const accountSettings = [
    {
      icon: 'person',
      iconBg: '#FED7E2',
      iconColor: '#CC3366',
      title: 'Edit Profile',
      description: 'Update your personal info',
      onPress: () => navigation.navigate("EditProfile"),
    },
    {
      icon: 'location',
      iconBg: '#D1FAE5',
      iconColor: '#10B981',
      title: 'Saved Addresses',
      description: 'Manage delivery locations',
      onPress: () => navigation.navigate('SavedAddresses'),
    },
    {
      icon: 'alert-circle',
      iconBg: '#FEE2E2',
      iconColor: '#EF4444',
      title: 'Dispute Center',
      description: 'Resolve order issues',
      badge: openDisputeCount > 0 ? openDisputeCount : undefined,
      onPress: () => navigation.navigate('DisputeCenter'),
    },
    {
      icon: 'notifications',
      iconBg: '#DBEAFE',
      iconColor: '#3B82F6',
      title: 'Notifications',
      description: 'Manage alerts & preferences',
      onPress: () => navigation.navigate("NotificationSettings"),
    },
    {
      icon: 'settings',
      iconBg: '#F3F4F6',
      iconColor: '#6B7280',
      title: 'App Settings',
      description: 'Language, privacy & more',
      onPress: () => Alert.alert('Coming Soon', 'Language, privacy and other app settings will be available in the next update.'),
    },
  ];

  const helpOptions = [
    {
      icon: 'chatbubble-ellipses',
      iconBg: '#FCE7F3',
      iconColor: '#CC3366',
      title: 'Chat with Support',
      description: 'Get instant help from our team',
      onPress: () => {
        if (!supportUserId) {
          Toast.show({ type: 'error', text1: 'Support Unavailable', text2: 'Please try again later' });
          return;
        }
        navigation.navigate('Chat', {
          receiverId: supportUserId,
          receiverName: 'VendorSpot Support',
        });
      },
    },
    {
      icon: 'mail',
      iconBg: '#DBEAFE',
      iconColor: '#3B82F6',
      title: 'Email Us',
      description: 'support@vendorspot.com',
      onPress: () => Linking.openURL('mailto:support@vendorspot.com?subject=Help Request'),
    },
    {
      icon: 'call',
      iconBg: '#D1FAE5',
      iconColor: '#10B981',
      title: 'Call Us',
      description: '+234 900 000 0000',
      onPress: () => Linking.openURL('tel:+2349000000000'),
    },
  ];

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
        <Text className="text-lg font-bold text-gray-900">Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Account Settings Section */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-sm font-bold text-gray-900 mb-3">Account Settings</Text>
        </View>

        <View className="px-4">
          {accountSettings.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="bg-white rounded-2xl p-4 mb-3 flex-row items-center shadow-sm"
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: item.iconBg }}
              >
                <Icon name={item.icon as any} size={22} color={item.iconColor} />
              </View>

              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900 mb-0.5">
                  {item.title}
                </Text>
                <Text className="text-xs text-gray-500">
                  {item.description}
                </Text>
              </View>

              {item.badge && (
                <View className="w-6 h-6 bg-red-500 rounded-full items-center justify-center mr-2">
                  <Text className="text-white text-xs font-bold">{item.badge}</Text>
                </View>
              )}

              <Icon name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Help & Support Section */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-sm font-bold text-gray-900 mb-3">Help & Support</Text>
        </View>

        <View className="px-4">
          {helpOptions.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="bg-white rounded-2xl p-4 mb-3 flex-row items-center shadow-sm"
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: item.iconBg }}
              >
                <Icon name={item.icon as any} size={22} color={item.iconColor} />
              </View>

              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900 mb-0.5">
                  {item.title}
                </Text>
                <Text className="text-xs text-gray-500">
                  {item.description}
                </Text>
              </View>

              <Icon name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;