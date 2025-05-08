import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

// Standard API base URL from env or fallback
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.khataflow.com/';

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Create a custom axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Set a reasonable timeout
  timeout: 10000,
});

// Request interceptor to add auth token to requests and check for offline status
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Check network status before making request
    const netState = await NetInfo.fetch();
    
    if (!netState.isConnected) {
      // Create a custom offline error
      const offlineError = new Error('You are offline. Please check your connection and try again.');
      (offlineError as any).isOffline = true;
      return Promise.reject(offlineError);
    }
    
    // Add authorization token if available
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Track if a token refresh is in progress
let isRefreshing = false;
// Store pending requests that should be retried after token refresh
let failedQueue: any[] = [];

// Process the failed queue by resolving or rejecting each promise
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Function to refresh tokens
const refreshAuthToken = async () => {
  try {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    // Check network status before attempting token refresh
    const netState = await NetInfo.fetch();
    
    if (!netState.isConnected) {
      throw new Error('You are offline. Please check your connection and try again.');
    }
    
    // Call refresh token endpoint
    const response = await axios.post(`${API_BASE_URL}auth/refresh-token`, {
      refreshToken,
    });
    
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    
    // Store the new tokens
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
    
    return accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear tokens on refresh failure
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    throw error;
  }
};

// Response interceptor to handle token refresh and network errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError | any) => {
    // Handle offline errors
    if (error.isOffline || error.message === 'Network Error' || error.code === 'ECONNABORTED') {
      const offlineError = new Error('You are offline. Please check your connection and try again.');
      (offlineError as any).isOffline = true;
      return Promise.reject(offlineError);
    }
    
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If we get a 401 and haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If token refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const newToken = await refreshAuthToken();
        processQueue(null, newToken);
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Special handling for 404 errors to prevent application disruption
    if (error.response?.status === 404) {
      console.warn('Resource not found:', originalRequest.url);
      
      // For GET requests, return empty data instead of rejecting the promise
      if (originalRequest.method?.toLowerCase() === 'get') {
        // Determine the appropriate empty response based on the expected data type
        const emptyResponse = Array.isArray(error.config?.data) ? [] : {};
        
        return Promise.resolve({
          status: 200,
          statusText: 'OK (Empty response for 404)',
          headers: error.response?.headers,
          config: error.config,
          data: emptyResponse
        } as AxiosResponse);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 