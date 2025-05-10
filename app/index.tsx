import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text, Platform } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import Constants from 'expo-constants';

// Define valid redirect paths for proper typing
type ValidRedirectPath = 
  | '/(auth)/login' 
  | '/(salesman)/dashboard' 
  | '/(tabs)/dashboard';

export default function Index() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<ValidRedirectPath | null>(null);

  // Log initial mount
  useEffect(() => {
    console.log('Index screen mounted');
    console.log('Platform:', Platform.OS);
    console.log('API URL:', Constants.expoConfig?.extra?.apiUrl);
  }, []);

  useEffect(() => {
    async function checkAuthStatus() {
      try {
        // Display API URL for debugging
        console.log('Checking auth status...');
        console.log('Auth state:', { 
          isAuthenticated, 
          user: user ? { id: user.id, role: user.role } : null, 
          authLoading 
        });

        // If still loading auth state, don't proceed
        if (authLoading) {
          console.log('Auth still loading, waiting...');
          return;
        }

        // If not authenticated, redirect to login
        if (!isAuthenticated) {
          console.log('Not authenticated, redirecting to login');
          setRedirectPath('/(auth)/login');
          setIsLoading(false);
          return;
        }

        // If authenticated but no user (shouldn't happen), redirect to login
        if (!user) {
          console.log('No user data, redirecting to login');
          setRedirectPath('/(auth)/login');
          setIsLoading(false);
          return;
        }

        // Determine which dashboard to show based on user role
        if (user.role === 'SALESMAN') {
          console.log('Redirecting to salesman dashboard');
          setRedirectPath('/(salesman)/dashboard');
          setIsLoading(false);
          return;
        }

        if (user.role === 'SHOP_OWNER') {
          console.log('Redirecting to shop owner dashboard');
          setRedirectPath('/(tabs)/dashboard');
          setIsLoading(false);
          return;
        }

        // Fallback if role is not recognized
        console.log('Unknown role, redirecting to login');
        setRedirectPath('/(auth)/login');
      } catch (error) {
        console.error('Error checking auth status:', error);
        setRedirectPath('/(auth)/login');
      } finally {
        setIsLoading(false);
      }
    }

    checkAuthStatus();
  }, [isAuthenticated, authLoading, user]);

  // Show loading state while checking authentication
  if (isLoading || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 20, color: '#666' }}>Checking your account status...</Text>
      </View>
    );
  }

  // Redirect to the determined path
  if (redirectPath) {
    console.log('Redirecting to:', redirectPath);
    return <Redirect href={redirectPath} />;
  }

  // Fallback redirect if something goes wrong
  console.log('Fallback redirect to login');
  return <Redirect href="/(auth)/login" />;
}
