import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useShop } from '../contexts/ShopContext';

export default function InventoryRedirectScreen() {
  const { currentShop } = useShop();
  
  useEffect(() => {
    const redirectToShop = async () => {
      if (currentShop) {
        // If there's a current shop, redirect to its inventory tab
        router.replace(`/shop/${currentShop.id}?tab=inventory`);
      } else {
        // Otherwise redirect to shops list
        router.replace('/(tabs)/shops');
      }
    };
    
    redirectToShop();
  }, [currentShop]);
  
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