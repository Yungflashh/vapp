import api, { handleApiError } from './api.config';

// ============================================================
// WALLET API FUNCTIONS
// ============================================================

export interface Wallet {
    balance: number;
}

export interface WalletResponse {
    success: boolean;
    data: {
        wallet: Wallet;
    }
}

/**
 * Get user wallet
 */
export const getWallet = async (): Promise<WalletResponse> => {
  try {
    console.log('💳 Fetching wallet...');
    
    const response = await api.get<WalletResponse>('/wallet');
    
    console.log('✅ Wallet fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get wallet error:', error);
    handleApiError(error);
    throw error;
  }
};
