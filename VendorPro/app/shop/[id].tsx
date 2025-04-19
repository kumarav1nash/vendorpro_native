import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useShop } from '../contexts/ShopContext';
import { useProducts } from '../contexts/ProductContext';
import { useSales } from '../contexts/SalesContext';
import { useSalesmen } from '../contexts/SalesmenContext';

// Tab components
import InventoryTab from '../components/shop/InventoryTab';
import SalesTab from '../components/shop/SalesTab';
import SalesmenTab from '../components/shop/SalesmenTab';

type TabType = 'inventory' | 'sales' | 'salesmen';

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { shops, setCurrentShop } = useShop();
  
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [isLoading, setIsLoading] = useState(true);
  
  // Find the shop by ID
  const shop = shops.find(s => s.id === id);
  
  useEffect(() => {
    if (shop) {
      // Set as current shop
      setCurrentShop(shop);
      setIsLoading(false);
    } else {
      // If shop not found, go back to shops list
      router.back();
    }
  }, [shop?.id]);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading shop details...</Text>
      </View>
    );
  }
  
  if (!shop) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Shop not found</Text>
      </View>
    );
  }
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: shop.name,
          headerBackTitle: 'Shops'
        }} 
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>{shop.name}</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.shopInfoCard}>
          <View style={styles.shopInfoRow}>
            <MaterialCommunityIcons name="map-marker" size={18} color="#666" />
            <Text style={styles.shopInfoText}>{shop.address}</Text>
          </View>
          <View style={styles.shopInfoRow}>
            <MaterialCommunityIcons name="phone" size={18} color="#666" />
            <Text style={styles.shopInfoText}>{shop.contactNumber}</Text>
          </View>
          {shop.email && (
            <View style={styles.shopInfoRow}>
              <MaterialCommunityIcons name="email" size={18} color="#666" />
              <Text style={styles.shopInfoText}>{shop.email}</Text>
            </View>
          )}
          {shop.gstin && (
            <View style={styles.shopInfoRow}>
              <MaterialCommunityIcons name="file-document" size={18} color="#666" />
              <Text style={styles.shopInfoText}>GSTIN: {shop.gstin}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'inventory' && styles.activeTab]}
            onPress={() => setActiveTab('inventory')}
          >
            <MaterialCommunityIcons 
              name="package-variant" 
              size={20} 
              color={activeTab === 'inventory' ? '#007AFF' : '#666'} 
            />
            <Text 
              style={[
                styles.tabText, 
                activeTab === 'inventory' && styles.activeTabText
              ]}
            >
              Inventory
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
            onPress={() => setActiveTab('sales')}
          >
            <MaterialCommunityIcons 
              name="cart" 
              size={20} 
              color={activeTab === 'sales' ? '#007AFF' : '#666'} 
            />
            <Text 
              style={[
                styles.tabText, 
                activeTab === 'sales' && styles.activeTabText
              ]}
            >
              Sales
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'salesmen' && styles.activeTab]}
            onPress={() => setActiveTab('salesmen')}
          >
            <MaterialCommunityIcons 
              name="account-group" 
              size={20} 
              color={activeTab === 'salesmen' ? '#007AFF' : '#666'} 
            />
            <Text 
              style={[
                styles.tabText, 
                activeTab === 'salesmen' && styles.activeTabText
              ]}
            >
              Salesmen
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.tabContent}>
          {activeTab === 'inventory' && <InventoryTab shopId={shop.id} />}
          {activeTab === 'sales' && <SalesTab shopId={shop.id} />}
          {activeTab === 'salesmen' && <SalesmenTab shopId={shop.id} />}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  shopInfoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  shopInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopInfoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
}); 