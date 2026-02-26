// services/dispute.service.ts
import api from './api.config';

export interface Dispute {
  _id: string;
  disputeNumber: string;
  order: any;
  orderNumber: string;
  user: any;
  vendor: any;
  reason: string;
  description: string;
  evidence: string[];
  status: string;
  messages: DisputeMessage[];
  resolvedBy?: any;
  resolution?: string;
  refundAmount?: number;
  refundType?: 'full' | 'partial' | 'none';
  disputedItems?: {
    product: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeMessage {
  _id?: string;
  sender: any;
  senderRole: 'customer' | 'vendor' | 'admin';
  message: string;
  attachments?: string[];
  createdAt: string;
}

export type DisputeReason =
  | 'item_not_received'
  | 'item_damaged'
  | 'item_not_as_described'
  | 'wrong_item'
  | 'missing_items'
  | 'quality_issue'
  | 'other';

export const DISPUTE_REASONS: { value: DisputeReason; label: string }[] = [
  { value: 'item_not_received', label: 'Item not received' },
  { value: 'item_damaged', label: 'Item arrived damaged' },
  { value: 'item_not_as_described', label: 'Product not as described' },
  { value: 'wrong_item', label: 'Wrong item delivered' },
  { value: 'missing_items', label: 'Missing items from order' },
  { value: 'quality_issue', label: 'Quality issue' },
  { value: 'other', label: 'Other' },
];

// Create a new dispute
export const createDispute = async (data: {
  orderId: string;
  reason: DisputeReason;
  description: string;
  evidence?: string[];
  vendorId?: string;
  disputedItems?: {
    product: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
}) => {
  console.log('🔴 [dispute.service] createDispute called with:', JSON.stringify(data, null, 2));
  try {
    const response = await api.post('/disputes', data);
    return response.data;
  } catch (error: any) {
    console.error('🔴 [dispute.service] createDispute failed:');
    console.error('  Status:', error.response?.status);
    console.error('  Data:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
};

// Get my disputes (customer)
export const getMyDisputes = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}) => {
  const response = await api.get('/disputes/my-disputes', { params });
  return response.data;
};

// Get single dispute
export const getDisputeById = async (id: string) => {
  const response = await api.get(`/disputes/${id}`);
  return response.data;
};

// Add message to dispute thread
export const addDisputeMessage = async (
  id: string,
  data: { message: string; attachments?: string[] }
) => {
  const response = await api.post(`/disputes/${id}/messages`, data);
  return response.data;
};

// Vendor: Get disputes against them
export const getVendorDisputes = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}) => {
  const response = await api.get('/disputes/vendor/disputes', { params });
  return response.data;
};

// Vendor: Respond to a dispute
export const vendorRespondToDispute = async (
  id: string,
  data: { message: string; attachments?: string[] }
) => {
  const response = await api.post(`/disputes/${id}/vendor-respond`, data);
  return response.data;
};