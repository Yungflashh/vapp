import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { getConversations } from '@/services/message.service';
import { getVendorProfile } from '@/services/vendor.service';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// Cache vendor profiles so we don't refetch every time
const vendorProfileCache: Record<string, { name: string; avatar?: string }> = {};

// Match the actual API response shape
interface ConversationItem {
  _id: string;
  conversationId: string;
  otherParticipant: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
  };
  lastMessage?: {
    text: string;
    sender: string;
    timestamp: string;
    messageType: string;
  };
  unreadCount: number;
  updatedAt: string;
}

const formatTime = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const ConversationsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const { socket, isUserOnline, refreshUnreadMessageCount } = useSocket();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [vendorProfiles, setVendorProfiles] = useState<Record<string, { name: string; avatar?: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isCustomer = user?.role === 'customer';

  // Fetch vendor profile details for vendor participants
  const fetchVendorProfiles = useCallback(async (convos: ConversationItem[]) => {
    if (!isCustomer) return;

    const vendorParticipants = convos.filter(
      (c) => c.otherParticipant?.role === 'vendor' && !vendorProfileCache[c.otherParticipant._id]
    );

    if (vendorParticipants.length === 0) {
      // Use cached data
      const cached: Record<string, { name: string; avatar?: string }> = {};
      convos.forEach((c) => {
        if (c.otherParticipant?.role === 'vendor' && vendorProfileCache[c.otherParticipant._id]) {
          cached[c.otherParticipant._id] = vendorProfileCache[c.otherParticipant._id];
        }
      });
      if (Object.keys(cached).length > 0) setVendorProfiles((prev) => ({ ...prev, ...cached }));
      return;
    }

    // Fetch vendor profiles in parallel
    const results = await Promise.allSettled(
      vendorParticipants.map(async (c) => {
        try {
          const res = await getVendorProfile(c.otherParticipant._id);
          if (res.success && res.data?.vendor) {
            const v = res.data.vendor;
            const profile = {
              name: v.businessName || `${c.otherParticipant.firstName} ${c.otherParticipant.lastName}`,
              avatar: v.businessLogo || c.otherParticipant.avatar,
            };
            vendorProfileCache[c.otherParticipant._id] = profile;
            return { userId: c.otherParticipant._id, profile };
          }
        } catch {
          // Fall back to user details silently
        }
        return null;
      })
    );

    const profiles: Record<string, { name: string; avatar?: string }> = {};
    convos.forEach((c) => {
      if (c.otherParticipant?.role === 'vendor' && vendorProfileCache[c.otherParticipant._id]) {
        profiles[c.otherParticipant._id] = vendorProfileCache[c.otherParticipant._id];
      }
    });
    results.forEach((r) => {
      if (r.status === 'fulfilled' && r.value) {
        profiles[r.value.userId] = r.value.profile;
      }
    });

    if (Object.keys(profiles).length > 0) {
      setVendorProfiles((prev) => ({ ...prev, ...profiles }));
    }
  }, [isCustomer]);

  const fetchConversations = useCallback(async (refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);
      const response = await getConversations();

      if (response.success) {
        // API returns { success, data: [...] }
        const convos = response.data?.conversations || response.data || [];
        const list = Array.isArray(convos) ? convos : [];
        setConversations(list);
        // Fetch vendor profiles in background (no loading state)
        fetchVendorProfiles(list);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Fetch conversations error:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchVendorProfiles]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
      refreshUnreadMessageCount();
    }, [fetchConversations, refreshUnreadMessageCount])
  );

  // Listen for real-time socket events to update conversation list in-place
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      const msg = data?.message || data;
      const convoId = data?.conversationId || msg?.conversationId || msg?.conversation;
      if (!convoId) return;

      setConversations((prev) => {
        const idx = prev.findIndex(
          (c) => c.conversationId === convoId || c._id === convoId
        );

        if (idx === -1) return prev;

        const updated = [...prev];
        const convo = { ...updated[idx] };

        // Update last message preview
        convo.lastMessage = {
          text: msg?.message || msg?.text || '',
          sender: typeof msg?.sender === 'object' ? msg.sender._id : (msg?.sender || ''),
          timestamp: msg?.createdAt || msg?.timestamp || new Date().toISOString(),
          messageType: msg?.messageType || 'text',
        };
        convo.updatedAt = new Date().toISOString();

        // Bump unread if message is from the other person
        const senderId = typeof msg?.sender === 'object' ? msg.sender._id : msg?.sender;
        if (senderId !== user?.id) {
          convo.unreadCount = (convo.unreadCount || 0) + 1;
        }

        updated[idx] = convo;

        // Move this conversation to top
        if (idx > 0) {
          updated.splice(idx, 1);
          updated.unshift(convo);
        }

        return updated;
      });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('receive_message', handleNewMessage);
    socket.on('new_message_notification', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('receive_message', handleNewMessage);
      socket.off('new_message_notification', handleNewMessage);
    };
  }, [socket, user?.id]);

  const renderConversation = ({ item }: { item: ConversationItem }) => {
    const otherUser = item.otherParticipant;
    if (!otherUser) return null;

    // Use vendor profile data if available (for customer view)
    const vProfile = isCustomer && otherUser.role === 'vendor' ? vendorProfiles[otherUser._id] : null;
    const displayName = vProfile?.name || `${otherUser.firstName} ${otherUser.lastName}`;
    const displayAvatar = vProfile?.avatar || otherUser.avatar;

    const isOnline = isUserOnline(otherUser._id);
    const lastMsg = item.lastMessage;
    const unread = item.unreadCount || 0;

    // Determine if last message was sent by current user
    const isMine = lastMsg?.sender === user?.id;

    let messagePreview = 'No messages yet';
    if (lastMsg) {
      if (lastMsg.messageType === 'image') {
        messagePreview = isMine ? 'You sent a photo' : 'Sent a photo';
      } else if (lastMsg.messageType === 'file') {
        messagePreview = isMine ? 'You sent a file' : 'Sent a file';
      } else {
        const text = lastMsg.text || '';
        messagePreview = isMine ? `You: ${text}` : text;
      }
    }

    return (
      <TouchableOpacity
        className={`px-4 py-3 flex-row items-center border-b border-gray-50 ${
          unread > 0 ? 'bg-pink-50' : 'bg-white'
        }`}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: item.conversationId || item._id,
            receiverId: otherUser._id,
            receiverName: displayName,
            receiverAvatar: displayAvatar,
          })
        }
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View className="relative mr-3">
          {displayAvatar ? (
            <Image
              source={{ uri: displayAvatar }}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <View className="w-12 h-12 rounded-full bg-pink-100 items-center justify-center">
              <Text className="text-lg font-bold text-pink-500">
                {displayName?.charAt(0) || '?'}
              </Text>
            </View>
          )}
          {isOnline && (
            <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </View>

        {/* Content */}
        <View className="flex-1 mr-2">
          <View className="flex-row items-center justify-between mb-1">
            <Text className={`text-sm flex-1 mr-2 ${unread > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`} numberOfLines={1}>
              {displayName}
            </Text>
            <Text className={`text-xs ${unread > 0 ? 'text-pink-500 font-semibold' : 'text-gray-400'}`}>
              {lastMsg?.timestamp ? formatTime(lastMsg.timestamp) : ''}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Text
              className={`text-xs flex-1 ${unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}
              numberOfLines={1}
            >
              {messagePreview}
            </Text>
            {unread > 0 && (
              <View className="bg-pink-500 w-5 h-5 rounded-full items-center justify-center ml-2">
                <Text className="text-[10px] text-white font-bold">
                  {unread > 9 ? '9+' : unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Messages</Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#CC3366" />
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 bg-pink-50 rounded-full items-center justify-center mb-4">
            <Icon name="chatbubbles-outline" size={36} color="#CC3366" />
          </View>
          <Text className="text-lg font-bold text-gray-900 mb-2">No messages yet</Text>
          <Text className="text-sm text-gray-500 text-center">
            Start a conversation by messaging a vendor from their profile or a product page.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item._id}
          extraData={[conversations, vendorProfiles]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchConversations(true)}
              colors={['#CC3366']}
              tintColor="#CC3366"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ConversationsScreen;
