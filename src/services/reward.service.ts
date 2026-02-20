import api, { handleApiError } from './api.config';

// ============================================================
// REWARDS API - ADD TO @/services/api.ts
// ============================================================

// Add these interfaces to your api.ts file

export interface UserPoints {
  points: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  pointsToNextTier: number;
  badges: string[];
  achievements: string[];
}

export interface AvailableReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  available: boolean;
}

export interface PointsHistory {
  date: string;
  type: string;
  description: string;
  points: number;
}

export interface Leaderboard {
  type: string;
  period: string;
  leaderboard: Array<{
    rank: number;
    user: {
      id: string;
      name: string;
      badges: string[];
    };
    score: number;
  }>;
}

// ============================================================
// REWARDS API FUNCTIONS
// ============================================================

/**
 * Get user points and rewards tier
 */
export const getUserPoints = async (): Promise<{
  success: boolean;
  data: UserPoints;
}> => {
  try {
    console.log('🏆 Fetching user points...');
    
    const response = await api.get('/rewards/points');
    
    console.log('✅ User points fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get user points error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get points history
 */
export const getPointsHistory = async (): Promise<{
  success: boolean;
  data: {
    history: PointsHistory[];
  };
}> => {
  try {
    console.log('📜 Fetching points history...');
    
    const response = await api.get('/rewards/points/history');
    
    console.log('✅ Points history fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get points history error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Redeem points for cash
 */
export const redeemPoints = async (
  points: number
): Promise<{
  success: boolean;
  message: string;
  data: {
    pointsRedeemed: number;
    cashValue: number;
    remainingPoints: number;
    newBalance: number;
  };
}> => {
  try {
    console.log('💰 Redeeming points:', points);
    
    const response = await api.post('/rewards/points/redeem', { points });
    
    console.log('✅ Points redeemed successfully');
    
    return response.data;
  } catch (error) {
    console.error('❌ Redeem points error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get available rewards
 */
export const getAvailableRewards = async (): Promise<{
  success: boolean;
  data: {
    userPoints: number;
    rewards: AvailableReward[];
  };
}> => {
  try {
    console.log('🎁 Fetching available rewards...');
    
    const response = await api.get('/rewards/available');
    
    console.log('✅ Available rewards fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get available rewards error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get leaderboard
 */
export const getLeaderboard = async (
  period: 'all-time' | '7days' | '30days' = 'all-time',
  type: 'points' | 'purchases' = 'points'
): Promise<{
  success: boolean;
  data: Leaderboard;
}> => {
  try {
    console.log('🏅 Fetching leaderboard...');
    
    const response = await api.get(`/rewards/leaderboard?period=${period}&type=${type}`);
    
    console.log('✅ Leaderboard fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get leaderboard error:', error);
    handleApiError(error);
    throw error;
  }
};
