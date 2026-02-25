// services/question.service.ts
import api from './api.config'; 

export interface ProductQuestionUser {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface ProductQuestion {
  _id: string;
  product: string | any;
  user: ProductQuestionUser | null;
  question: string;
  answer: string | null;
  answeredBy: ProductQuestionUser | null;
  answeredAt: string | null;
  isPublic: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionStats {
  total: number;
  answered: number;
  unanswered: number;
}

export const askQuestion = async (productId: string, question: string) => {
  const response = await api.post('/questions', { productId, question });
  return response.data;
};

export const getProductQuestions = async (
  productId: string,
  page = 1,
  limit = 10,
  filter: 'all' | 'answered' | 'unanswered' = 'all'
) => {
  const response = await api.get(`/questions/product/${productId}`, {
    params: { page, limit, filter },
  });
  return response.data;
};

export const getMyQuestions = async (page = 1, limit = 10) => {
  const response = await api.get('/questions/my-questions', {
    params: { page, limit },
  });
  return response.data;
};

export const getVendorQuestions = async (
  page = 1,
  limit = 10,
  filter: 'all' | 'answered' | 'unanswered' = 'unanswered'
) => {
  const response = await api.get('/questions/vendor-questions', {
    params: { page, limit, filter },
  });
  return response.data;
};

export const updateQuestion = async (questionId: string, question: string) => {
  const response = await api.put(`/questions/${questionId}`, { question });
  return response.data;
};

export const deleteQuestion = async (questionId: string) => {
  const response = await api.delete(`/questions/${questionId}`);
  return response.data;
};

export const answerQuestion = async (questionId: string, answer: string) => {
  const response = await api.put(`/questions/${questionId}/answer`, { answer });
  return response.data;
};

export const markQuestionHelpful = async (questionId: string) => {
  const response = await api.post(`/questions/${questionId}/helpful`);
  return response.data;
};

export const reportQuestion = async (questionId: string, reason: string) => {
  const response = await api.post(`/questions/${questionId}/report`, { reason });
  return response.data;
};