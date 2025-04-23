import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          authService.setAuthToken(token);
          const storedUser = await AsyncStorage.getItem('user');
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

  const handleAuthSuccess = async (token: string, user: User) => {
    try {
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
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
      await handleAuthSuccess(response.token, response.user);
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
      console.log('response', response);
      await handleAuthSuccess(response.token, response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      authService.removeAuthToken();
      setUser(null);
    } catch (err) {
      console.error('Error during logout:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        requestOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 