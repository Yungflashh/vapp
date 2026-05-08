import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import { useAuth } from '@/context/AuthContext';
import { sendAIMessage, ChatMessage } from '@/services/ai-chat.service';

type AIChatScreenProps = NativeStackScreenProps<RootStackParamList, 'AIChat'>;

interface DisplayMessage extends ChatMessage {
  id: string;
  timestamp: Date;
}

const CUSTOMER_SUGGESTIONS = [
  'How do I track my order?',
  'How do I earn rewards?',
  'How does the affiliate program work?',
  'How do I file a dispute?',
];

const VENDOR_SUGGESTIONS = [
  'How do I add a product?',
  'When do I get paid after a sale?',
  'How does KYC verification work?',
  'How can I increase my sales?',
];

const AIChatScreen = ({ navigation }: AIChatScreenProps) => {
  const { user } = useAuth();
  const isVendor = user?.role === 'vendor';
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const suggestions = isVendor ? VENDOR_SUGGESTIONS : CUSTOMER_SUGGESTIONS;

  useEffect(() => {
    // Add welcome message
    const welcome: DisplayMessage = {
      id: 'welcome',
      role: 'assistant',
      content: isVendor
        ? 'Hi, I\'m Bolanle, VendorSpot AI! I\'m here to help you grow your business on VendorSpot — Nigeria\'s most trusted marketplace. Ask me anything about managing your store, products, earnings, or orders.'
        : 'Hi, I\'m Bolanle, VendorSpot AI! Welcome to VendorSpot — a 100% secure and trusted marketplace. I can help you shop, track orders, earn rewards, and more. What can I help you with?',
      timestamp: new Date(),
    };
    setMessages([welcome]);
  }, [isVendor]);

  const handleSend = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading) return;

    const userMessage: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build history from existing messages (exclude welcome)
      const history: ChatMessage[] = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await sendAIMessage(
        messageText,
        history,
        isVendor ? 'vendor' : 'customer'
      );

      const aiMessage: DisplayMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: DisplayMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I couldn\'t process that. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: DisplayMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View
        className={`px-4 mb-3 ${isUser ? 'items-end' : 'items-start'}`}
      >
        {!isUser && (
          <View className="flex-row items-center mb-1">
            <View className="w-6 h-6 rounded-full items-center justify-center mr-1.5" style={{ backgroundColor: '#CC3366' }}>
              <Icon name="sparkles" size={14} color="#FFFFFF" />
            </View>
            <Text className="text-xs font-semibold text-gray-500">Bolanle</Text>
          </View>
        )}
        <View
          className={`rounded-2xl px-4 py-3 max-w-[85%] ${
            isUser
              ? 'rounded-tr-sm'
              : 'rounded-tl-sm'
          }`}
          style={{
            backgroundColor: isUser ? '#CC3366' : '#F3F4F6',
          }}
        >
          <Text
            className={`text-sm leading-5 ${isUser ? 'text-white' : 'text-gray-800'}`}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const showSuggestions = messages.length <= 1 && !isLoading;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <Icon name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#CC3366' }}>
            <Icon name="sparkles" size={20} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900">Bolanle - VendorSpot AI</Text>
            <Text className="text-xs text-green-500">Online</Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={
            <>
              {isLoading && (
                <View className="px-4 mb-3 items-start">
                  <View className="flex-row items-center mb-1">
                    <View className="w-6 h-6 rounded-full items-center justify-center mr-1.5" style={{ backgroundColor: '#CC3366' }}>
                      <Icon name="sparkles" size={14} color="#FFFFFF" />
                    </View>
                    <Text className="text-xs font-semibold text-gray-500">Bolanle</Text>
                  </View>
                  <View className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <ActivityIndicator size="small" color="#CC3366" />
                  </View>
                </View>
              )}

              {/* Suggestions */}
              {showSuggestions && (
                <View className="px-4 mt-2">
                  <Text className="text-xs font-semibold text-gray-400 mb-2 uppercase">Try asking</Text>
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSend(suggestion)}
                      className="border border-gray-200 rounded-xl px-4 py-3 mb-2"
                      activeOpacity={0.7}
                    >
                      <Text className="text-sm text-gray-700">{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          }
        />

        {/* Input */}
        <View className="border-t border-gray-100 px-4 py-3">
          <View className="flex-row items-end bg-gray-50 rounded-2xl px-4 py-2">
            <TextInput
              className="flex-1 text-base text-gray-900 max-h-[100px] py-1.5"
              placeholder={isVendor ? 'Ask about your store...' : 'Ask about VendorSpot...'}
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
              multiline
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="ml-2 mb-0.5"
            >
              <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: input.trim() ? '#CC3366' : '#E5E7EB' }}
              >
                <Icon
                  name="arrow-up"
                  size={20}
                  color={input.trim() ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
            </TouchableOpacity>
          </View>
          <Text className="text-[10px] text-gray-400 text-center mt-2">
            VendorSpot AI can make mistakes. Verify important information.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AIChatScreen;
