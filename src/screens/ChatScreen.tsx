import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import {
  getMessages,
  sendMessage as sendMessageApi,
  markConversationAsRead,
  Message,
} from '@/services/message.service';

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const formatMessageTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const formatDateSeparator = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

// Mask phone numbers in messages
const maskPhoneNumbers = (text: string): string => {
  // Match various phone formats: +234xxx, 0xxx, 080xx, etc.
  return text.replace(/(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g, (match) => {
    // Only mask if it looks like a phone number (7+ digits)
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 7) {
      return match.slice(0, 4) + '****' + match.slice(-2);
    }
    return match;
  });
};

const ChatScreen = ({ navigation, route }: ChatScreenProps) => {
  const { conversationId, receiverId, receiverName, receiverAvatar, initialMessage } = route.params;
  const { user } = useAuth();
  const { socket, isConnected, isUserOnline, refreshUnreadMessageCount } = useSocket();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(conversationId);
  const [initialMessageSent, setInitialMessageSent] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Support chat always shows as online
  const isOnline = receiverName === 'VendorSpot Support' ? true : isUserOnline(receiverId);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!activeConversationId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await getMessages(activeConversationId);
      if (response.success) {
        const msgs = response.data?.messages || response.data || [];
        const list = Array.isArray(msgs) ? msgs : [];
        setMessages(list);
        // Mark as read
        await markConversationAsRead(activeConversationId).catch(() => {});
        refreshUnreadMessageCount();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId, refreshUnreadMessageCount]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Send initial message (from order chat)
  useEffect(() => {
    if (initialMessage && !initialMessageSent && !isLoading) {
      setInitialMessageSent(true);
      (async () => {
        try {
          const response = await sendMessageApi(receiverId, initialMessage, 'text');
          if (response.success && response.data) {
            const newMsg = response.data.message;
            setMessages((prev) => {
              if (prev.some((m) => m._id === newMsg._id)) return prev;
              return [...prev, newMsg];
            });
            if (!activeConversationId && response.data.conversationId) {
              setActiveConversationId(response.data.conversationId);
              if (socket) {
                socket.emit('join_conversation', { conversationId: response.data.conversationId });
              }
            }
          }
        } catch (error) {
          console.error('Failed to send initial message:', error);
        }
      })();
    }
  }, [initialMessage, initialMessageSent, isLoading]);

  // Join conversation room via socket
  useEffect(() => {
    if (!socket || !activeConversationId) return;

    console.log('[Chat] Joining conversation:', activeConversationId);
    socket.emit('join_conversation', { conversationId: activeConversationId });

    return () => {
      console.log('[Chat] Leaving conversation:', activeConversationId);
      socket.emit('leave_conversation', { conversationId: activeConversationId });
    };
  }, [socket, activeConversationId]);

  // Listen for new messages and other events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      console.log('[Chat] new_message received:', JSON.stringify(data).substring(0, 300));

      // Extract message and conversationId from various possible shapes
      const msg = data?.message || data;
      const convoId = data?.conversationId || msg?.conversationId || msg?.conversation;

      // Only add if it's for this conversation
      if (convoId === activeConversationId) {
        if (msg?._id) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
        }

        // Mark as read since we're in the conversation
        if (activeConversationId) markConversationAsRead(activeConversationId).catch(() => {});
        refreshUnreadMessageCount();
      }
    };

    const handleTyping = (data: any) => {
      const userId = data?.userId || data?.sender;
      const convoId = data?.conversationId;
      if (userId === receiverId && (!convoId || convoId === activeConversationId)) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (data: any) => {
      const userId = data?.userId || data?.sender;
      if (userId === receiverId) {
        setIsTyping(false);
      }
    };

    const handleMessagesRead = (data: any) => {
      const convoId = data?.conversationId;
      const readBy = data?.readBy || data?.userId;
      if (convoId === activeConversationId && readBy === receiverId) {
        setMessages((prev) =>
          prev.map((msg) => {
            const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
            if (senderId === user?.id) {
              return { ...msg, read: true, readAt: new Date().toISOString() };
            }
            return msg;
          })
        );
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('receive_message', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('receive_message', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, activeConversationId, receiverId, user?.id, refreshUnreadMessageCount]);

  // Emit typing events
  const handleTextChange = (text: string) => {
    setInputText(text);

    if (socket && activeConversationId) {
      socket.emit('typing', {
        conversationId: activeConversationId,
        receiverId,
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', {
          conversationId: activeConversationId,
          receiverId,
        });
      }, 2000);
    }
  };

  // Send message via REST API (reliable) + notify via socket for real-time
  const handleSend = async () => {
    const text = maskPhoneNumbers(inputText.trim());
    if (!text || isSending) return;

    setIsSending(true);
    setInputText('');

    // Stop typing
    if (socket && activeConversationId) {
      socket.emit('stop_typing', {
        conversationId: activeConversationId,
        receiverId,
      });
    }

    try {
      const response = await sendMessageApi(receiverId, text, 'text');

      if (response.success && response.data) {
        const newMsg = response.data.message;
        // Add message to local state
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });

        // If conversation was just created, update the active ID
        if (!activeConversationId && response.data.conversationId) {
          setActiveConversationId(response.data.conversationId);
          if (socket) {
            socket.emit('join_conversation', { conversationId: response.data.conversationId });
          }
        }
      }
    } catch (error) {
      console.error('Send message error:', error);
      setInputText(text); // Restore input on error
    } finally {
      setIsSending(false);
    }
  };

  // Check if we need a date separator
  const shouldShowDateSeparator = (index: number): boolean => {
    if (index === 0) return true;
    const current = new Date(messages[index].createdAt).toDateString();
    const previous = new Date(messages[index - 1].createdAt).toDateString();
    return current !== previous;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const senderId = typeof item.sender === 'object' ? item.sender._id : item.sender;
    const isMine = senderId === user?.id;
    const showDate = shouldShowDateSeparator(index);

    return (
      <View>
        {showDate && (
          <View className="items-center my-3">
            <View className="bg-gray-100 px-3 py-1 rounded-full">
              <Text className="text-xs text-gray-500">{formatDateSeparator(item.createdAt)}</Text>
            </View>
          </View>
        )}

        <View className={`px-4 mb-1 ${isMine ? 'items-end' : 'items-start'}`}>
          <View
            className={`max-w-[80%] px-3 py-2 rounded-2xl ${
              isMine
                ? 'bg-pink-500 rounded-br-sm'
                : 'bg-gray-100 rounded-bl-sm'
            }`}
          >
            {item.messageType === 'image' && item.fileUrl ? (
              <Image
                source={{ uri: item.fileUrl }}
                className="w-48 h-48 rounded-lg"
                resizeMode="cover"
              />
            ) : null}

            {item.message ? (
              <Text className={`text-sm ${isMine ? 'text-white' : 'text-gray-900'}`}>
                {maskPhoneNumbers(item.message)}
              </Text>
            ) : null}

            <View className={`flex-row items-center mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
              <Text className={`text-[10px] ${isMine ? 'text-pink-200' : 'text-gray-400'}`}>
                {formatMessageTime(item.createdAt)}
              </Text>
              {isMine && (
                <Icon
                  name={item.read ? 'checkmark-done' : 'checkmark'}
                  size={12}
                  color={item.read ? '#A5F3FC' : '#FBB6CE'}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center mr-1"
        >
          <Icon name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>

        {/* Avatar + Name (tappable for vendor profiles) */}
        <TouchableOpacity
          className="flex-row items-center flex-1"
          onPress={() => {
            if (receiverName !== 'VendorSpot Support') {
              navigation.navigate('VendorProfile', { vendorId: receiverId });
            }
          }}
          disabled={receiverName === 'VendorSpot Support'}
          activeOpacity={receiverName === 'VendorSpot Support' ? 1 : 0.7}
        >
          <View className="relative mr-3">
            {receiverAvatar ? (
              <Image source={{ uri: receiverAvatar }} className="w-10 h-10 rounded-full" />
            ) : (
              <View className="w-10 h-10 rounded-full bg-pink-100 items-center justify-center">
                <Text className="text-sm font-bold text-pink-500">
                  {receiverName?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            {isOnline && (
              <View className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
            )}
          </View>

          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
              {receiverName}
            </Text>
            <Text className="text-xs text-gray-500">
              {isTyping ? 'typing...' : isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Connection indicator */}
        {!isConnected && (
          <View className="w-2 h-2 rounded-full bg-red-400 mr-2" />
        )}
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#CC3366" />
          </View>
        ) : messages.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Icon name="chatbubble-ellipses-outline" size={48} color="#D1D5DB" />
            <Text className="text-sm text-gray-400 mt-3 text-center">
              No messages yet. Say hello!
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingVertical: 8 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Typing indicator */}
        {isTyping && (
          <View className="px-4 py-1">
            <Text className="text-xs text-gray-400 italic">
              {receiverName?.split(' ')[0]} is typing...
            </Text>
          </View>
        )}

        {/* Input */}
        <View className="flex-row items-end px-3 py-2 border-t border-gray-100 bg-white" style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
          <View className="flex-1 flex-row items-end bg-gray-100 rounded-2xl px-4 py-2 mr-2 min-h-[44px] max-h-[120px]">
            <TextInput
              className="flex-1 text-sm text-gray-900 py-0"
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={handleTextChange}
              multiline
              maxLength={2000}
            />
          </View>

          <TouchableOpacity
            className={`w-11 h-11 rounded-full items-center justify-center ${
              inputText.trim() ? 'bg-pink-500' : 'bg-gray-200'
            }`}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon
                name="send"
                size={18}
                color={inputText.trim() ? '#FFFFFF' : '#9CA3AF'}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
