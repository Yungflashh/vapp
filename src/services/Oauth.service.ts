import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// OAUTH INTERFACES
// ============================================================

export interface GoogleLoginRequest {
  idToken: string;
  accessToken?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: 'customer' | 'vendor' | 'affiliate';
}

export interface AppleLoginRequest {
  identityToken: string;
  authorizationCode?: string;
  user?: {
    name?: {
      firstName?: string;
      lastName?: string;
    };
    givenName?: string;
    familyName?: string;
    email?: string;
  };
  role?: 'customer' | 'vendor' | 'affiliate';
}

export interface OAuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      role: 'vendor' | 'customer';
      avatar?: string;
    };
  };
}

// ============================================================
// OAUTH API FUNCTIONS
// ============================================================

/**
 * Login with Google OAuth
 */
export const googleLogin = async (data: GoogleLoginRequest): Promise<OAuthResponse> => {
  try {
    console.log('🔐 Attempting Google OAuth login...');
    console.log('📤 Sending data to backend:', { idToken: data.idToken, role: data.role });
    
    // Backend only needs idToken and role
    const response = await api.post<OAuthResponse>('/auth/oauth/google', {
      idToken: data.idToken,
      role: data.role || 'customer'
    });
    
    console.log('✅ Google login successful:', response.data);
    
    // Store tokens and user data
    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken, user } = response.data.data;
      
      if (accessToken) {
        await AsyncStorage.setItem('authToken', accessToken);
        console.log('💾 Access token stored');
      }
      
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
        console.log('💾 Refresh token stored');
      }
      
      if (user) {
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        console.log('💾 User data stored:', user);
      }
    }
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Google login error:', error);
    console.error('❌ Error response:', error.response?.data);
    throw error;
  }
};

/**
 * Login with Apple OAuth
 */
export const appleLogin = async (data: AppleLoginRequest): Promise<OAuthResponse> => {
  try {
    console.log('🍎 Attempting Apple OAuth login...');
    
    const response = await api.post<OAuthResponse>('/auth/oauth/apple', data);
    
    console.log('✅ Apple login successful:', response.data);
    
    // Store tokens and user data
    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken, user } = response.data.data;
      
      if (accessToken) {
        await AsyncStorage.setItem('authToken', accessToken);
        console.log('💾 Access token stored');
      }
      
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
        console.log('💾 Refresh token stored');
      }
      
      if (user) {
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        console.log('💾 User data stored:', user);
      }
    }
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Apple login error:', error);
    console.error('❌ Error response:', error.response?.data);
    throw error;
  }
};

export default {
  googleLogin,
  appleLogin,
};