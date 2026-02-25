// services/review.service.ts
import api from './api.config'; 

export interface Review {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  product: string;
  order: string;
  rating: number;
  comment: string;
  images: string[];
  helpful: number;
  helpfulBy: string[];
  reported: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDistribution {
  _id: number;
  count: number;
}

export interface CreateReviewPayload {
  productId: string;
  orderId: string;
  rating: number;
  comment: string;
  images?: string[];
}

export const createReview = async (payload: CreateReviewPayload) => {
  const response = await api.post('/reviews', payload);
  return response.data;
};

export const getProductReviews = async (
  productId: string,
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  rating?: number
) => {
  const params: any = { page, limit, sortBy };
  if (rating) params.rating = rating;
  const response = await api.get(`/reviews/product/${productId}`, { params });
  return response.data;
};

export const getUserReviews = async (page = 1, limit = 10) => {
  const response = await api.get('/reviews/my-reviews', { params: { page, limit } });
  return response.data;
};

export const updateReview = async (reviewId: string, data: Partial<CreateReviewPayload>) => {
  const response = await api.put(`/reviews/${reviewId}`, data);
  return response.data;
};

export const deleteReview = async (reviewId: string) => {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response.data;
};

export const markReviewHelpful = async (reviewId: string) => {
  const response = await api.post(`/reviews/${reviewId}/helpful`);
  return response.data;
};

export const reportReview = async (reviewId: string, reason: string) => {
  const response = await api.post(`/reviews/${reviewId}/report`, { reason });
  return response.data;
};