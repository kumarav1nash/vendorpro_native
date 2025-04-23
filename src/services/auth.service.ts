import axios from 'axios';
import { AuthResponse, LoginDto, OtpResponse, RequestOtpDto, VerifyOtpDto } from '../types/auth';

const API_BASE_URL = 'http://192.168.1.8:3000';
//const API_LOCAL_URL = 'http://localhost:3000';

export const authService = {
  requestOtp: async (data: RequestOtpDto): Promise<OtpResponse> => {
     //add +91 to the phone number if it doesn't have it, set the phone number to the data.phoneNumber
     const phoneNumber = data.phoneNumber.startsWith('+91') ? data.phoneNumber : `+91${data.phoneNumber}`;
     data.phoneNumber = phoneNumber;
    const response = await axios.post<OtpResponse>(`${API_BASE_URL}/auth/request-otp`, data);
    return response.data;
  },

  verifyOtp: async (data: VerifyOtpDto): Promise<AuthResponse> => {
    const phoneNumber = data.phoneNumber.startsWith('+91') ? data.phoneNumber : `+91${data.phoneNumber}`;
     data.phoneNumber = phoneNumber;
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/verify-otp`, data);
    return response.data;
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
   
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, data);
    return response.data;
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