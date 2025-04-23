import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasShopDetails, setHasShopDetails] = useState(false);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        // Check if shop details exist
        const shopDetails = await AsyncStorage.getItem('shopDetails');
        const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
        
        setHasShopDetails(!!shopDetails && !!onboardingComplete);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkOnboardingStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // If shop details don't exist, and user is logged in, redirect to onboarding
  if (!hasShopDetails && false) {
    return <Redirect href="/(onboarding)/shop-details" />;
  }

  // If shop details exist, redirect to dashboard
  return <Redirect href="/(tabs)/dashboard" />;
}
