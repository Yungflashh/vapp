import api from './api.config';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const sendAIMessage = async (
  message: string,
  history: ChatMessage[],
  role: 'customer' | 'vendor'
): Promise<{ success: boolean; data: { reply: string } }> => {
  const response = await api.post('/ai-chat', { message, history, role });
  return response.data;
};
