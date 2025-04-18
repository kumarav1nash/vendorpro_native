import { Stack } from "expo-router";
import "./globals.css";
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define session context type
type User = {
  name: string;
  mobile: string;
};

export const unstable_settings = {
  initialRouteName: '(auth)/register',
};

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const userSession = await AsyncStorage.getItem('user');
      const isAuth = segments[0];
      
      if (!userSession && isAuth !== '(auth)') {
        // Redirect to the sign-in page if not authenticated
        router.replace('/register');
      } else if (userSession && isAuth === '(auth)') {
        // Redirect to the dashboard if authenticated
        router.replace('/dashboard');
      }
    };

    checkAuth();
  }, [segments]);
}

export default function RootLayout() {
  useProtectedRoute();
  return <Slot />;
}
