// screens/SettingsScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const SettingsScreen = ({ navigation }: SettingsScreenProps) => {
  const accountSettings = [
    {
      icon: 'person',
      iconBg: '#FED7E2',
      iconColor: '#EC4899',
      title: 'Edit Profile',
      description: 'Update your personal info',
      onPress: () => console.log('Edit Profile'),
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
      badge: 2,
      onPress: () => console.log('Dispute Center'),
    },
    {
      icon: 'notifications',
      iconBg: '#DBEAFE',
      iconColor: '#3B82F6',
      title: 'Notifications',
      description: 'Manage alerts & preferences',
      onPress: () => console.log('Notifications'),
    },
    {
      icon: 'settings',
      iconBg: '#F3F4F6',
      iconColor: '#6B7280',
      title: 'App Settings',
      description: 'Language, privacy & more',
      onPress: () => console.log('App Settings'),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
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

      <ScrollView showsVerticalScrollIndicator={false}>
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;