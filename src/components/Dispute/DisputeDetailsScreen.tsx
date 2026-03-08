// screens/DisputeDetailsScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import {
  getDisputeById,
  addDisputeMessage,
  Dispute,
  DisputeMessage,
} from '@/services/dispute.service';

type DisputeDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'DisputeDetails'>;

const DisputeDetailsScreen = ({ route, navigation }: DisputeDetailsScreenProps) => {
  const { disputeId, openMessageInput } = route.params as any;
  const scrollViewRef = useRef<ScrollView>(null);

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchDispute();
  }, [disputeId]);

  useEffect(() => {
    // Auto-focus message input if navigated with openMessageInput flag
    if (openMessageInput && !isLoading) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);
    }
  }, [openMessageInput, isLoading]);

  const fetchDispute = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      const response = await getDisputeById(disputeId);

      if (response.success && response.data?.dispute) {
        setDispute(response.data.dispute);
      }
    } catch (error: any) {
      console.error('Fetch dispute error:', error.response?.data || error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load dispute details',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchDispute();
  };

  const pickImage = async () => {
    if (attachments.length >= 3) {
      Toast.show({
        type: 'error',
        text1: 'Limit Reached',
        text2: 'Maximum 3 images per message',
      });
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Toast.show({
          type: 'error',
          text1: 'Permission Required',
          text2: 'Please allow access to your photo library',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAttachments((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Image pick error:', error);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!message.trim() && attachments.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Required',
        text2: 'Please enter a message or add an image',
      });
      return;
    }

    try {
      setIsSending(true);

      const response = await addDisputeMessage(disputeId, {
        message: message.trim() || 'Added evidence',
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (response.success) {
        setMessage('');
        setAttachments([]);
        // Refresh to get updated thread
        await fetchDispute();
        Toast.show({
          type: 'success',
          text1: 'Sent',
          text2: 'Your message has been added',
        });
        // Scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 300);
      }
    } catch (error: any) {
      console.error('Send message error:', error.response?.data || error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to send message',
      });
    } finally {
      setIsSending(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'open':
        return { bg: '#FEF3C7', text: '#F59E0B', icon: 'time', label: 'Open' };
      case 'vendor_responded':
        return { bg: '#E0E7FF', text: '#6366F1', icon: 'chatbubbles', label: 'Vendor Responded' };
      case 'under_review':
        return { bg: '#DBEAFE', text: '#3B82F6', icon: 'search', label: 'Under Review' };
      case 'resolved_full_refund':
        return { bg: '#D1FAE5', text: '#10B981', icon: 'checkmark-circle', label: 'Resolved — Full Refund' };
      case 'resolved_partial_refund':
        return { bg: '#D1FAE5', text: '#10B981', icon: 'checkmark-circle', label: 'Resolved — Partial Refund' };
      case 'rejected':
        return { bg: '#FEE2E2', text: '#EF4444', icon: 'close-circle', label: 'Rejected' };
      case 'closed':
        return { bg: '#F3F4F6', text: '#6B7280', icon: 'lock-closed', label: 'Closed' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', icon: 'help-circle', label: status };
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      item_not_received: 'Item not received',
      item_damaged: 'Item arrived damaged',
      item_not_as_described: 'Product not as described',
      wrong_item: 'Wrong item delivered',
      missing_items: 'Missing items from order',
      quality_issue: 'Quality issue',
      other: 'Other',
    };
    return labels[reason] || reason;
  };

  const getSenderName = (msg: DisputeMessage) => {
    if (msg.senderRole === 'admin') return 'Admin';
    if (msg.senderRole === 'vendor') return 'Vendor';
    const sender = msg.sender;
    if (typeof sender === 'object' && sender?.firstName) {
      return `${sender.firstName} ${sender.lastName || ''}`.trim();
    }
    return 'You';
  };

  const getSenderColor = (role: string) => {
    switch (role) {
      case 'customer':
        return '#CC3366';
      case 'vendor':
        return '#6366F1';
      case 'admin':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  };

  const isResolved = dispute?.status
    ? ['resolved_full_refund', 'resolved_partial_refund', 'rejected', 'closed'].includes(dispute.status)
    : false;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#CC3366" />
          <Text className="text-gray-500 mt-4">Loading dispute...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dispute) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <Icon name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-gray-900 font-bold text-lg mt-4">Dispute Not Found</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-pink-500 px-6 py-3 rounded-xl mt-6"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(dispute.status);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 items-center justify-center -ml-2"
            >
              <Icon name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <View className="ml-2 flex-1">
              <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
                Dispute #{dispute.disputeNumber}
              </Text>
              <Text className="text-xs text-gray-500">Order #{dispute.orderNumber}</Text>
            </View>
          </View>

          {/* Status Badge */}
          <View
            className="px-3 py-1.5 rounded-full flex-row items-center"
            style={{ backgroundColor: statusInfo.bg }}
          >
            <Icon name={statusInfo.icon as any} size={14} color={statusInfo.text} />
            <Text className="text-xs font-bold ml-1" style={{ color: statusInfo.text }}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={['#CC3366']}
              tintColor="#CC3366"
            />
          }
          contentContainerStyle={{ paddingBottom: isResolved ? 20 : 0 }}
        >
          {/* Dispute Info Card */}
          <View className="bg-white px-4 py-4 mt-2">
            {/* Reason */}
            <View className="mb-4">
              <Text className="text-xs text-gray-400 mb-1">Issue Type</Text>
              <View className="flex-row items-center">
                <Icon name="warning" size={16} color="#EF4444" />
                <Text className="text-sm font-bold text-gray-900 ml-2">
                  {getReasonLabel(dispute.reason)}
                </Text>
              </View>
            </View>

            {/* Disputed Items */}
            {dispute.disputedItems && dispute.disputedItems.length > 0 && (
              <View className="mb-4">
                <Text className="text-xs text-gray-400 mb-2">Disputed Items</Text>
                {dispute.disputedItems.map((item, index) => (
                  <View
                    key={index}
                    className="flex-row items-center justify-between bg-gray-50 rounded-lg p-3 mb-1.5"
                  >
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                        {item.productName}
                      </Text>
                      <Text className="text-xs text-gray-500">Qty: {item.quantity}</Text>
                    </View>
                    <Text className="text-sm font-bold text-gray-900">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Vendor */}
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-xs text-gray-400 mb-1">Vendor</Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {typeof dispute.vendor === 'object'
                    ? `${(dispute.vendor as any).firstName || ''} ${(dispute.vendor as any).lastName || ''}`.trim()
                    : 'Vendor'}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-gray-400 mb-1">Filed</Text>
                <Text className="text-sm text-gray-700">{formatDate(dispute.createdAt)}</Text>
              </View>
            </View>

            {/* Evidence Images */}
            {dispute.evidence && dispute.evidence.length > 0 && (
              <View>
                <Text className="text-xs text-gray-400 mb-2">Evidence Submitted</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row">
                    {dispute.evidence.map((uri, index) => (
                      <View key={index} className="w-20 h-20 rounded-xl overflow-hidden mr-2">
                        <Image
                          source={{ uri }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>

          {/* Resolution Card (if resolved) */}
          {isResolved && (
            <View className="mx-4 mt-3">
              <View
                className="rounded-2xl p-4 border"
                style={{
                  backgroundColor:
                    dispute.status === 'rejected' ? '#FEF2F2' : '#F0FDF4',
                  borderColor:
                    dispute.status === 'rejected' ? '#FECACA' : '#BBF7D0',
                }}
              >
                <View className="flex-row items-center mb-3">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{
                      backgroundColor:
                        dispute.status === 'rejected' ? '#FEE2E2' : '#DCFCE7',
                    }}
                  >
                    <Icon
                      name={dispute.status === 'rejected' ? 'close-circle' : 'checkmark-circle'}
                      size={24}
                      color={dispute.status === 'rejected' ? '#EF4444' : '#10B981'}
                    />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text
                      className="text-base font-bold"
                      style={{
                        color: dispute.status === 'rejected' ? '#991B1B' : '#166534',
                      }}
                    >
                      {dispute.status === 'rejected'
                        ? 'Dispute Rejected'
                        : 'Dispute Resolved'}
                    </Text>
                    <Text
                      className="text-xs mt-0.5"
                      style={{
                        color: dispute.status === 'rejected' ? '#B91C1C' : '#15803D',
                      }}
                    >
                      {dispute.refundType === 'full'
                        ? 'Full refund issued'
                        : dispute.refundType === 'partial'
                        ? 'Partial refund issued'
                        : 'No refund'}
                    </Text>
                  </View>
                </View>

                {dispute.refundAmount !== undefined && dispute.refundAmount > 0 && (
                  <View className="bg-white/60 rounded-xl p-3 mb-3">
                    <Text className="text-xs text-gray-500">Refund Amount</Text>
                    <Text className="text-2xl font-bold text-green-700">
                      ₦{dispute.refundAmount.toLocaleString()}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">Credited to your wallet</Text>
                  </View>
                )}

                {dispute.resolution && (
                  <View>
                    <Text className="text-xs text-gray-500 mb-1">Admin's Note</Text>
                    <Text className="text-sm text-gray-800">{dispute.resolution}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Conversation Thread */}
          <View className="px-4 mt-5 mb-4">
            <Text className="text-base font-bold text-gray-900 mb-3">
              Conversation ({dispute.messages?.length || 0})
            </Text>

            {dispute.messages && dispute.messages.length > 0 ? (
              dispute.messages.map((msg, index) => {
                const isCustomer = msg.senderRole === 'customer';
                const senderColor = getSenderColor(msg.senderRole);
                const senderName = getSenderName(msg);

                const bubbleBg = isCustomer
                  ? '#FDF2F8'
                  : msg.senderRole === 'admin'
                  ? '#FFFBEB'
                  : '#EEF2FF';
                const bubbleBorder = isCustomer
                  ? '#FBCFE8'
                  : msg.senderRole === 'admin'
                  ? '#FDE68A'
                  : '#C7D2FE';

                return (
                  <View key={msg._id || index} className="mb-4">
                    {/* Sender Label */}
                    <View
                      className="flex-row items-center mb-1"
                      style={{
                        justifyContent: isCustomer ? 'flex-end' : 'flex-start',
                        paddingHorizontal: 4,
                      }}
                    >
                      <View
                        className="w-2 h-2 rounded-full mr-1.5"
                        style={{ backgroundColor: senderColor }}
                      />
                      <Text className="text-xs font-bold" style={{ color: senderColor }}>
                        {senderName}
                      </Text>
                      <Text className="text-xs text-gray-400 ml-2">
                        {formatRelativeDate(msg.createdAt)}
                      </Text>
                    </View>

                    {/* Message Row — uses flexDirection to align left or right */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: isCustomer ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {/* Spacer for customer messages (pushes bubble right) */}
                      {isCustomer && <View style={{ flex: 0.15 }} />}

                      {/* Message Bubble */}
                      <View
                        style={{
                          flex: 0.85,
                          backgroundColor: bubbleBg,
                          borderWidth: 1,
                          borderColor: bubbleBorder,
                          borderRadius: 16,
                          borderTopRightRadius: isCustomer ? 4 : 16,
                          borderTopLeftRadius: isCustomer ? 16 : 4,
                          padding: 14,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: '#1F2937',
                            lineHeight: 20,
                          }}
                        >
                          {msg.message}
                        </Text>

                        {/* Message Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                            {msg.attachments.map((uri, imgIndex) => (
                              <View
                                key={imgIndex}
                                style={{
                                  width: 64,
                                  height: 64,
                                  borderRadius: 8,
                                  overflow: 'hidden',
                                  marginRight: 6,
                                  marginBottom: 6,
                                }}
                              >
                                <Image
                                  source={{ uri }}
                                  style={{ width: '100%', height: '100%' }}
                                  resizeMode="cover"
                                />
                              </View>
                            ))}
                          </View>
                        )}
                      </View>

                      {/* Spacer for vendor/admin messages (pushes bubble left) */}
                      {!isCustomer && <View style={{ flex: 0.15 }} />}
                    </View>
                  </View>
                );
              })
            ) : (
              <View className="bg-gray-50 rounded-xl p-6 items-center">
                <Icon name="chatbubbles-outline" size={32} color="#D1D5DB" />
                <Text className="text-sm text-gray-400 mt-2">No messages yet</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Message Input Bar (only if dispute is still active) */}
        {!isResolved && (
          <View className="bg-white border-t border-gray-100 px-4 py-3">
            {/* Attachment Preview */}
            {attachments.length > 0 && (
              <View className="flex-row mb-2">
                {attachments.map((uri, index) => (
                  <View key={index} className="w-14 h-14 rounded-lg overflow-hidden mr-2">
                    <Image
                      source={{ uri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => removeAttachment(index)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full items-center justify-center"
                    >
                      <Icon name="close" size={10} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View className="flex-row items-end">
              {/* Attach Button */}
              <TouchableOpacity
                onPress={pickImage}
                className="w-10 h-10 items-center justify-center mr-2"
              >
                <Icon name="camera-outline" size={22} color="#6B7280" />
              </TouchableOpacity>

              {/* Text Input */}
              <View className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-2.5 mr-2 max-h-24">
                <TextInput
                  className="text-sm text-gray-900"
                  placeholder="Type a message..."
                  placeholderTextColor="#9CA3AF"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  textAlignVertical="top"
                  style={{ maxHeight: 80 }}
                />
              </View>

              {/* Send Button */}
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={isSending || (!message.trim() && attachments.length === 0)}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{
                  backgroundColor:
                    isSending || (!message.trim() && attachments.length === 0)
                      ? '#E5E7EB'
                      : '#EF4444',
                }}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Icon name="send" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Resolved Footer */}
        {isResolved && (
          <View className="bg-gray-100 px-4 py-4 items-center border-t border-gray-200">
            <Icon name="lock-closed" size={16} color="#9CA3AF" />
            <Text className="text-xs text-gray-500 mt-1">
              This dispute has been {dispute.status === 'rejected' ? 'rejected' : 'resolved'} and is
              closed for new messages.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default DisputeDetailsScreen;