import api, { handleApiError } from './api.config';

// ============================================================
// ACCOUNT DELETION API
// ============================================================

export interface DeletionRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason: string;
  additionalDetails?: string;
  createdAt: string;
  processedAt?: string;
  rejectionReason?: string;
}

/**
 * Request account deletion
 */
export const requestAccountDeletion = async (data: {
  reason: string;
  additionalDetails?: string;
}): Promise<{
  success: boolean;
  message: string;
  data: {
    deletionRequest: DeletionRequest;
  };
}> => {
  try {
    console.log('🗑️ Requesting account deletion...');
    
    const response = await api.post('/account-deletion/request', data);
    
    console.log('✅ Account deletion requested');
    
    return response.data;
  } catch (error) {
    console.error('❌ Request account deletion error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get deletion request status
 */
export const getDeletionRequestStatus = async (): Promise<{
  success: boolean;
  data: {
    hasRequest: boolean;
    deletionRequest: DeletionRequest | null;
  };
}> => {
  try {
    console.log('🔍 Checking deletion request status...');
    
    const response = await api.get('/account-deletion/status');
    
    console.log('✅ Deletion status fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get deletion status error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Cancel deletion request
 */
export const cancelDeletionRequest = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log('❌ Cancelling deletion request...');
    
    const response = await api.post('/account-deletion/cancel');
    
    console.log('✅ Deletion request cancelled');
    
    return response.data;
  } catch (error) {
    console.error('❌ Cancel deletion request error:', error);
    handleApiError(error);
    throw error;
  }
};
