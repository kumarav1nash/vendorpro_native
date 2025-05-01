import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Platform, RefreshControl } from 'react-native';
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
import { Inventory } from '../../src/types/inventory';
import { Sale } from '../../src/types/sales';
import { Commission } from '../../src/types/commission';
import { ProductImage } from '../components/ui/ProductImage';

export default function DashboardScreen() {
  const { user,logout } = useAuth();
  const { shop, getShopBySalesmanId } = useShop();
  const { sales, fetchAllSales, createSale } = useSales();
  const { inventories, fetchInventoryByShopId } = useInventory();
  const { commissions, fetchCommissionsBySalesman, commissionSummary } = useCommission();
 

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Inventory | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [modalVisible, setModalVisible] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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

  // Track data loading with a ref to prevent unnecessary loads
  const dataLoadedRef = React.useRef(false);
  
  // Load data
  useEffect(() => {
    if (user?.id) {
      // Reset the ref when user changes
      if (dataLoadedRef.current && !shop?.id) {
        dataLoadedRef.current = false;
      }
      
      if (!dataLoadedRef.current) {
    loadData();
        dataLoadedRef.current = true;
      }
    } else {
      setLoading(false);
    }
    
  }, [user?.id, shop?.id]);

  // Filter products based on search
  const filteredProducts = inventories.filter(product => {
    if (!searchTerm) return true;
    return product.productName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Helper function to safely convert potential string values to numbers
  const safeNumberConversion = (value: string | number): number => {
    if (typeof value === 'string') {
      return parseFloat(value) || 0;
    }
    return value || 0;
  };

  // Calculate metrics when commissionSummary or userSales change
  useEffect(() => {
    console.log("Updating dashboard metrics");
    
    // Initialize with default values
 
    
    // If commission summary is available, use it directly
    if (commissionSummary) {
      console.log("Using commission summary for metrics:", commissionSummary);
      setMetrics({
        ...metrics,
        totalSales: safeNumberConversion(sales.length),
        pendingSales:  safeNumberConversion(sales.filter(sale => sale.status === 'pending').length),
        totalCommission: safeNumberConversion(commissionSummary.approvedSalesCommission),
        pendingCommission: safeNumberConversion(commissionSummary.pendingSalesCommission)
      });
    }
    
    
    
    console.log("Setting new metrics:", metrics);
  }, [ sales, commissionSummary]);

  const loadData = async () => {
    if (!user?.id) {
      console.log("Cannot load data: User ID is missing");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // First, get the shop for this salesman
      let currentShop = null;
      try {
        currentShop = await getShopBySalesmanId(user.id);
        console.log('Shop fetched successfully:', currentShop?.id);
      } catch (shopError: any) {
        if (shopError?.response?.status === 404) {
          console.log('No shop found for salesman:', user.id);
        } else {
          console.error('Error fetching shop:', shopError?.message || shopError);
        }
      }

      if (!currentShop?.id) {
        console.log("Cannot load shop-specific data: Shop ID is missing");
        setLoading(false);
        return;
      }
      
      // Load all data in parallel
      try {
        // Fetch sales with specific salesmanId parameter
        await fetchAllSales({ salesmanId: user.id });
        // Fetch inventory for the shop
        await fetchInventoryByShopId(currentShop.id);
        
        // Fetch commissions with specific salesmanId
        // This will now return SalesCommissionResponse with totalCommission, sales, and commissionRule
        await fetchCommissionsBySalesman(user.id);
        
        // Process the fetched data
        if (sales && Array.isArray(sales)) {
          // Ensure we're getting the latest data from context          //set sales count
          setMetrics({
            ...metrics,
            totalSales: safeNumberConversion(sales.length),
            pendingSales: safeNumberConversion(sales.filter(sale => sale.status === 'pending').length)
          });
          console.log(`Filtered ${sales.length} sales for user`);
        } else {
          console.log('No sales data available');
        }
        
        // We don't need to set userCommissions manually anymore since we're using commissionSummary directly
        // But keeping it for backward compatibility
        if (commissions && Array.isArray(commissions)) {
          setUserCommissions(commissions);
          console.log(`Set ${commissions.length} derived commissions for user`);
        } else {
          console.log('No commission data available');
          setUserCommissions([]);
        }
        
        console.log("Dashboard data loaded successfully");
      } catch (error: any) {
        console.error('Error loading dashboard data:', error?.message || error);
      }
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error?.message || error);
    } finally {
      setLoading(false);
    }
  };

  // Add a state to track product selection mode
  const [productSelectionMode, setProductSelectionMode] = useState(false);

  // Modify handleProductSelect to just select the product without clearing modal
  const handleProductSelect = (product: Inventory) => {
    setSelectedProduct(product);
    setProductSelectionMode(false);
    
    // Set default prices based on product
    const basePrice = safeNumberConversion(product.sellingPrice);
    setCustomPrice(basePrice.toString());
    setTotalAmount(basePrice.toString()); // Initially, total = unit price * 1
    setQuantity('1');
  };

  // Add a function to toggle product selection mode
  const toggleProductSelectionMode = () => {
    setProductSelectionMode(!productSelectionMode);
    // Reset the selected product when entering selection mode
    if (!productSelectionMode) {
    setSelectedProduct(null);
    }
  };

  // Calculate unit price when total amount or quantity changes
  const updateUnitPrice = (newTotal: string, newQuantity: string) => {
    // Guard against null or undefined inputs
    if (!newTotal || !newQuantity) return;
    
    const total = parseFloat(newTotal) || 0;
    const qty = parseInt(newQuantity) || 1;
    
    if (qty > 0 && total > 0) {
      const unitPrice = total / qty;
      setCustomPrice(unitPrice.toFixed(2));
    } else {
      setCustomPrice('0');
    }
  };

  // Calculate total when unit price or quantity changes
  const updateTotalAmount = (newPrice: string, newQuantity: string) => {
    // Guard against null or undefined inputs
    if (!newPrice || !newQuantity) return;
    
    const price = parseFloat(newPrice) || 0;
    const qty = parseInt(newQuantity) || 1;
    
    const total = price * qty;
    setTotalAmount(total.toFixed(2));
  };

  // Track if total amount has been manually edited
  const [totalAmountManuallyEdited, setTotalAmountManuallyEdited] = useState(false);

  // Handle quantity change
  const handleQuantityChange = (newQuantity: string) => {
    // Ensure quantity is a positive number
    const qty = parseInt(newQuantity) || 0;
    if (qty < 0) return;
    
    setQuantity(newQuantity);
    
    if (!totalAmountManuallyEdited && selectedProduct) {
      // If total hasn't been manually edited, calculate based on product price and new quantity
      const basePrice = safeNumberConversion(selectedProduct.sellingPrice);
      const newTotal = (basePrice * qty).toFixed(2);
      setTotalAmount(newTotal);
      updateUnitPrice(newTotal, newQuantity);
    } else if (customPrice) {
      // Otherwise, recalculate the total from unit price
      updateTotalAmount(customPrice, newQuantity);
    }
  };

  // Quick quantity update
  const quickUpdateQuantity = (increment: number) => {
    const currentQty = parseInt(quantity) || 0;
    const newQty = Math.max(1, currentQty + increment);
    
    // Don't exceed stock quantity
    if (selectedProduct && newQty > selectedProduct.stockQuantity) {
      Alert.alert('Maximum stock reached', `Only ${selectedProduct.stockQuantity} units available.`);
      return;
    }
    
    setQuantity(newQty.toString());
    handleQuantityChange(newQty.toString());
  };

  // Handle total amount change
  const handleTotalAmountChange = (newTotal: string) => {
    setTotalAmount(newTotal);
    setTotalAmountManuallyEdited(true);
    updateUnitPrice(newTotal, quantity);
  };

  // Handle unit price change
  const handleUnitPriceChange = (newPrice: string) => {
    setCustomPrice(newPrice);
    updateTotalAmount(newPrice, quantity);
  };

  // Reset modal state function
  const resetModalState = () => {
    setSelectedProduct(null);
    setQuantity('1');
    setCustomPrice('');
    setTotalAmount('');
    setTotalAmountManuallyEdited(false);
    setSaleItems([]);
    setProductSelectionMode(false);
  };

  // Add new state for multi-product sale
  const [saleItems, setSaleItems] = useState<{
    product: Inventory | null;
    quantity: string;
    soldAt: string;
  }[]>([]);

  // Add product to sale items list
  const handleAddProductToSale = () => {
    if (!selectedProduct) return;
    const qtyNum = parseInt(quantity);
    const soldAtNum = parseFloat(totalAmount);
    if (!qtyNum || qtyNum <= 0 || !soldAtNum || soldAtNum <= 0) return;
    if (qtyNum > selectedProduct.stockQuantity) {
      Alert.alert('Insufficient stock', `Only ${selectedProduct.stockQuantity} units available`);
      return;
    }
    setSaleItems(prev => [
      ...prev,
      {
        product: selectedProduct,
        quantity,
        soldAt: totalAmount,
      },
    ]);
    
    // Reset product input fields but keep modal open
    setSelectedProduct(null);
    setQuantity('1');
    setCustomPrice('');
    setTotalAmount('');
    setTotalAmountManuallyEdited(false);
    
    // Go back to selection mode
    setProductSelectionMode(true);
  };

  // Remove product from sale items list
  const handleRemoveProductFromSale = (index: number) => {
    setSaleItems(prev => prev.filter((_, i) => i !== index));
  };

  // Refactor handleCreateSale to use saleItems
  const handleCreateSale = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User information is missing. Please try again later.');
      return;
    }
    if (!shop?.id) {
      Alert.alert('Error', 'Shop information is missing. Please try again later.');
      return;
    } 
    if (saleItems.length === 0) {
      Alert.alert('No products', 'Please add at least one product to the sale.');
      return;
    }
    let currentShop = shop;
    if (!currentShop?.id) {
      try {
        currentShop = await getShopBySalesmanId(user.id);
      } catch (error) {
        Alert.alert('Error', 'Could not retrieve shop information. Please try again.');
        return;
      }
    }
    if (!currentShop?.id) {
      Alert.alert('Error', 'Shop information is missing. Please try again later.');
      return;
    }
    if (saleItems.length === 0) {
      Alert.alert('No products', 'Please add at least one product to the sale.');
      return;
    }
    // Validate all items
    for (const item of saleItems) {
      if (!item.product || !item.quantity || !item.soldAt) {
        Alert.alert('Invalid item', 'Each product must have a quantity and price.');
        return;
      }
      const qtyNum = parseInt(item.quantity);
      const soldAtNum = parseFloat(item.soldAt);
      if (isNaN(qtyNum) || qtyNum <= 0 || isNaN(soldAtNum) || soldAtNum <= 0) {
        Alert.alert('Invalid item', 'Each product must have a valid quantity and price.');
        return;
      }
      if (qtyNum > item.product.stockQuantity) {
        Alert.alert('Insufficient stock', `Only ${item.product.stockQuantity} units available for ${item.product.productName}`);
        return;
      }
    }
    setLoading(true);
    try {
      const items = saleItems.map(item => ({
        productId: item.product!.id,
        quantity: parseInt(item.quantity),
        soldAt: parseFloat(item.soldAt),
      }));
      
      // Calculate totalAmount as the sum of all item prices
      const totalAmount = items.reduce((sum, item) => sum + item.soldAt, 0);
      
      const saleData = {
        shopId: currentShop.id,
        items,
        totalAmount,
      };
      await createSale(saleData);
      setModalVisible(false);
      resetModalState();
      await fetchAllSales({ salesmanId: user.id });
      await fetchCommissionsBySalesman(user.id);
      if (currentShop.id) {
        await fetchInventoryByShopId(currentShop.id);
      }
      if (sales && Array.isArray(sales)) {
        setMetrics({
          ...metrics,
          totalSales: sales.length,
          pendingSales: sales.filter(sale => sale.status === 'pending').length
        });
      }
      Alert.alert('Success', 'Sale created successfully');
      console.log('Sale created and data refreshed successfully');
    } catch (error) {
      console.error('Failed to create sale:', error);
      Alert.alert('Error', 'Failed to create sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
            } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

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
            <Text style={styles.userName}>{user?.email}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => handleLogout()} //handle logout,we don't need to push to profile screen
          >
            <MaterialCommunityIcons name="logout" size={40} color="#007bff" />
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007bff']}
            tintColor="#007bff"
            title="Pull to refresh"
            titleColor="#64748B"
          />
        }
      >
        {/* Sales Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, styles.primaryMetricCard]}>
              <Text style={styles.metricValue}>{metrics.totalSales}</Text>
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
                  onPress={() => {
                    handleProductSelect(product);
                    setModalVisible(true);
                  }}
                  disabled={product.stockQuantity === 0}
                >
                  <View style={styles.productImageContainer}>
                    <ProductImage
                      imageUrl={product.productImageUrl}
                      width="100%"
                      height="100%"
                      borderRadius={8}
                      placeholderIconName="package-variant"
                    />
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
                    <Text style={styles.productPrice}>
                      ₹{safeNumberConversion(product.sellingPrice).toFixed(2)}
                    </Text>
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
        onRequestClose={() => {
          setModalVisible(false);
          resetModalState();
        }}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 24, maxHeight: '90%' }}>
            <View style={{ alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0F172A' }}>Create Sale</Text>
              <TouchableOpacity 
                style={{ position: 'absolute', right: 16, top: 16 }}
                onPress={() => {
                  setModalVisible(false);
                  resetModalState();
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ paddingHorizontal: 20, paddingTop: 10 }}>
              {/* Products in Sale Section */}
              {saleItems.length > 0 && (
                <>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Products in Sale</Text>
                  <View style={{ marginBottom: 16 }}>
                    {saleItems.map((item, idx) => (
                      <View key={idx} style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        marginBottom: 8, 
                        backgroundColor: '#F8FAFC', 
                        borderRadius: 8, 
                        padding: 10 
                      }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: '#0F172A' }}>
                            {item.product?.productName}
                          </Text>
                          <Text style={{ fontSize: 13, color: '#64748B' }}>
                            Qty: {item.quantity} | Price: ₹{item.soldAt}
                          </Text>
                        </View>
                        <TouchableOpacity 
                          onPress={() => handleRemoveProductFromSale(idx)} 
                          style={{ padding: 5 }}
                        >
                          <MaterialCommunityIcons name="delete" size={22} color="#EF4444" />
                      </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 12 }} />
                </>
              )}

              {/* Product Selection Mode */}
              {productSelectionMode ? (
                <>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
                    Select a Product
                  </Text>
                  
                  {/* Search bar for products */}
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    marginBottom: 12,
                  }}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
                    <TextInput
                      style={{ flex: 1, paddingVertical: 10, marginLeft: 8, fontSize: 16 }}
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
                  
                  {/* Product grid */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {filteredProducts.map((product) => (
                      <TouchableOpacity
                        key={product.id}
                        style={{
                          width: '48%',
                          backgroundColor: '#FFFFFF',
                          borderRadius: 12,
                          marginBottom: 12,
                          padding: 12,
                          borderWidth: 1, 
                          borderColor: '#eee',
                          opacity: product.stockQuantity === 0 ? 0.6 : 1
                        }}
                        onPress={() => product.stockQuantity > 0 && handleProductSelect(product)}
                        disabled={product.stockQuantity === 0}
                      >
                        <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#0F172A', marginBottom: 4 }} numberOfLines={1}>
                          {product.productName}
                          </Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#007bff', marginBottom: 4 }}>
                          ₹{safeNumberConversion(product.sellingPrice).toFixed(2)}
                          </Text>
                        <Text style={{ 
                          fontSize: 12, 
                          color: product.stockQuantity === 0 
                            ? '#EF4444' 
                            : product.stockQuantity < 5 
                            ? '#F59E0B' 
                            : '#10B981',
                          fontWeight: '500'
                        }}>
                          {product.stockQuantity === 0
                            ? 'Out of stock'
                            : product.stockQuantity < 5
                            ? `Low: ${product.stockQuantity} left`
                            : `In stock: ${product.stockQuantity}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {filteredProducts.length === 0 && (
                    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                      <MaterialCommunityIcons name="package-variant" size={48} color="#CBD5E1" />
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#64748B', marginTop: 8 }}>
                        No products found
                      </Text>
                      <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 4 }}>
                        {searchTerm 
                          ? "No products match your search criteria." 
                          : "No products are available in this shop."}
                      </Text>
                    </View>
                  )}
                  
                  {/* Button to go back to regular mode */}
                  <TouchableOpacity
                    style={{ 
                      backgroundColor: '#F1F5F9',
                      borderRadius: 8,
                      paddingVertical: 14,
                      alignItems: 'center',
                      marginTop: 12,
                      marginBottom: 16
                    }}
                    onPress={toggleProductSelectionMode}
                  >
                    <Text style={{ color: '#64748B', fontWeight: 'bold', fontSize: 16 }}>
                      Cancel Selection
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                // Add Product Section
                <>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
                    {saleItems.length > 0 ? 'Add Another Product' : 'Add Product'}
                      </Text>
                  
                  {selectedProduct ? (
                    <View style={{ marginBottom: 16 }}>
                      {/* Product Info */}
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        backgroundColor: '#F0F9FF', 
                        borderRadius: 8, 
                        padding: 12, 
                        marginBottom: 12 
                      }}>
                        <View style={{ 
                          width: 60, 
                          height: 60, 
                          borderRadius: 8, 
                          overflow: 'hidden', 
                          marginRight: 12,
                          backgroundColor: '#E0F2FE',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <ProductImage
                            imageUrl={selectedProduct.productImageUrl}
                            width="100%"
                            height="100%"
                            borderRadius={8}
                            placeholderIconName="package-variant"
                          />
                    </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#0F172A', marginBottom: 4 }}>
                            {selectedProduct.productName}
                          </Text>
                          <Text style={{ fontSize: 14, color: '#64748B' }}>
                            Available: {selectedProduct.stockQuantity} units | MRP: ₹{safeNumberConversion(selectedProduct.sellingPrice).toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      {/* Quantity Input */}
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#0F172A', marginBottom: 4 }}>Quantity</Text>
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: '#ddd',
                        borderRadius: 8,
                        backgroundColor: '#F8FAFC',
                      }}>
                    <TouchableOpacity 
                          style={{ 
                            width: 40, 
                            height: 40, 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            borderRightWidth: 1,
                            borderRightColor: '#eee'
                          }}
                          onPress={() => {
                            const current = parseInt(quantity) || 0;
                            if (current > 1) {
                              const newQty = (current - 1).toString();
                              setQuantity(newQty);
                              handleQuantityChange(newQty);
                            }
                          }}
                        >
                          <MaterialCommunityIcons name="minus" size={20} color="#007bff" />
                    </TouchableOpacity>
                    <TextInput
                          style={{ 
                            flex: 1,
                            height: 40,
                            textAlign: 'center',
                            fontSize: 16
                          }}
                          value={quantity}
                          onChangeText={handleQuantityChange}
                          keyboardType="number-pad"
                        />
                        <TouchableOpacity
                          style={{ 
                            width: 40, 
                            height: 40, 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            borderLeftWidth: 1,
                            borderLeftColor: '#eee'
                          }}
                          onPress={() => {
                            const current = parseInt(quantity) || 0;
                            const max = selectedProduct.stockQuantity;
                            if (current < max) {
                              const newQty = (current + 1).toString();
                              setQuantity(newQty);
                              handleQuantityChange(newQty);
                            } else {
                              Alert.alert('Maximum stock reached', `Only ${max} units available.`);
                            }
                          }}
                        >
                          <MaterialCommunityIcons name="plus" size={20} color="#007bff" />
                        </TouchableOpacity>
                  </View>
                  
                      {/* Quick quantity buttons */}
                      <View style={{ 
                        flexDirection: 'row', 
                        justifyContent: 'flex-end', 
                        marginBottom: 12 
                      }}>
                        <TouchableOpacity
                          style={{ 
                            backgroundColor: '#E3F2FD',
                            borderRadius: 4,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            marginLeft: 8,
                            borderWidth: 1,
                            borderColor: '#BBDEFB'
                          }}
                          onPress={() => quickUpdateQuantity(2)}
                        >
                          <Text style={{ color: '#007bff', fontWeight: '600', fontSize: 12 }}>+2</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ 
                            backgroundColor: '#E3F2FD',
                            borderRadius: 4,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            marginLeft: 8,
                            borderWidth: 1,
                            borderColor: '#BBDEFB'
                          }}
                          onPress={() => quickUpdateQuantity(5)}
                        >
                          <Text style={{ color: '#007bff', fontWeight: '600', fontSize: 12 }}>+5</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ 
                            backgroundColor: '#E3F2FD',
                            borderRadius: 4,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            marginLeft: 8,
                            borderWidth: 1,
                            borderColor: '#BBDEFB'
                          }}
                          onPress={() => quickUpdateQuantity(10)}
                        >
                          <Text style={{ color: '#007bff', fontWeight: '600', fontSize: 12 }}>+10</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Total Price Input */}
                      <Text style={{ 
                        fontSize: 14, 
                        fontWeight: '600', 
                        color: '#007bff', 
                        marginBottom: 4 
                      }}>Total Selling Amount (₹)</Text>
                      <TextInput
                        style={{ 
                          borderWidth: 2,
                          borderColor: '#007bff',
                          borderRadius: 8,
                          padding: 12,
                          fontSize: 16,
                          fontWeight: '600',
                          backgroundColor: '#EFF6FF',
                          marginBottom: 12
                        }}
                        value={totalAmount}
                        onChangeText={handleTotalAmountChange}
                        keyboardType="decimal-pad"
                        placeholder="Enter total selling amount"
                      />

                      {/* Unit Price (Read Only) */}
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#0F172A', marginBottom: 4 }}>Unit Price (₹)</Text>
                      <TextInput
                        style={{ 
                          borderWidth: 1,
                          borderColor: '#ddd',
                          borderRadius: 8,
                          padding: 12,
                          fontSize: 16,
                          backgroundColor: '#F0F0F0',
                          color: '#666',
                          marginBottom: 16
                        }}
                        value={customPrice}
                        keyboardType="decimal-pad"
                        placeholder="Per unit price"
                        editable={false}
                      />

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        {/* Add Product Button */}
                        <TouchableOpacity 
                          style={{ 
                            flex: 1,
                            backgroundColor: '#007AFF',
                            borderRadius: 8,
                            paddingVertical: 14,
                            alignItems: 'center',
                            marginBottom: 16,
                            marginRight: 8
                          }}
                          onPress={handleAddProductToSale}
                        >
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Add to Sale</Text>
                        </TouchableOpacity>
                        
                        {/* Cancel Button */}
                        <TouchableOpacity 
                          style={{ 
                            flex: 1,
                            backgroundColor: '#F1F5F9',
                            borderRadius: 8,
                            paddingVertical: 14,
                            alignItems: 'center',
                            marginBottom: 16,
                            marginLeft: 8
                          }}
                          onPress={() => {
                            setSelectedProduct(null);
                            setProductSelectionMode(true);
                          }}
                        >
                          <Text style={{ color: '#64748B', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                  </View>
                  ) : (
                    <TouchableOpacity
                      style={{ 
                        backgroundColor: '#0EA5E9',
                        borderRadius: 8,
                        paddingVertical: 14,
                        alignItems: 'center',
                        marginBottom: 16
                      }}
                      onPress={() => setProductSelectionMode(true)}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Select a Product</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {/* Divider and Total */}
              {saleItems.length > 0 && !productSelectionMode && !selectedProduct && (
                <>
                  <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 16 }} />
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: 16 
                  }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A' }}>Grand Total</Text>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#007AFF' }}>
                      ₹{saleItems.reduce((sum, item) => sum + parseFloat(item.soldAt), 0).toFixed(2)}
                      </Text>
                    </View>
                  
                  {/* Create Sale Button */}
                  <TouchableOpacity
                    style={{ 
                      backgroundColor: '#10B981',
                      borderRadius: 8,
                      paddingVertical: 16,
                      alignItems: 'center',
                      marginBottom: 8
                    }}
                    onPress={handleCreateSale}
                    disabled={saleItems.length === 0 || loading}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Create Sale</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  primaryMetricCard: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6'
  },
  warningMetricCard: {
    backgroundColor: '#FEF9C3',
    borderLeftWidth: 4,
    borderLeftColor: '#EAB308'
  },
  successMetricCard: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981'
  },
  infoMetricCard: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9'
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
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
  highlightedLabel: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  highlightedInput: {
    borderColor: '#007bff',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
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
  quickQuantityContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  quickQuantityButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  quickQuantityButtonText: {
    color: '#007bff',
    fontWeight: '600',
    fontSize: 12,
  },
  readonlyInput: {
    backgroundColor: '#F0F0F0',
    color: '#666',
  },
}); 