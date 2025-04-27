import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useShop } from '../../src/contexts/ShopContext';
import { useUser } from '../../src/contexts/UserContext';
import { useUserProfile } from '../../src/contexts/UserProfileContext';
import { useInventory } from '../../src/contexts/InventoryContext';
import { useSales } from '../../src/contexts/SalesContext';

// Explicit KPI type
interface KPICard {
  title: string;
  value: number;
  icon: string;
  color: string;
}

export default function DashboardScreen() {
  const { user } = useUser();
  const { profile, fetchMyProfile } = useUserProfile();
  const { shop, fetchAllShops, getShopSalesmen } = useShop();
  const { inventories, fetchInventoryByShopId } = useInventory();
  const { sales, fetchAllSales } = useSales();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpiData, setKpiData] = useState<KPICard[]>([]);
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (!isLoading) {
      updateKPIData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, sales, inventories, salesmen, shop]);
  
  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const shopId = shop?.id;
      if (!shopId) {
        throw new Error('Shop ID is undefined');
      }
      await Promise.all([
        fetchMyProfile(),
        fetchAllShops(),
        fetchInventoryByShopId(shopId),
        fetchAllSales(),
      ]);
      const salesmenData = await getShopSalesmen(shopId);
      setSalesmen(salesmenData);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      setIsLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };
  
  const updateKPIData = () => {
    const shopId = shop?.id;
    const kpis: KPICard[] = [
      {
        title: 'Total Products',
        value: shopId ? inventories.length : 0,
        icon: 'package-variant',
        color: '#2196F3',
      },
      {
        title: 'Total Sales',
        value: shopId
          ? sales.filter((s: any) => s.shopId === shopId).length
          : sales.length,
        icon: 'cart',
        color: '#FF9800',
      },
      {
        title: 'Salesmen',
        value: salesmen.length,
        icon: 'account-group',
        color: '#9C27B0',
      },
    ];
    setKpiData(kpis);
  };

  const navigateToShop = (shopId?: string) => {
    if (shopId) {
      router.push(`/shop/${shopId}`);
    } else {
      router.push('/(tabs)/shops');
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{error}</Text>
      </View>
    );
  }

  // Greeting logic: prefer profile, then user, then fallback
  const greetingName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : user?.email || 'Shop Owner';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{greetingName}</Text>
        </View>
        {shop && (
          <TouchableOpacity 
            style={styles.currentShopButton}
            onPress={() => navigateToShop(shop.id)}
          >
            <Text style={styles.currentShopText} numberOfLines={1}>
              {shop.shopName}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.kpiContainer}>
        {kpiData.map((kpi, index) => (
          <View key={index} style={styles.kpiCard}>
            <View style={[styles.iconContainer, { backgroundColor: kpi.color }]}>
              <MaterialCommunityIcons name={kpi.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={24} color="#fff" />
            </View>
            <Text style={styles.kpiValue}>{kpi.value}</Text>
            <Text style={styles.kpiTitle}>{kpi.title}</Text>
          </View>
        ))}
      </View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigateToShop()}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#2196F3' }]}>
            <MaterialCommunityIcons name="store" size={24} color="#fff" />
          </View>
          <Text style={styles.actionText}>Manage Shops</Text>
        </TouchableOpacity>
        {shop && (
            <TouchableOpacity 
              style={styles.actionButton}
            onPress={() => navigateToShop(shop.id)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
                <MaterialCommunityIcons name="view-dashboard" size={24} color="#fff" />
              </View>
              <Text style={styles.actionText}>Shop Dashboard</Text>
            </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#9C27B0' }]}>
            <MaterialCommunityIcons name="account-circle" size={24} color="#fff" />
          </View>
          <Text style={styles.actionText}>My Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  currentShopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 150,
  },
  currentShopText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 4,
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  kpiTitle: {
    fontSize: 14,
    color: '#666',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  quickActions: {
    padding: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
}); 