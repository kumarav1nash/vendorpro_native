import React, { useEffect, useState, useRef } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../src/contexts/AuthContext';
import { useShop } from '../src/contexts/ShopContext';
import { useUserProfile } from '../src/contexts/UserProfileContext';
import { UserRole } from '../src/types/user';
import Constants from 'expo-constants';

// Define valid redirect paths for proper typing
type ValidRedirectPath = 
  | '/(auth)/login' 
  | '/(salesman)/dashboard' 
  | '/(tabs)/dashboard' 
  | '/(onboarding)/profile-setup'
  | '/(onboarding)/shop-details';

export default function Index() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { fetchMyShops, shops, isLoading: shopLoading } = useShop();
  const { fetchMyProfile, profile, loading: profileLoading } = useUserProfile();
  const [isLoading, setIsLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<ValidRedirectPath | null>(null);
  
  // Add a ref to track if we've already tried to fetch data
  const hasLoadedData = useRef(false);

  // This effect runs only when authentication status changes
  useEffect(() => {
    // Skip if still loading auth or if we already handled this auth state
    if (authLoading || hasLoadedData.current) return;

    async function checkAuthStatus() {
      // Set flag to prevent duplicate loading
      hasLoadedData.current = true;
      
      try {
        // Display API URL for debugging
        console.log('apiUrl picked up', Constants.expoConfig?.extra?.apiUrl);
        
        // Check if user is authenticated
        if (!isAuthenticated || !user) {
          setRedirectPath('/(auth)/login');
          setIsLoading(false);
          return;
        }

        // Determine which dashboard to show based on user role
        if (user.role === 'SALESMAN') {
          setRedirectPath('/(salesman)/dashboard');
          setIsLoading(false);
          return;
        }

        if (user.role === 'SHOP_OWNER') {
          console.log('Loading profile and shops data...');
          
          // Load both profile and shops data in parallel
          const [profileResult, shopsResult] = await Promise.all([
            fetchMyProfile(),
            fetchMyShops()
          ]);
          
          console.log('Data loaded:', {
            hasProfile: !!profileResult,
            shopCount: shopsResult?.length || 0
          });
          
          // Determine where to redirect based on loaded data
          if (!profile) {
            console.log('No profile found, redirecting to profile setup');
            setRedirectPath('/(onboarding)/profile-setup');
          } else if (!shops || shops.length === 0) {
            console.log('No shops found, redirecting to shop setup');
            setRedirectPath('/(onboarding)/shop-details');
          } else {
            console.log('Profile and shops found, redirecting to dashboard');
            setRedirectPath('/(tabs)/dashboard');
          }
        } else {
          // Fallback if role is not recognized
          setRedirectPath('/(auth)/login');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setRedirectPath('/(auth)/login');
      } finally {
        setIsLoading(false);
      }
    }

    if (isAuthenticated !== null) {
      checkAuthStatus();
    }
  }, [isAuthenticated, authLoading, user?.role]);

  // Effect to detect final loading state
  useEffect(() => {
    // All loading has finished
    if (!isLoading && !authLoading && !profileLoading && !shopLoading && !redirectPath) {
      // As a fallback, if we somehow got here without a redirect path
      setRedirectPath('/(auth)/login');
    }
  }, [isLoading, authLoading, profileLoading, shopLoading, redirectPath]);

  if (isLoading || authLoading || profileLoading || shopLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 20, color: '#666' }}>Checking your account status...</Text>
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
