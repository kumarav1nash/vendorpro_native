import * as SecureStore from 'expo-secure-store';
import apiClient from './api-client';
import { AuthResponse, LoginDto, OtpResponse, RequestOtpDto, VerifyOtpDto, RefreshTokenDto, RefreshTokenResponse, LogoutDto, GenerateTokenDto } from '../types/auth';

// Helper to ensure phone number has +91 country code
function normalizePhoneNumber(data: RequestOtpDto): string {
  return data.phoneNumber.startsWith('+') ? data.phoneNumber : `+${data.countryCode}${data.phoneNumber}`;
}

export const authService = {
  requestOtp: async (data: RequestOtpDto): Promise<OtpResponse> => {
    data.phoneNumber = normalizePhoneNumber(data);
    const response = await apiClient.post<OtpResponse>('auth/request-otp', data);
    return response.data;
  },

  verifyOtp: async (data: VerifyOtpDto): Promise<AuthResponse> => {
    data.phoneNumber = normalizePhoneNumber(data);
    const response = await apiClient.post<AuthResponse>('auth/verify-otp', data);
    
    // Store tokens in secure storage
    if (response.data.accessToken) {
      await SecureStore.setItemAsync('accessToken', response.data.accessToken);
    }
    if (response.data.refreshToken) {
      await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
    }
    
    return response.data;
  },

  generateToken: async (data: GenerateTokenDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('auth/generate-token', data);
    // Store tokens in secure storage
    if (response.data.accessToken) {
      await SecureStore.setItemAsync('accessToken', response.data.accessToken);
    }
    if (response.data.refreshToken) {
      await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
    }
    return response.data;
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    data.phoneNumber = normalizePhoneNumber(data);
    const response = await apiClient.post<AuthResponse>('auth/login', data);
    
    // Store tokens in secure storage
    if (response.data.accessToken) {
      await SecureStore.setItemAsync('accessToken', response.data.accessToken);
    }
    if (response.data.refreshToken) {
      await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
    }
    
    return response.data;
  },

  refreshToken: async (data: RefreshTokenDto): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post<RefreshTokenResponse>('auth/refresh-token', data);
    
    // Store new tokens
    if (response.data.accessToken) {
      await SecureStore.setItemAsync('accessToken', response.data.accessToken);
    }
    if (response.data.refreshToken) {
      await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
    }
    
    return response.data;
  },

  logout: async (data: LogoutDto): Promise<void> => {
    try {
      await apiClient.post('auth/logout', data);
    } finally {
      // Always clear tokens on logout, even if API call fails
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    }
  },

  // Get the current stored token
  getAccessToken: async (): Promise<string | null> => {
    return SecureStore.getItemAsync('accessToken');
  },

  // Get the current refresh token
  getRefreshToken: async (): Promise<string | null> => {
    return SecureStore.getItemAsync('refreshToken');
  }
}; 
