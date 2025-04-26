import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useInventory } from '../../src/contexts/InventoryContext';
import { useSales } from '../../src/contexts/SalesContext';
import { useShop } from '../../src/contexts/ShopContext';
import { router } from 'expo-router';
import { Inventory } from '@/src/types/inventory';
import { useCommission } from '../../src/contexts/CommissionContext';

type SaleForm = {
  productId: string;
  productName: string;
  customerName: string;
  quantity: number;
  sellingPrice: number;
  totalAmount: number;
};

export default function SalesmanDashboardScreen() {
  const { user: salesman, logout } = useAuth();
  const { shop } = useShop();
  const { inventories, fetchInventoryByShopId } = useInventory();
  const { sales, fetchAllSales, createSale } = useSales();
  const { commissions, fetchCommissionsBySalesman } = useCommission();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Inventory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Inventory | null>(null);
  const [saleForm, setSaleForm] = useState({
    productId: '',
    productName: '',
    quantity: 1,
    sellingPrice: 0,
    totalAmount: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [pendingSales, setPendingSales] = useState(0);
  const [completedSales, setCompletedSales] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [todaySales, setTodaySales] = useState(0);

  useEffect(() => {
    loadData();
  }, [salesman, shop]);

  useEffect(() => {
    if (selectedProduct) {
      setSaleForm(prev => ({
        ...prev,
        productId: selectedProduct.id,
        productName: selectedProduct.productName,
        sellingPrice: selectedProduct.sellingPrice,
        totalAmount: selectedProduct.sellingPrice * prev.quantity
      }));
    }
  }, [selectedProduct]);

  useEffect(() => {
    setSaleForm(prev => ({
      ...prev,
      totalAmount: prev.sellingPrice * prev.quantity
    }));
  }, [saleForm.quantity, saleForm.sellingPrice]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(inventories);
    } else {
      const filtered = inventories.filter(product => 
        product.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, inventories]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (shop?.id) {
        await fetchInventoryByShopId(shop.id);
        await fetchAllSales({ salesmanId: salesman?.id });
        if (salesman?.id) {
          await fetchCommissionsBySalesman(salesman.id);
        }
      }
      updateMetrics();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMetrics = () => {
    if (!salesman) return;
    const salesmanSales = sales.filter(sale => sale.salesmanId === salesman.id);
    setPendingSales(salesmanSales.filter(sale => sale.status === 'pending').length);
    setCompletedSales(salesmanSales.filter(sale => sale.status === 'approved').length);
    const totalComm = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
    setTotalCommission(totalComm);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    setTodaySales(salesmanSales.filter(sale => sale.status !== 'rejected' && sale.createdAt.split('T')[0] === todayStr).reduce((sum, sale) => sum + sale.salePrice * sale.quantity, 0));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOpenSaleForm = () => {
    setSaleForm({
      productId: '',
      productName: '',
      quantity: 1,
      sellingPrice: 0,
      totalAmount: 0,
    });
    setSelectedProduct(null);
    setSearchQuery('');
    setShowModal(true);
  };

  const handleSelectProduct = (product: Inventory) => {
    setSelectedProduct(product);
    setSearchQuery('');
  };

  const handleQuantityChange = (text: string) => {
    const quantity = text.trim() === '' ? 0 : parseInt(text, 10);
    if (selectedProduct && quantity > selectedProduct.stockQuantity) {
      Alert.alert('Error', `Only ${selectedProduct.stockQuantity} units available in stock`);
      return;
    }
    setSaleForm(prev => ({ ...prev, quantity }));
  };

  const handleSellingPriceChange = (text: string) => {
    const sellingPrice = text.trim() === '' ? 0 : parseFloat(text);
    setSaleForm(prev => ({ ...prev, sellingPrice }));
  };

  const validateSaleForm = () => {
    if (!selectedProduct) {
      Alert.alert('Error', 'Please select a product');
      return false;
    }
   
    if (saleForm.quantity <= 0) {
      Alert.alert('Error', 'Quantity must be greater than 0');
      return false;
    }
    if (saleForm.sellingPrice <= 0) {
      Alert.alert('Error', 'Selling price must be greater than 0');
      return false;
    }
    return true;
  };

  const handleSubmitSale = async () => {
    if (!validateSaleForm() || !salesman || !selectedProduct) return;
    try {
      await createSale({
        shopId: shop?.id || '',
        productId: selectedProduct.id,
        salesmanId: salesman.id,
        quantity: saleForm.quantity,
        salePrice: saleForm.sellingPrice,
      });
      setShowModal(false);
      Alert.alert('Sale Recorded', 'Your sale has been recorded and is pending approval.');
      setSaleForm({
        productId: '',
        productName: '',
        quantity: 1,
        sellingPrice: 0,
        totalAmount: 0,
      });
      setSelectedProduct(null);
      await loadData();
    } catch (error) {
      console.error('Error recording sale:', error);
      Alert.alert('Error', 'Failed to record sale');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/salesman-login');
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>
              Welcome, {salesman?.id ?? 'Salesman'}
            </Text>
            <Text style={styles.dateText}>
              {new Date().toDateString()}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialCommunityIcons name="logout" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>₹{todaySales.toFixed(2)}</Text>
            <Text style={styles.kpiTitle}>Today's Sales</Text>
          </View>
          
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>₹{totalCommission.toFixed(2)}</Text>
            <Text style={styles.kpiTitle}>Total Commission</Text>
          </View>
          
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{pendingSales}</Text>
            <Text style={styles.kpiTitle}>Pending Sales</Text>
          </View>
          
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{completedSales}</Text>
            <Text style={styles.kpiTitle}>Completed Sales</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.addSaleButton}
          onPress={handleOpenSaleForm}
        >
          <MaterialCommunityIcons name="cart-plus" size={24} color="#fff" />
          <Text style={styles.addSaleButtonText}>Record New Sale</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Sales</Text>
            <TouchableOpacity onPress={() => router.push('/(salesman)/sales-history')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {sales.filter(sale => sale.salesmanId === salesman?.id).length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="cart-off" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No sales recorded yet</Text>
            </View>
          ) : (
            sales
              .filter(sale => sale.salesmanId === salesman?.id)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map((sale) => {
                const product = inventories.find(p => p.id === sale.productId);
                return (
                  <View key={sale.id} style={styles.saleItem}>
                    <View style={styles.saleInfo}>
                      <Text style={styles.saleProductName}>{product ? product.productName : 'Unknown Product'}</Text>
                    
                      <Text style={styles.saleDetail}>
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.saleDetails}>
                      <Text style={styles.saleAmount}>₹{sale.salePrice.toFixed(2)}</Text>
                      <View style={[
                        styles.statusBadge, 
                        sale.status === 'approved' ? styles.statusCompleted : 
                        sale.status === 'rejected' ? styles.statusRejected : 
                        styles.statusPending
                      ]}>
                        <Text style={styles.statusText}>{sale.status}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
          )}
        </View>
      </ScrollView>

      {/* Record Sale Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record New Sale</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {!selectedProduct ? (
                // Product selection view
                <>
                  <View style={styles.searchContainer}>
                    <MaterialCommunityIcons name="magnify" size={24} color="#999" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search products..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                  
                  {filteredProducts.length === 0 ? (
                    <View style={styles.emptyState}>
                      <MaterialCommunityIcons name="package-variant" size={48} color="#ccc" />
                      <Text style={styles.emptyStateText}>No products found</Text>
                    </View>
                  ) : (
                    filteredProducts.map((product) => (
                      <TouchableOpacity
                        key={product.id}
                        style={styles.productItem}
                        onPress={() => handleSelectProduct(product)}
                      >
                        <View style={styles.productInfo}>
                          <Text style={styles.productName}>{product.productName}</Text>
                          <Text style={styles.productDetail}>
                            Selling Price: ₹{product.sellingPrice.toFixed(2)}
                          </Text>
                          <Text style={styles.productDetail}>
                            Available: {product.stockQuantity} units
                          </Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                      </TouchableOpacity>
                    ))
                  )}
                </>
              ) : (
                // Sale form view
                <>
                  <View style={styles.selectedProduct}>
                    <View style={styles.selectedProductInfo}>
                      <Text style={styles.selectedProductName}>{selectedProduct.productName}</Text>
                      <Text style={styles.selectedProductDetail}>
                        Available: {selectedProduct.stockQuantity} units
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.changeProductButton}
                      onPress={() => setSelectedProduct(null)}
                    >
                      <Text style={styles.changeProductText}>Change</Text>
                    </TouchableOpacity>
                  </View>
              
                  
                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.label}>Quantity*</Text>
                      <TextInput
                        style={styles.input}
                        value={saleForm.quantity.toString()}
                        onChangeText={handleQuantityChange}
                        keyboardType="numeric"
                        placeholder="Quantity"
                      />
                    </View>
                    
                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.label}>Price (₹)*</Text>
                      <TextInput
                        style={styles.input}
                        value={saleForm.sellingPrice.toString()}
                        onChangeText={handleSellingPriceChange}
                        keyboardType="numeric"
                        placeholder="Selling price"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>Total Amount:</Text>
                    <Text style={styles.totalAmount}>₹{saleForm.totalAmount.toFixed(2)}</Text>
                  </View>
                  
                  <View style={styles.commissionPreview}>
                    <Text style={styles.commissionLabel}>Your Total Commission:</Text>
                    <Text style={styles.commissionAmount}>₹{totalCommission.toFixed(2)}</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmitSale}
                  >
                    <Text style={styles.submitButtonText}>Submit Sale for Approval</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 20,
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  kpiCard: {
    width: '50%',
    padding: 12,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  kpiTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addSaleButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  addSaleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    color: '#007AFF',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
  },
  saleInfo: {
    flex: 1,
  },
  saleProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  saleDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  saleDetails: {
    alignItems: 'flex-end',
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusPending: {
    backgroundColor: '#FF9800',
  },
  statusRejected: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScrollView: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  selectedProduct: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedProductInfo: {
    flex: 1,
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedProductDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  changeProductButton: {
    padding: 8,
  },
  changeProductText: {
    color: '#007AFF',
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  commissionPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginVertical: 16,
  },
  commissionLabel: {
    fontSize: 14,
    color: '#333',
  },
  commissionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 