import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User, LoginDto, RequestOtpDto, VerifyOtpDto } from '../types/auth';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginDto) => Promise<void>;
  requestOtp: (data: RequestOtpDto) => Promise<void>;
  verifyOtp: (data: VerifyOtpDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored auth token on mount
    const loadStoredAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          authService.setAuthToken(token);
          const storedUser = await SecureStore.getItemAsync('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (err) {
        console.error('Error loading stored auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const handleAuthSuccess = async (token: string, refreshToken: string, user: User) => {
    try {
      await SecureStore.setItemAsync('accessToken', token);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      authService.setAuthToken(token);
      setUser(user);
      setError(null);
    } catch (err) {
      console.error('Error storing auth data:', err);
      throw err;
    }
  };

  const login = async (data: LoginDto) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.login(data);
      await handleAuthSuccess(response.accessToken, response.refreshToken, response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const requestOtp = async (data: RequestOtpDto) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.requestOtp(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (data: VerifyOtpDto) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.verifyOtp(data);
      await handleAuthSuccess(response.accessToken, response.refreshToken, response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        await authService.logout({ refreshToken });
      }
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('salesmanAuthenticated');
      authService.removeAuthToken();
      setUser(null);
    } catch (err) {
      console.error('Error during logout:', err);
      throw err;
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) throw new Error('No refresh token found');
      const response = await authService.refreshToken({ refreshToken });
      await handleAuthSuccess(response.token, response.refreshToken, response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Token refresh failed');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={useMemo(() => ({
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        requestOtp,
        verifyOtp,
        logout,
        refreshAccessToken,
      }), [user, isLoading, error, login, requestOtp, verifyOtp, logout, refreshAccessToken])}
    >
      {children}
    </AuthContext.Provider>
  );
}; 