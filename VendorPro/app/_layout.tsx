import { Stack } from "expo-router";
import "./globals.css";
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ProductProvider } from './contexts/ProductContext';
import { SalesProvider } from './contexts/SalesContext';
import { SalesmenProvider } from './contexts/SalesmenContext';

// Define session context type
type User = {
  name: string;
  mobile: string;
};

export const unstable_settings = {
  initialRouteName: '(auth)/login',
};

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const userSession = await AsyncStorage.getItem('user');
      const isAuth = segments[0];
      
      // Don't interfere with salesman routes
      if (isAuth === '(salesman)') {
        return;
      }
      
      if (!userSession && isAuth !== '(auth)') {
        // Redirect to the login page if not authenticated
        router.replace('/login');
      } else if (userSession && isAuth === '(auth)' && segments[1] !== 'salesman-login') {
        // Redirect to the tabs if authenticated - but only if not on salesman login
        router.replace('/(tabs)/dashboard');
      }
    };

    checkAuth();
  }, [segments]);
}

export default function RootLayout() {
  useProtectedRoute();

  return (
    <ProductProvider>
      <SalesProvider>
        <SalesmenProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(salesman)" />
          </Stack>
        </SalesmenProvider>
      </SalesProvider>
    </ProductProvider>
  );
}
