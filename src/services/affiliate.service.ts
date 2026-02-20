import api, { handleApiError } from './api.config';

// ============================================================
// AFFILIATE API - ADD TO @/services/api.ts
// ============================================================

export interface AffiliateDashboard {
  summary: {
    affiliateCode: string;
    totalClicks: number;
    totalConversions: number;
    totalEarnings: number;
    conversionRate: string;
    availableBalance: number;
  };
  links: any[];
  topPerformingLinks: any[];
  recentConversions: any[];
}

export interface AffiliateEarnings {
  period: string;
  summary: {
    totalOrders: number;
    totalEarnings: number;
    averageCommission: number;
  };
  earningsByDate: Array<{
    date: string;
    orders: number;
    earnings: number;
  }>;
}

export interface AffiliateLeaderboard {
  period: string;
  metric: string;
  leaderboard: Array<{
    rank: number;
    affiliate: {
      id: string;
      name: string;
      code: string;
    };
    stats: {
      clicks: number;
      conversions: number;
      earnings: number;
    };
    score: number;
  }>;
}

// ============================================================
// AFFILIATE API FUNCTIONS
// ============================================================

/**
 * Activate affiliate account
 */
export const activateAffiliate = async (): Promise<{
  success: boolean;
  message: string;
  data: {
    affiliateCode: string;
    wallet: {
      balance: number;
    };
  };
}> => {
  try {
    console.log('💎 Activating affiliate account...');
    
    const response = await api.post('/affiliate/activate');
    
    console.log('✅ Affiliate activated:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Activate affiliate error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Generate affiliate link for product
 */
export const generateAffiliateLink = async (
  productId: string
): Promise<{
  success: boolean;
  message: string;
  data: {
    affiliateLink: {
      id: string;
      code: string;
      url: string;
      product: {
        id: string;
        name: string;
        price: number;
        commission: number;
      };
      clicks: number;
      conversions: number;
      totalEarned: number;
    };
  };
}> => {
  try {
    console.log('🔗 Generating affiliate link for product:', productId);
    
    const response = await api.post('/affiliate/generate-link', { productId });
    
    console.log('✅ Affiliate link generated');
    
    return response.data;
  } catch (error) {
    console.error('❌ Generate affiliate link error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Generate general affiliate link
 */
export const generateGeneralAffiliateLink = async (): Promise<{
  success: boolean;
  message: string;
  data: {
    affiliateLink: {
      id: string;
      code: string;
      url: string;
      clicks: number;
      conversions: number;
      totalEarned: number;
    };
  };
}> => {
  try {
    console.log('🔗 Generating general affiliate link...');
    
    const response = await api.post('/affiliate/generate-general-link');
    
    console.log('✅ General affiliate link generated');
    
    return response.data;
  } catch (error) {
    console.error('❌ Generate general affiliate link error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get affiliate dashboard
 */
export const getAffiliateDashboard = async (): Promise<{
  success: boolean;
  data: AffiliateDashboard;
}> => {
  try {
    console.log('📊 Fetching affiliate dashboard...');
    
    const response = await api.get('/affiliate/dashboard');
    
    console.log('✅ Affiliate dashboard fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get affiliate dashboard error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get affiliate earnings
 */
export const getAffiliateEarnings = async (
  period: '7days' | '30days' | '90days' | 'all' = '30days'
): Promise<{
  success: boolean;
  data: AffiliateEarnings;
}> => {
  try {
    console.log('💰 Fetching affiliate earnings...');
    
    const response = await api.get(`/affiliate/earnings?period=${period}`);
    
    console.log('✅ Affiliate earnings fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get affiliate earnings error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get affiliate leaderboard
 */
export const getAffiliateLeaderboard = async (
  period: '7days' | '30days' | 'all' = '30days',
  metric: 'earnings' | 'conversions' | 'clicks' = 'earnings'
): Promise<{
  success: boolean;
  data: AffiliateLeaderboard;
}> => {
  try {
    console.log('🏆 Fetching affiliate leaderboard...');
    
    const response = await api.get(`/affiliate/leaderboard?period=${period}&metric=${metric}`);
    
    console.log('✅ Affiliate leaderboard fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get affiliate leaderboard error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Track affiliate click
 */
export const trackAffiliateClick = async (code: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log('👆 Tracking affiliate click:', code);
    
    const response = await api.get(`/affiliate/track/${code}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Track affiliate click error:', error);
    handleApiError(error);
    throw error;
  }
};
