import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../src/contexts/AuthContext';
import { UserRole } from '../src/types/user';

// Define valid redirect paths for proper typing
type ValidRedirectPath = 
  | '/(auth)/login' 
  | '/(salesman)/dashboard' 
  | '/(tabs)/dashboard' 
  | '/(onboarding)/shop-details';

export default function Index() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<ValidRedirectPath | null>(null);

  useEffect(() => {
    async function checkAuthStatus() {
      try {
        // Check if user is authenticated
        if (!isAuthenticated || !user) {
          setRedirectPath('/(auth)/login');
          return;
        }

        // Determine which dashboard to show based on user role
        if (user.role === 'SALESMAN') {
          setRedirectPath('/(salesman)/dashboard');
          return;
        }

        if (user.role === 'SHOP_OWNER') {
          // Direct redirect to dashboard without checking onboarding status
          setRedirectPath('/(tabs)/dashboard');
          return;
        }
        
        // Fallback if role is not recognized
        setRedirectPath('/(auth)/login');
      } catch (error) {
        console.error('Error checking auth status:', error);
        setRedirectPath('/(auth)/login');
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      checkAuthStatus();
    }
  }, [isAuthenticated, user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 20, color: '#666' }}>Redirecting to appropriate dashboard...</Text>
      </View>
    );
  }

  // Redirect to the determined path
  if (redirectPath) {
    return <Redirect href={redirectPath} />;
  }

  // Fallback redirect if something goes wrong
  return <Redirect href="/(auth)/login" />;
}
