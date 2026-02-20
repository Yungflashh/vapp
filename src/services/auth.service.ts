import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { handleApiError } from './api.config';

// ============================================================
// AUTH API ENDPOINTS
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
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
      phone: string;
      role: 'vendor' | 'customer';
    };
  };
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: 'vendor' | 'customer';
  hearAbout?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    email: string;
  };
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: any;
  };
}

/**
 * Login user
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    console.log('🔐 Attempting login with:', { email: data.email });
    
    const response = await api.post<LoginResponse>('/auth/login', data);
    
    console.log('✅ Login successful:', response.data);
    
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
  } catch (error) {
    console.error('❌ Login error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Register new user
 */
export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  try {
    console.log('📝 Attempting registration:', { email: data.email, role: data.role });
    
    const response = await api.post<RegisterResponse>('/auth/register', data);
    
    console.log('✅ Registration successful:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Registration error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Verify OTP code
 */
export const verifyOTP = async (data: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
  try {
    console.log('🔢 Verifying OTP for:', data.email);
    
    const response = await api.post<VerifyOTPResponse>('/auth/verify-email', data);
    
    console.log('✅ OTP verification successful:', response.data);
    
    // Store token if provided
    if (response.data.success && response.data.data.token) {
      await AsyncStorage.setItem('authToken', response.data.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Resend OTP code
 */
export const resendOTP = async (email: string) => {
  try {
    console.log('📧 Resending OTP to:', email);
    
    const response = await api.post('/auth/resend-otp', { email });
    
    console.log('✅ OTP resent successfully:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    console.log('🚪 Logging out...');
    
    await api.post('/auth/logout');
    
    // Clear local storage
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
    
    console.log('✅ Logout successful');
  } catch (error) {
    console.error('❌ Logout error:', error);
    // Still clear local storage even if API call fails
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
  }
};

/**
 * Get current user data
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('❌ Get current user error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Reset user password
 */
export const resetPassword = async (data: { code: string; password: string }) => {
  try {
    console.log('🔐 Sending reset password request...');
    const response = await api.post('/auth/reset-password', data);
    console.log('✅ Password reset response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Reset password error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Request password reset link
 */
export const forgotPassword = async (email: string) => {
  try {
    console.log('📧 Requesting password reset for:', email);
    const response = await api.post('/auth/forgot-password', { email });
    console.log('✅ Password reset response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    handleApiError(error);
    throw error;
  }
};
