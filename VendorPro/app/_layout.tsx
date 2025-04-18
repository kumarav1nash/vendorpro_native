import { Stack } from "expo-router";
import "./globals.css";
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
      
      if (!userSession && isAuth !== '(auth)') {
        // Redirect to the login page if not authenticated
        router.replace('/login');
      } else if (userSession && isAuth === '(auth)') {
        // Redirect to the tabs if authenticated
        router.replace('/(tabs)/dashboard');
      }
    };

    checkAuth();
  }, [segments]);
}

export default function RootLayout() {
  useProtectedRoute();

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(onboarding)" />
      </Stack>
    </SafeAreaProvider>
  );
}
