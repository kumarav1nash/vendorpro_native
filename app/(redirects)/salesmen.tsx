import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useShop } from '../../src/contexts/ShopContext';

export default function SalesmenRedirectScreen() {
  const { shop } = useShop();
  
  useEffect(() => {
    const redirectToShop = async () => {
      if (shop) {
        // If there's a current shop, redirect to its salesmen tab
        router.replace(`/shop/${shop.id}?tab=salesmen`);
      } else {
        // Otherwise redirect to shops list
        router.replace('/(tabs)/shops');
      }
    };
    
    redirectToShop();
  }, [shop]);
  
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
}); 