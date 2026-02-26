// screens/DisputeCenterScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getMyDisputes, Dispute } from '@/services/dispute.service';

type DisputeCenterScreenProps = NativeStackScreenProps<RootStackParamList, 'DisputeCenter'>;

const STATUS_FILTERS = ['All', 'Open', 'Vendor Responded', 'Under Review', 'Resolved', 'Rejected'] as const;

const STATUS_MAP: Record<string, string> = {
  'Open': 'open',
  'Vendor Responded': 'vendor_responded',
  'Under Review': 'under_review',
  'Resolved': 'resolved_full_refund',    // will also match partial below
  'Rejected': 'rejected',
};

interface DisputeStats {
  total: number;
  open: number;
  resolved: number;
  winRate: number;
}

const DisputeCenterScreen = ({ navigation: screenNavigation }: DisputeCenterScreenProps) => {
  // Get the root stack navigation so DisputeDetails opens as a full screen,
  // not rendered inside a tab navigator
  const rootNavigation = useNavigation<any>();
  const navigation = rootNavigation.getParent() || rootNavigation;
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<DisputeStats>({
    total: 0,
    open: 0,
    resolved: 0,
    winRate: 0,
  });
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDisputes();
    }, [])
  );

  const fetchDisputes = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);

      const response = await getMyDisputes({ limit: 50 });

      if (response.success) {
        const allDisputes: Dispute[] = response.data?.disputes || [];
        setDisputes(allDisputes);

        // Calculate stats
        const open = allDisputes.filter((d) =>
          ['open', 'vendor_responded', 'under_review'].includes(d.status)
        ).length;
        const resolved = allDisputes.filter((d) =>
          ['resolved_full_refund', 'resolved_partial_refund'].includes(d.status)
        ).length;
        const rejected = allDisputes.filter((d) => d.status === 'rejected').length;
        const closed = resolved + rejected;
        const winRate = closed > 0 ? Math.round((resolved / closed) * 100) : 0;

        setStats({
          total: allDisputes.length,
          open,
          resolved,
          winRate,
        });
      }
    } catch (error: any) {
      console.error('Error fetching disputes:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load disputes',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchDisputes();
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'open':
        return { bg: '#FEF3C7', text: '#F59E0B', label: 'Open' };
      case 'vendor_responded':
        return { bg: '#E0E7FF', text: '#6366F1', label: 'Vendor Responded' };
      case 'under_review':
        return { bg: '#DBEAFE', text: '#3B82F6', label: 'Under Review' };
      case 'resolved_full_refund':
        return { bg: '#D1FAE5', text: '#10B981', label: 'Full Refund' };
      case 'resolved_partial_refund':
        return { bg: '#D1FAE5', text: '#10B981', label: 'Partial Refund' };
      case 'rejected':
        return { bg: '#FEE2E2', text: '#EF4444', label: 'Rejected' };
      case 'closed':
        return { bg: '#F3F4F6', text: '#6B7280', label: 'Closed' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', label: status };
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      item_not_received: 'Item not received',
      item_damaged: 'Item arrived damaged',
      item_not_as_described: 'Product not as described',
      wrong_item: 'Wrong item delivered',
      missing_items: 'Missing items',
      quality_issue: 'Quality issue',
      other: 'Other',
    };
    return labels[reason] || reason;
  };

  const filteredDisputes = disputes.filter((dispute) => {
    if (activeFilter === 'All') return true;
    const filterStatus = STATUS_MAP[activeFilter];
    if (activeFilter === 'Resolved') {
      return ['resolved_full_refund', 'resolved_partial_refund'].includes(dispute.status);
    }
    return dispute.status === filterStatus;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Loading disputes...</Text>
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
            onPress={() => screenNavigation.goBack()}
            className="w-10 h-10 items-center justify-center mr-2"
          >
            <Icon name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Dispute Center</Text>
        </View>
        <TouchableOpacity className="w-10 h-10 items-center justify-center">
          <Icon name="help-circle-outline" size={24} color="#6B7280" />
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
        {/* Stats Card */}
        <View className="px-4 pt-4">
          <View className="rounded-2xl p-4 overflow-hidden" style={{ backgroundColor: '#7C3AED' }}>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-white/20 rounded-full items-center justify-center mr-2">
                  <Icon name="alert-circle" size={18} color="#FFFFFF" />
                </View>
                <Text className="text-white text-sm font-semibold">Active Disputes</Text>
              </View>
              <View className="bg-white/20 w-7 h-7 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">{stats.open}</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white/70 text-xs mb-0.5">Open</Text>
                <Text className="text-white text-2xl font-bold">{stats.open}</Text>
              </View>
              <View>
                <Text className="text-white/70 text-xs mb-0.5">Resolved</Text>
                <Text className="text-white text-2xl font-bold">{stats.resolved}</Text>
              </View>
              <View>
                <Text className="text-white/70 text-xs mb-0.5">Win Rate</Text>
                <Text className="text-white text-2xl font-bold">{stats.winRate}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Filter By Status */}
        <View className="px-4 mt-5">
          <Text className="text-base font-bold text-gray-900 mb-3">Filter By Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              {STATUS_FILTERS.map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    className={`mr-2 px-4 py-2 rounded-full ${
                      isActive ? 'bg-gray-900' : 'bg-white border border-gray-200'
                    }`}
                    onPress={() => setActiveFilter(filter)}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isActive ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* My Disputes */}
        <View className="px-4 mt-5 pb-6">
          <Text className="text-base font-bold text-gray-900 mb-3">My Disputes</Text>

          {filteredDisputes.length > 0 ? (
            filteredDisputes.map((dispute) => {
              const statusInfo = getStatusInfo(dispute.status);
              const firstItem = dispute.disputedItems?.[0];

              return (
                <View key={dispute._id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                  {/* Header Row */}
                  <View className="flex-row items-center mb-3">
                    <View className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden mr-3 items-center justify-center">
                      <Icon name="shield-outline" size={24} color="#EF4444" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                          {firstItem?.productName || `Order #${dispute.orderNumber}`}
                        </Text>
                      </View>
                      <Text className="text-xs text-gray-500 mt-0.5">
                        Dispute #{dispute.disputeNumber}
                      </Text>
                      <View className="flex-row items-center mt-1.5">
                        <View
                          className="flex-row items-center px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: statusInfo.bg }}
                        >
                          <View
                            className="w-1.5 h-1.5 rounded-full mr-1"
                            style={{ backgroundColor: statusInfo.text }}
                          />
                          <Text className="text-xs font-medium" style={{ color: statusInfo.text }}>
                            {statusInfo.label}
                          </Text>
                        </View>

                        {dispute.refundAmount && dispute.refundAmount > 0 && (
                          <View className="flex-row items-center ml-2 px-2 py-0.5 rounded-full bg-green-50">
                            <Text className="text-xs font-medium text-green-600">
                              ₦{dispute.refundAmount.toLocaleString()} refunded
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Issue Type */}
                  <View className="mb-3">
                    <Text className="text-xs text-gray-400 mb-0.5">Issue Type</Text>
                    <Text className="text-sm text-gray-900">{getReasonLabel(dispute.reason)}</Text>
                  </View>

                  {/* Date & Messages */}
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-xs text-gray-400">
                      Filed: {formatDate(dispute.createdAt)}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {dispute.messages?.length || 0} message(s)
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      className="flex-1 py-2.5 rounded-lg border border-gray-200 items-center"
                      onPress={() => {
                        (navigation as any).push('DisputeDetails', {
                          disputeId: dispute._id,
                        });
                      }}
                    >
                      <Text className="text-sm font-semibold text-gray-700">View Details</Text>
                    </TouchableOpacity>

                    {['open', 'vendor_responded', 'under_review'].includes(dispute.status) && (
                      <TouchableOpacity
                        className="flex-1 py-2.5 rounded-lg items-center"
                        style={{ backgroundColor: '#EF4444' }}
                        onPress={() => {
                          (navigation as any).push('DisputeDetails', {
                            disputeId: dispute._id,
                            openMessageInput: true,
                          });
                        }}
                      >
                        <Text className="text-sm font-semibold text-white">Add Evidence</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View className="bg-white rounded-2xl p-8 items-center">
              <Icon name="checkmark-circle-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2 text-sm">
                {activeFilter === 'All' ? 'No disputes yet' : `No ${activeFilter.toLowerCase()} disputes`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DisputeCenterScreen;