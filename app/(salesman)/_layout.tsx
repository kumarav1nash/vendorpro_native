import { Stack } from 'expo-router';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

function useSalesmanProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await SecureStore.getItemAsync('salesmanAuthenticated');
      const isAuthSegment = segments[0] === '(auth)';
      
      if (isAuthenticated !== 'true' && segments[0] === '(salesman)') {
        // Redirect to the salesman login page if not authenticated
        router.replace('/(auth)/salesman-login');
      } else if (isAuthenticated === 'true' && segments[0] === '(auth)' && segments[1] === 'salesman-login') {
        // Redirect to the salesman dashboard if already authenticated and on the login page
        router.replace('/(salesman)/dashboard');
      }
    };

    checkAuth();
  }, [segments]);
}

export default function SalesmanLayout() {
  useSalesmanProtectedRoute();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    />
  );
} 