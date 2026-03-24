import api, { handleApiError } from './api.config';

// ============================================================
// WALLET API FUNCTIONS
// ============================================================

export interface Wallet {
    balance: number;
    vCredits: number;
    totalEarned: number;
    totalSpent: number;
    totalWithdrawn: number;
    pendingBalance: number;
}

export interface WalletResponse {
    success: boolean;
    data: {
        wallet: Wallet;
    }
}

export interface WalletSummaryResponse {
    success: boolean;
    data: {
        summary: {
            balance: number;
            pendingBalance: number;
            totalEarned: number;
            totalSpent: number;
            totalWithdrawn: number;
            vCredits?: number;
        };
        recentTransactions?: Transaction[];
    };
}

export interface Transaction {
    _id: string;
    type: string;
    amount: number;
    purpose?: string;
    description?: string;
    status: 'completed' | 'pending' | 'failed';
    reference?: string;
    timestamp: string;
    createdAt?: string;
}

export interface TransactionsResponse {
    success: boolean;
    data: {
        transactions: Transaction[];
    };
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface WithdrawalResponse {
    success: boolean;
    message: string;
    data?: {
        withdrawal: any;
    };
}

/**
 * Get user wallet
 */
export const getWallet = async (): Promise<WalletResponse> => {
  try {
    console.log('Fetching wallet...');

    const response = await api.get<WalletResponse>('/wallet');

    console.log('Wallet fetched');

    return response.data;
  } catch (error) {
    console.error('Get wallet error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get wallet summary with recent transactions
 */
export const getWalletSummary = async (): Promise<WalletSummaryResponse> => {
  try {
    console.log('Fetching wallet summary...');

    const response = await api.get<WalletSummaryResponse>('/wallet/summary');

    console.log('Wallet summary fetched');

    return response.data;
  } catch (error) {
    console.error('Get wallet summary error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get paginated transaction history
 */
export const getTransactions = async (page: number = 1, limit: number = 20): Promise<TransactionsResponse> => {
  try {
    console.log(`Fetching transactions page ${page}...`);

    const response = await api.get<TransactionsResponse>('/wallet/transactions', {
      params: { page, limit },
    });

    console.log('Transactions fetched');

    return response.data;
  } catch (error) {
    console.error('Get transactions error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Request a withdrawal (minimum 1,000 NGN)
 */
export const requestWithdrawal = async (amount: number): Promise<WithdrawalResponse> => {
  try {
    console.log(`Requesting withdrawal of ${amount}...`);

    const response = await api.post<WithdrawalResponse>('/wallet/withdraw', { amount });

    console.log('Withdrawal requested');

    return response.data;
  } catch (error) {
    console.error('Request withdrawal error:', error);
    handleApiError(error);
    throw error;
  }
};
