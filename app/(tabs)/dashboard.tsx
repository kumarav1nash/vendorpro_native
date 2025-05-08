import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useShop } from '../../src/contexts/ShopContext';
import { useUser } from '../../src/contexts/UserContext';
import { useUserProfile } from '../../src/contexts/UserProfileContext';
import { useInventory } from '../../src/contexts/InventoryContext';
import { useSales } from '../../src/contexts/SalesContext';
import { Shop } from '../../src/types/shop';

// Explicit KPI type
interface KPICard {
  title: string;
  value: number | string;
  icon: string;
  color: string;
}

export default function DashboardScreen() {
  const { user } = useUser();
  const { profile, fetchMyProfile } = useUserProfile();
  const { shop, shops, fetchAllShops, getShopSalesmen, fetchMyShops } = useShop();
  const { inventories, fetchInventoryByShopId } = useInventory();
  const { sales, fetchAllSales } = useSales();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpiData, setKpiData] = useState<KPICard[]>([]);
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shopDropdownVisible, setShopDropdownVisible] = useState(false);
  
  useEffect(() => {
    loadInitialData();
  }, []);
  
  useEffect(() => {
    if (selectedShop) {
      loadShopData(selectedShop.id);
    }
  }, [selectedShop]);
  
  useEffect(() => {
    if (!isLoading) {
      updateKPIData();
    }
  }, [isLoading, sales, inventories, salesmen, selectedShop]);
  
  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchMyShops();
      
      if (shops.length > 0) {
        setSelectedShop(shops[0]);
      }
      
      await fetchMyProfile();
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      setIsLoading(false);
    }
  };

  const loadShopData = async (shopId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Reset salesmen to avoid showing stale data
      setSalesmen([]);
      
      // Fetch new data for the selected shop
      const [_, __, salesmenData] = await Promise.all([
        fetchInventoryByShopId(shopId),
        fetchAllSales({shopId}),
        getShopSalesmen(shopId)
      ]);
      
      setSalesmen(salesmenData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load shop data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedShop) {
      await loadShopData(selectedShop.id);
    } else {
    await loadInitialData();
    }
    setRefreshing(false);
  };
  
  const updateKPIData = () => {
    if (!selectedShop) return;
    
    // Calculate metrics directly from current state
    const totalProducts = inventories.length;
    const totalSales = sales.length;
    const totalSalesmen = salesmen.length;
    
    // Calculate pending sales
    const pendingSales = sales.filter(sale => sale.status === 'pending').length;
    
    // Calculate low stock items
    const LOW_STOCK_THRESHOLD = 10;
    const lowStockItems = inventories.filter(item => 
      item.stockQuantity > 0 && item.stockQuantity <= LOW_STOCK_THRESHOLD
    ).length;
    
    // Calculate revenue
    let totalRevenue = 0;
    let todayRevenue = 0;
    const todayDate = new Date().toISOString().split('T')[0];
    
    sales.forEach(sale => {
      const saleAmount = typeof sale.totalAmount === 'string' 
        ? parseFloat(sale.totalAmount) 
        : sale.totalAmount;
      
      totalRevenue += saleAmount;
      
      const saleDate = new Date(sale.createdAt).toISOString().split('T')[0];
      if (saleDate === todayDate) {
        todayRevenue += saleAmount;
      }
    });
    
    const kpis: KPICard[] = [
      {
        title: 'Total Products',
        value: totalProducts,
        icon: 'package-variant',
        color: '#2196F3',
      },
      {
        title: 'Total Sales',
        value: totalSales,
        icon: 'cart',
        color: '#FF9800',
      },
      {
        title: 'Revenue Today',
        value: `₹${todayRevenue.toFixed(2)}`,
        icon: 'cash-register',
        color: '#4CAF50',
      },
      {
        title: 'Total Revenue',
        value: `₹${totalRevenue.toFixed(2)}`,
        icon: 'cash-multiple',
        color: '#009688',
      },
      {
        title: 'Low Stock Items',
        value: lowStockItems,
        icon: 'alert-circle-outline',
        color: '#F44336',
      },
      {
        title: 'Pending Sales',
        value: pendingSales,
        icon: 'clock-outline',
        color: '#FFC107',
      },
      {
        title: 'Salesmen',
        value: totalSalesmen,
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

  const handleShopSelect = (shop: Shop) => {
    // Reset state before setting the new shop
    setIsLoading(true);
    
    // Close dropdown
    setShopDropdownVisible(false);
    
    // Set selected shop which will trigger loadShopData via useEffect
    setSelectedShop(shop);
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

        {selectedShop && (
          <TouchableOpacity 
            style={styles.currentShopButton}
            onPress={() => setShopDropdownVisible(true)}
          >
            <Text style={styles.currentShopText} numberOfLines={2}>
              {selectedShop.shopName}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}

        {/* Shop Selector Dropdown */}
        <Modal
          visible={shopDropdownVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShopDropdownVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={() => setShopDropdownVisible(false)}
          >
            <View style={styles.dropdownContainer}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Select Shop</Text>
                <TouchableOpacity onPress={() => setShopDropdownVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={shops}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.shopItem,
                      selectedShop?.id === item.id && styles.selectedShopItem
                    ]}
                    onPress={() => handleShopSelect(item)}
                  >
                    <MaterialCommunityIcons 
                      name="store" 
                      size={24} 
                      color={selectedShop?.id === item.id ? "#007AFF" : "#666"} 
                    />
                    <Text 
                      style={[
                        styles.shopItemText,
                        selectedShop?.id === item.id && styles.selectedShopItemText
                      ]}
                    >
                      {item.shopName}
                    </Text>
                    {selectedShop?.id === item.id && (
                      <MaterialCommunityIcons name="check" size={24} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
      
      <View style={styles.kpiContainer}>
        {kpiData.map((kpi, index) => (
          <View key={index} style={styles.kpiCard}>
            <View style={[styles.iconContainer, { backgroundColor: kpi.color }]}>
              <MaterialCommunityIcons name={kpi.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={18} color="#fff" />
            </View>
            <View style={styles.kpiTextContainer}>
              <Text style={styles.kpiValue} numberOfLines={1}>{kpi.value}</Text>
              <Text style={styles.kpiTitle} numberOfLines={1}>{kpi.title}</Text>
            </View>
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
        {selectedShop && (
            <TouchableOpacity 
              style={styles.actionButton}
            onPress={() => navigateToShop(selectedShop.id)}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentShopText: {
    fontSize: 12,
    color: '#007AFF',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  shopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedShopItem: {
    backgroundColor: '#f0f7ff',
  },
  shopItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  selectedShopItemText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    width: '48%',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  kpiTextContainer: {
    flex: 1,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  kpiTitle: {
    fontSize: 12,
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