import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL
const API_URL = 'https://vapp-be.onrender.com/api/v1';
// const API_URL = 'http://192.168.222.66:5000/api/v1';

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 180000,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Only clear auth if we actually had a token (not a guest user)
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
      }
    }
    return Promise.reject(error);
  }
);

export const handleApiError = (error: any) => {
  if (axios.isAxiosError(error)) {
    console.error('API Error:', error.response?.data?.message || error.message);
  } else {
    console.error('An unexpected error occurred:', error);
  }
};

export default api;
