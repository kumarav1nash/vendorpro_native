import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { useAuth } from '../../src/contexts/AuthContext';
import { useShop } from '../../src/contexts/ShopContext';
import { useInventory } from '../../src/contexts/InventoryContext';
import { useSales } from '../../src/contexts/SalesContext';
import { useCommission } from '../../src/contexts/CommissionContext';
import { useUser } from '../../src/contexts/UserContext';
import { useUserProfile } from '../../src/contexts/UserProfileContext';
import { Inventory } from '../../src/types/inventory';
import { Sale } from '../../src/types/sales';
import { Commission } from '../../src/types/commission';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { shop, getShopBySalesmanId } = useShop();
  const { sales, fetchAllSales, createSale } = useSales();
  const { inventories, fetchInventoryByShopId } = useInventory();
  const { commissions, fetchCommissionsBySalesman } = useCommission();
  const { profile, fetchProfileByUserId } = useUserProfile();

  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Inventory | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [modalVisible, setModalVisible] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userSales, setUserSales] = useState<Sale[]>([]);
  const [userCommissions, setUserCommissions] = useState<Commission[]>([]);
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    pendingSales: 0,
    totalCommission: 0,
    pendingCommission: 0
  });

  // Animations
  const scrollY = useSharedValue(0);
  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - scrollY.value / 100,
    };
  });

  // Filter products based on search
  const filteredProducts = inventories.filter(product => {
    if (!searchTerm) return true;
    return product.productName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Load data
  useEffect(() => {
    if (user?.id && shop?.id) {
    loadData();
    } else {
      setLoading(false);
    }
  }, [user?.id, shop?.id]);

  // Calculate metrics when data changes
  useEffect(() => {
    if (userSales.length > 0 || userCommissions.length > 0) {
      calculateMetrics();
    }
  }, [userSales, userCommissions]);

  const loadData = async () => {
    if (!user?.id) {
      console.log("Cannot load data: User ID is missing");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // First, get the shop for this salesman
      try {
        await getShopBySalesmanId(user.id);
      } catch (shopError: any) {
        if (shopError?.response?.status === 404) {
          console.log('No shop found for salesman:', user.id);
        } else {
          console.error('Error fetching shop:', shopError?.message || shopError);
        }
      }
      
      if (!shop?.id) {
        console.log("Cannot load shop-specific data: Shop ID is missing");
        setLoading(false);
        return;
      }
      
      // Load all data in parallel
      try {
        await fetchAllSales();
      } catch (salesError: any) {
        if (salesError?.response?.status === 404) {
          console.log('No sales found');
        } else {
          console.error('Error fetching sales:', salesError?.message || salesError);
        }
      }
      
      try {
        await fetchInventoryByShopId(shop.id);
      } catch (inventoryError: any) {
        if (inventoryError?.response?.status === 404) {
          console.log('No inventory found for shop:', shop.id);
        } else {
          console.error('Error fetching inventory:', inventoryError?.message || inventoryError);
        }
      }
      
      try {
        await fetchCommissionsBySalesman(user.id);
      } catch (commissionsError: any) {
        if (commissionsError?.response?.status === 404) {
          console.log('No commissions found for salesman:', user.id);
        } else {
          console.error('Error fetching commissions:', commissionsError?.message || commissionsError);
        }
      }
      
      // Load user profile with graceful error handling
      if (user.id) {
        try {
          await fetchProfileByUserId(user.id);
        } catch (profileError: any) {
          if (profileError?.response?.status === 404) {
            console.log('User profile not found for:', user.id);
          } else {
            console.error('Error fetching user profile:', profileError?.message || profileError);
          }
        }
      }
      
      // Set filtered data from context after all fetches complete
      if (sales) {
        const filteredSales = sales.filter(sale => sale.salesmanId === user.id);
        setUserSales(filteredSales);
        console.log(`Filtered ${filteredSales.length} sales for user`);
      }
      
      if (commissions) {
        setUserCommissions(commissions);
        console.log(`Set ${commissions.length} commissions for user`);
      }
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error?.message || error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateMetrics = useCallback(() => {
    if (!userSales.length && !userCommissions.length) return;
    
    // Calculate total for approved sales
    const totalSalesAmount = userSales
      .filter(sale => sale.status === 'approved')
      .reduce((total, sale) => total + (sale.salePrice * sale.quantity), 0);
    
    // Count pending sales
    const pendingSalesCount = userSales
      .filter(sale => sale.status === 'pending')
      .length;
    
    // Calculate paid commissions
    const totalPaidCommission = userCommissions
      .filter(comm => comm.isPaid === true)
      .reduce((total, comm) => total + comm.amount, 0);
    
    // Calculate pending commissions
    const totalPendingCommission = userCommissions
      .filter(comm => !comm.isPaid)
      .reduce((total, comm) => total + comm.amount, 0);
    
    setMetrics({
      totalSales: totalSalesAmount,
      pendingSales: pendingSalesCount,
      totalCommission: totalPaidCommission,
      pendingCommission: totalPendingCommission
    });
  }, [userSales, userCommissions]);

  const handleProductSelect = (product: Inventory) => {
    setSelectedProduct(product);
    setCustomPrice(product.sellingPrice.toString());
    setQuantity('1');
    setModalVisible(true);
  };
  
  const handleCreateSale = async () => {
    if (!selectedProduct || !user?.id || !shop?.id) return;
    
    const qtyNum = parseInt(quantity);
    const priceNum = parseFloat(customPrice);
    
    if (isNaN(qtyNum) || qtyNum <= 0) {
      Alert.alert('Invalid quantity', 'Please enter a valid quantity');
      return;
    }
    
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid price', 'Please enter a valid price');
      return;
    }
    
    if (qtyNum > selectedProduct.stockQuantity) {
      Alert.alert('Insufficient stock', `Only ${selectedProduct.stockQuantity} units available`);
      return;
    }
    
    setLoading(true);
    try {
      await createSale({
        productId: selectedProduct.id,
        salesmanId: user.id,
        shopId: shop.id,
        quantity: qtyNum,
        salePrice: priceNum,
      });
      
      setModalVisible(false);
      loadData();
      Alert.alert('Success', 'Sale created successfully');
            } catch (error) {
      console.error('Failed to create sale:', error);
      Alert.alert('Error', 'Failed to create sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Use user profile from context
  const userName = profile 
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() 
    : user?.email || 'Salesman';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Dashboard',
        }}
      />

      {/* Dashboard Header */}
        <View style={styles.header}>
        <Animated.View style={[styles.welcomeContainer, headerStyle]}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <MaterialCommunityIcons name="account-circle" size={40} color="#007bff" />
          </TouchableOpacity>
        </Animated.View>
        </View>

      {/* Dashboard Content */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          scrollY.value = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {/* Sales Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, styles.primaryMetricCard]}>
              <Text style={styles.metricValue}>₹{metrics.totalSales.toFixed(2)}</Text>
              <Text style={styles.metricLabel}>Total Sales</Text>
          </View>
            <View style={[styles.metricCard, styles.warningMetricCard]}>
              <Text style={styles.metricValue}>{metrics.pendingSales}</Text>
              <Text style={styles.metricLabel}>Pending Sales</Text>
          </View>
          </View>
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, styles.successMetricCard]}>
              <Text style={styles.metricValue}>₹{metrics.totalCommission.toFixed(2)}</Text>
              <Text style={styles.metricLabel}>Earned Commission</Text>
            </View>
            <View style={[styles.metricCard, styles.infoMetricCard]}>
              <Text style={styles.metricValue}>₹{metrics.pendingCommission.toFixed(2)}</Text>
              <Text style={styles.metricLabel}>Pending Commission</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(salesman)/sales-history')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                <MaterialCommunityIcons name="receipt" size={24} color="#1976D2" />
              </View>
              <Text style={styles.actionText}>Sales History</Text>
        </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(salesman)/commissions-history')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                <MaterialCommunityIcons name="cash-multiple" size={24} color="#388E3C" />
              </View>
              <Text style={styles.actionText}>Commissions</Text>
            </TouchableOpacity>
          </View>
          </View>
          
        {/* Products */}
        <View style={styles.productsContainer}>
          <Text style={styles.sectionTitle}>Available Products</Text>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {searchTerm ? (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#64748B" />
              </TouchableOpacity>
            ) : null}
            </View>
          
          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {filteredProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.productCard,
                    product.stockQuantity === 0 && styles.disabledProductCard
                  ]}
                  onPress={() => product.stockQuantity > 0 && handleProductSelect(product)}
                  disabled={product.stockQuantity === 0}
                >
                  <View style={styles.productImageContainer}>
                    {product.productImageUrl ? (
                      <Image
                        source={{ uri: product.productImageUrl }}
                        style={styles.productImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <MaterialCommunityIcons name="package-variant" size={32} color="#9CA3AF" />
                      </View>
                    )}
                    {product.stockQuantity === 0 && (
                      <View style={styles.outOfStockOverlay}>
                        <Text style={styles.outOfStockText}>Out of Stock</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {product.productName}
                      </Text>
                    <Text style={styles.productPrice}>₹{product.sellingPrice.toFixed(2)}</Text>
                    <View style={styles.stockContainer}>
                      <Text
                        style={[
                          styles.stockText,
                          product.stockQuantity === 0
                            ? styles.outOfStock
                            : product.stockQuantity < 5
                            ? styles.lowStock
                            : styles.inStock
                        ]}
                      >
                        {product.stockQuantity === 0
                          ? 'Out of stock'
                          : product.stockQuantity < 5
                          ? `Low: ${product.stockQuantity} left`
                          : `In stock: ${product.stockQuantity}`}
                      </Text>
                    </View>
                      </View>
                </TouchableOpacity>
              ))}
                    </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="package-variant" size={60} color="#CBD5E1" />
              <Text style={styles.emptyStateTitle}>No products found</Text>
              <Text style={styles.emptyStateDescription}>
                {searchTerm
                  ? "No products match your search criteria."
                  : "No products are available in this shop."}
              </Text>
                  </View>
          )}
        </View>
      </ScrollView>

      {/* Create Sale Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <BlurView intensity={Platform.OS === 'ios' ? 50 : 100} style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Sale</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {selectedProduct && (
              <View style={styles.modalBody}>
                <View style={styles.selectedProductContainer}>
                  <View style={styles.selectedProductImageContainer}>
                    {selectedProduct.productImageUrl ? (
                      <Image
                        source={{ uri: selectedProduct.productImageUrl }}
                        style={styles.selectedProductImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.selectedProductImagePlaceholder}>
                        <MaterialCommunityIcons name="package-variant" size={32} color="#9CA3AF" />
                        </View>
                    )}
                  </View>
                    <View style={styles.selectedProductInfo}>
                    <Text style={styles.selectedProductName}>{selectedProduct.productName}</Text>
                    <Text style={styles.selectedProductPrice}>
                      Base Price: ₹{selectedProduct.basePrice.toFixed(2)}
                    </Text>
                    <Text style={styles.selectedProductStock}>
                      Available: {selectedProduct.stockQuantity} units
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Selling Price (₹)</Text>
                    <TextInput
                    style={styles.formInput}
                    value={customPrice}
                    onChangeText={setCustomPrice}
                    keyboardType="decimal-pad"
                    placeholder="Enter selling price"
                    />
                  </View>
                  
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Quantity</Text>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => {
                        const current = parseInt(quantity) || 0;
                        if (current > 1) {
                          setQuantity((current - 1).toString());
                        }
                      }}
                    >
                      <MaterialCommunityIcons name="minus" size={20} color="#007bff" />
                    </TouchableOpacity>
                      <TextInput
                      style={styles.quantityInput}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="number-pad"
                    />
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => {
                        const current = parseInt(quantity) || 0;
                        const max = selectedProduct.stockQuantity;
                        if (current < max) {
                          setQuantity((current + 1).toString());
                        } else {
                          Alert.alert('Maximum stock reached', `Only ${max} units available.`);
                        }
                      }}
                    >
                      <MaterialCommunityIcons name="plus" size={20} color="#007bff" />
                    </TouchableOpacity>
                    </View>
                  </View>
                  
                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total Amount:</Text>
                  <Text style={styles.totalValue}>
                    ₹{((parseFloat(customPrice) || 0) * (parseInt(quantity) || 0)).toFixed(2)}
                      </Text>
                    </View>

                <TouchableOpacity style={styles.createSaleButton} onPress={handleCreateSale}>
                  <Text style={styles.createSaleButtonText}>Create Sale</Text>
                  </TouchableOpacity>
              </View>
              )}
          </View>
        </View>
      </Modal>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  welcomeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748B',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  profileButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  metricsContainer: {
    padding: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  primaryMetricCard: {
    backgroundColor: '#EFF6FF',
  },
  warningMetricCard: {
    backgroundColor: '#FEF9C3',
  },
  successMetricCard: {
    backgroundColor: '#ECFDF5',
  },
  infoMetricCard: {
    backgroundColor: '#F0F9FF',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  actionContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  productsContainer: {
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 48,
    marginLeft: 8,
    fontSize: 16,
    color: '#0F172A',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  disabledProductCard: {
    opacity: 0.7,
  },
  productImageContainer: {
    height: 140,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inStock: {
    color: '#10B981',
  },
  lowStock: {
    color: '#F59E0B',
  },
  outOfStock: {
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalBody: {
    padding: 20,
  },
  selectedProductContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  selectedProductImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedProductImage: {
    width: '100%',
    height: '100%',
  },
  selectedProductImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedProductInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  selectedProductPrice: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  selectedProductStock: {
    fontSize: 14,
    color: '#64748B',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  quantityInput: {
    flex: 1,
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  createSaleButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 24,
    alignItems: 'center',
  },
  createSaleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 