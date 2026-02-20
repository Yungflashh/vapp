import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL
const API_URL = 'http://10.192.171.66:5000/api/v1';
// const API_URL = 'http://192.168.242.66:5000/api/v1';

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
      // Token expired or invalid - clear storage and redirect to login
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      // You can emit an event here to redirect to login
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
