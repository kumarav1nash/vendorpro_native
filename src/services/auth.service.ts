import axios from 'axios';
import { AuthResponse, LoginDto, OtpResponse, RequestOtpDto, VerifyOtpDto, RefreshTokenDto, RefreshTokenResponse, LogoutDto } from '../types/auth';

const API_BASE_URL = 'http://192.168.1.8:3000';
//const API_LOCAL_URL = 'http://localhost:3000';

// Helper to ensure phone number has +91 country code
function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
}

export const authService = {
  requestOtp: async (data: RequestOtpDto): Promise<OtpResponse> => {
    data.phoneNumber = normalizePhoneNumber(data.phoneNumber);
    const response = await axios.post<OtpResponse>(`${API_BASE_URL}/auth/request-otp`, data);
    return response.data;
  },

  verifyOtp: async (data: VerifyOtpDto): Promise<AuthResponse> => {
    data.phoneNumber = normalizePhoneNumber(data.phoneNumber);
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/verify-otp`, data);
    return response.data;
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    data.phoneNumber = normalizePhoneNumber(data.phoneNumber);
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, data);
    return response.data;
  },

  refreshToken: async (data: RefreshTokenDto): Promise<RefreshTokenResponse> => {
    const response = await axios.post<RefreshTokenResponse>(`${API_BASE_URL}/auth/refresh-token`, data);
    return response.data;
  },

  logout: async (data: LogoutDto): Promise<void> => {
    await axios.post(`${API_BASE_URL}/auth/logout`, data);
  },

  // Helper function to set the auth token for subsequent requests
  setAuthToken: (token: string) => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  // Helper function to remove the auth token
  removeAuthToken: () => {
    delete axios.defaults.headers.common['Authorization'];
  }
}; 
