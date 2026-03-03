import api, { handleApiError } from './api.config';

export interface MessageUser {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: MessageUser | string;
  receiver: MessageUser | string;
  message: string;
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: MessageUser[];
  lastMessage?: Message;
  unreadCount?: number;
  order?: {
    _id: string;
    orderNumber: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ConversationsResponse {
  success: boolean;
  data: {
    conversations: Conversation[];
  };
}

export interface MessagesResponse {
  success: boolean;
  data: {
    messages: Message[];
    conversation?: Conversation;
  };
}

export interface SendMessageResponse {
  success: boolean;
  data: {
    message: Message;
    conversationId: string;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

/**
 * Get user's conversations
 */
export const getConversations = async (): Promise<ConversationsResponse> => {
  try {
    const response = await api.get<ConversationsResponse>('/messages/conversations');
    return response.data;
  } catch (error) {
    console.error('Get conversations error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Start or get a conversation with another user
 */
export const startConversation = async (
  receiverId: string,
  orderId?: string
): Promise<{ success: boolean; data: { conversation: Conversation } }> => {
  try {
    const response = await api.post('/messages/conversations/start', {
      receiverId,
      orderId,
    });
    return response.data;
  } catch (error) {
    console.error('Start conversation error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get messages in a conversation
 */
export const getMessages = async (
  conversationId: string,
  page = 1,
  limit = 50
): Promise<MessagesResponse> => {
  try {
    const response = await api.get<MessagesResponse>(
      `/messages/conversations/${conversationId}`,
      { params: { page, limit } }
    );
    return response.data;
  } catch (error) {
    console.error('Get messages error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Send a message via REST API
 */
export const sendMessage = async (
  receiverId: string,
  message: string,
  messageType: 'text' | 'image' | 'file' = 'text',
  fileUrl?: string,
  orderId?: string
): Promise<SendMessageResponse> => {
  try {
    const response = await api.post<SendMessageResponse>('/messages/send', {
      receiverId,
      message,
      messageType,
      fileUrl,
      orderId,
    });
    return response.data;
  } catch (error) {
    console.error('Send message error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Mark conversation messages as read
 */
export const markConversationAsRead = async (conversationId: string) => {
  try {
    const response = await api.put(`/messages/conversations/${conversationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Mark as read error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId: string) => {
  try {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  } catch (error) {
    console.error('Delete message error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get total unread message count
 */
export const getUnreadMessageCount = async (): Promise<UnreadCountResponse> => {
  try {
    const response = await api.get<UnreadCountResponse>('/messages/unread-count');
    return response.data;
  } catch (error) {
    console.error('Get unread message count error:', error);
    handleApiError(error);
    throw error;
  }
};
