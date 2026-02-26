import api, { handleApiError } from './api.config';

// ============================================================
// CHALLENGE SERVICE
// ============================================================

export interface ChallengeData {
  _id: string;
  title: string;
  description: string;
  type: 'buyer' | 'seller' | 'affiliate';
  targetType: string;
  targetValue: number;
  rewardType: 'cash' | 'points';
  rewardValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isRecurring: boolean;
  participants: any[];
  userProgress?: {
    progress: number;
    completed: boolean;
    completedAt?: string;
  };
}

export interface UserChallenge {
  challenge: {
    id: string;
    title: string;
    description: string;
    type: string;
    targetType: string;
    targetValue: number;
    rewardType: string;
    rewardValue: number;
    startDate: string;
    endDate: string;
  };
  progress: number;
  completed: boolean;
  completedAt?: string;
  rewardClaimed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    name: string;
  };
  progress: number;
  completed: boolean;
  completedAt?: string;
}

/**
 * Get active challenges
 */
export const getActiveChallenges = async (): Promise<{
  success: boolean;
  data: { challenges: ChallengeData[] };
}> => {
  try {
    const response = await api.get('/challenges/active');
    return response.data;
  } catch (error) {
    console.error('❌ Get active challenges error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get user's challenges (active + completed)
 */
export const getUserChallenges = async (): Promise<{
  success: boolean;
  data: {
    active: UserChallenge[];
    completed: UserChallenge[];
    totalCompleted: number;
  };
}> => {
  try {
    const response = await api.get('/challenges/my-challenges');
    return response.data;
  } catch (error) {
    console.error('❌ Get user challenges error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Join a challenge
 */
export const joinChallenge = async (
  challengeId: string
): Promise<{
  success: boolean;
  message: string;
  data: { challenge: ChallengeData };
}> => {
  try {
    const response = await api.post(`/challenges/${challengeId}/join`);
    return response.data;
  } catch (error) {
    console.error('❌ Join challenge error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Claim challenge reward
 */
export const claimChallengeReward = async (
  challengeId: string
): Promise<{
  success: boolean;
  message: string;
  data: { rewardType: string; rewardValue: number };
}> => {
  try {
    const response = await api.post(`/challenges/${challengeId}/claim`);
    return response.data;
  } catch (error) {
    console.error('❌ Claim reward error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get challenge leaderboard
 */
export const getChallengeLeaderboard = async (
  challengeId: string
): Promise<{
  success: boolean;
  data: {
    challenge: {
      id: string;
      title: string;
      targetValue: number;
      targetType: string;
    };
    leaderboard: LeaderboardEntry[];
  };
}> => {
  try {
    const response = await api.get(`/challenges/${challengeId}/leaderboard`);
    return response.data;
  } catch (error) {
    console.error('❌ Get leaderboard error:', error);
    handleApiError(error);
    throw error;
  }
};