import React, { useState, useEffect, useRef } from 'react';
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
  const { shops, isLoading: shopsLoading, fetchMyShops, getShopSalesmen } = useShop();
  const { inventories, fetchInventoryByShopId } = useInventory();
  const { sales, fetchAllSales } = useSales();
  const { profile, fetchMyProfile } = useUserProfile();

  const [refreshing, setRefreshing] = useState(false);
  const [kpiData, setKpiData] = useState<KPICard[]>([]);
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shopDropdownVisible, setShopDropdownVisible] = useState(false);
  const [shopDataLoading, setShopDataLoading] = useState(false);
  
  // Track if data has been fetched at least once
  const initialDataFetched = useRef(false);
  // Track last loaded shop for shop data
  const lastLoadedShopId = useRef<string | null>(null);
  
  // Trigger initial data fetching on mount
  useEffect(() => {
    if (initialDataFetched.current) return;
    
    const loadInitialData = async () => {
      console.log('Initial data loading started');
      
      try {
        // Always fetch fresh data on first load
        const shopsData = await fetchMyShops();
        // Also fetch user profile
        await fetchMyProfile();
        
        console.log('Initial data loaded:', {
          shopsCount: shopsData?.length || 0
        });
        
        initialDataFetched.current = true;
      } catch (err) {
        console.error('Error during initial data loading:', err);
      }
    };
    
    loadInitialData();
  }, [fetchMyShops, fetchMyProfile]);
  
  // Handle redirections when profile or shops data changes
  useEffect(() => {
    // Skip if still loading from contexts
    if (shopsLoading) return;
    
    // Skip if we haven't attempted to fetch data yet
    if (!initialDataFetched.current) return;
    
    console.log('Checking onboarding requirements:', {
      shopsCount: shops?.length || 0
    });
    
    
    if (!shops || shops.length === 0) {
      console.log('No shops found, redirecting to shop setup');
      router.replace('/(onboarding)/shop-details');
      return;
    }
    
    // If we have both profile and shops, select the first shop
    if (!selectedShop && shops.length > 0) {
      setSelectedShop(shops[0]);
    }
  }, [shops, shopsLoading, selectedShop]);

  // When selectedShop changes, load its data if not already loaded
  useEffect(() => {
    if (!selectedShop) return;
    if (shopsLoading) return;
    if (lastLoadedShopId.current === selectedShop.id) return;
    
    lastLoadedShopId.current = selectedShop.id;
    setShopDataLoading(true);
    setError(null);
    
    Promise.all([
      fetchInventoryByShopId(selectedShop.id),
      fetchAllSales({ shopId: selectedShop.id }),
      getShopSalesmen(selectedShop.id)
    ])
    .then(([_, __, salesmenList]) => {
      setSalesmen(salesmenList || []);
    })
    .catch(e => {
      setError(e.message || 'Error loading shop data');
      console.error('Error loading shop data:', e);
    })
    .finally(() => {
      setShopDataLoading(false);
    });
  }, [selectedShop, fetchInventoryByShopId, fetchAllSales, getShopSalesmen, shopsLoading]);

  // Update KPIs when data changes
  useEffect(() => {
    if (shopDataLoading || !selectedShop) return;
    updateKPIData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopDataLoading, inventories, sales, salesmen, selectedShop]);

  // Debug log of current state
  useEffect(() => {
    console.log('Dashboard state:', {
      shops: shops?.length,
      shopsLoading,
      shopDataLoading,
      initialDataFetched: initialDataFetched.current,
      selectedShopId: selectedShop?.id
    });
  }, [shops, shopsLoading, shopDataLoading, selectedShop]);
  
  const updateKPIData = () => {
    if (!selectedShop) return;
    const totalProducts = inventories?.length || 0;
    const totalSales = sales?.length || 0;
    const totalSalesmen = salesmen?.length || 0;
    const pendingSales = sales.filter(sale => sale.status === 'pending').length;
    const LOW_STOCK_THRESHOLD = 10;
    const lowStockItems = inventories.filter(item => 
      item.stockQuantity > 0 && item.stockQuantity <= LOW_STOCK_THRESHOLD
    ).length;
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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Force reload contexts
      await fetchMyShops();
      
      if (selectedShop) {
        lastLoadedShopId.current = null; // force reload
        await Promise.all([
          fetchInventoryByShopId(selectedShop.id),
          fetchAllSales({ shopId: selectedShop.id }),
          getShopSalesmen(selectedShop.id),
        ]);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const navigateToShop = (shopId?: string) => {
    if (shopId) {
      router.push(`/shop/${shopId}`);
    } else {
      router.push('/(tabs)/shops');
    }
  };

  const handleShopSelect = (shop: Shop) => {
    setShopDropdownVisible(false);
    setSelectedShop(shop);
  };
  
  const handleQuickSale = () => {
    if (selectedShop) {
      // Navigate to shop and open sales tab with param to auto-open create sale modal
      router.push(`/shop/${selectedShop.id}?tab=sales&action=createSale`);
    }
  };
  
  // Show loading when any context is loading or we're loading shop data
  const isLoading = shopsLoading || shopDataLoading;
  
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
  console.log('Profile:', profile);
  const greetingName = profile?.firstName || profile?.lastName || user?.email || 'Shop Owner';
  
  return (
    <View style={styles.mainContainer}>
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
          {selectedShop && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleQuickSale}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FF9800' }]}>
                <MaterialCommunityIcons name="point-of-sale" size={24} color="#fff" />
              </View>
              <Text style={styles.actionText}>Quick Sale</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      
      {/* Floating Action Button for Quick Sale */}
      {selectedShop && (
        <TouchableOpacity 
          style={styles.quickSaleFab}
          onPress={handleQuickSale}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="point-of-sale" size={26} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
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
  quickSaleFab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
}); 