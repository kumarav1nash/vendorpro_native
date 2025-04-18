import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Type definitions
type Product = {
  id: string;
  name: string;
  basePrice: number;
  sellingPrice: number;
  quantity: number;
  imageUri?: string;
};

type Sale = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  salePrice: number;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  salesmanId: string;
  salesmanName: string;
  timestamp: number;
  commission: number;
  rejectionReason?: string;
};

type SaleForm = {
  productId: string;
  quantity: number;
  salePrice: number;
};

export default function SalesScreen() {
  // State management
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSalesmanView, setIsSalesmanView] = useState(false);
  const [currentSalesman, setCurrentSalesman] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [saleForm, setSaleForm] = useState<SaleForm>({
    productId: '',
    quantity: 1,
    salePrice: 0,
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [saleToReject, setSaleToReject] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Filter sales when filter status changes
  useEffect(() => {
    filterSalesData();
  }, [sales, filterStatus, searchQuery]);

  // Update sale price when product changes
  useEffect(() => {
    if (selectedProduct) {
      setSaleForm(prev => ({
        ...prev,
        salePrice: selectedProduct.sellingPrice,
      }));
    }
  }, [selectedProduct]);

  // Load products, salesmen, and sales data
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Load user info to determine if this is a salesman or owner view
      const userDataJson = await AsyncStorage.getItem('user');
      if (userDataJson) {
        const userData = JSON.parse(userDataJson);
        // For now, let's assume we're in owner view for simplicity
        // In a real app, we would check user roles or a specific flag
        setIsSalesmanView(false);
      }

      // Load products
      const productsJson = await AsyncStorage.getItem('products');
      if (productsJson) {
        const productsData = JSON.parse(productsJson);
        setProducts(productsData);
      }

      // Load salesmen
      const salesmenJson = await AsyncStorage.getItem('salesmen');
      if (salesmenJson) {
        const salesmenData = JSON.parse(salesmenJson);
        setSalesmen(salesmenData);
      }

      // Load sales
      const salesJson = await AsyncStorage.getItem('sales');
      if (salesJson) {
        const salesData = JSON.parse(salesJson);
        setSales(salesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter sales based on status and search query
  const filterSalesData = () => {
    let filtered = [...sales];
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(sale => sale.status === filterStatus);
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(sale => 
        sale.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.salesmanName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    
    setFilteredSales(filtered);
  };

  // Create a new sale
  const handleCreateSale = async () => {
    if (!selectedProduct) {
      Alert.alert('Error', 'Please select a product');
      return;
    }
    
    if (saleForm.quantity <= 0) {
      Alert.alert('Error', 'Quantity must be greater than 0');
      return;
    }
    
    if (saleForm.quantity > selectedProduct.quantity) {
      Alert.alert('Error', 'Not enough inventory available');
      return;
    }
    
    if (saleForm.salePrice <= 0) {
      Alert.alert('Error', 'Sale price must be greater than 0');
      return;
    }
    
    try {
      const timestamp = Date.now();
      const newSale: Sale = {
        id: `sale-${timestamp}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: saleForm.quantity,
        salePrice: saleForm.salePrice,
        totalAmount: saleForm.quantity * saleForm.salePrice,
        status: 'pending',
        salesmanId: isSalesmanView && currentSalesman ? currentSalesman.id : 'owner',
        salesmanName: isSalesmanView && currentSalesman ? currentSalesman.name : 'Shop Owner',
        timestamp,
        commission: calculateCommission(saleForm.salePrice, selectedProduct.basePrice, saleForm.quantity),
      };
      
      const updatedSales = [...sales, newSale];
      await AsyncStorage.setItem('sales', JSON.stringify(updatedSales));
      setSales(updatedSales);
      
      // Update product quantity
      const updatedProducts = products.map(product => {
        if (product.id === selectedProduct.id) {
          return {
            ...product,
            quantity: product.quantity - saleForm.quantity,
          };
        }
        return product;
      });
      
      await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
      setProducts(updatedProducts);
      
      Alert.alert('Success', 'Sale created successfully');
      resetSaleForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error creating sale:', error);
      Alert.alert('Error', 'Failed to create sale');
    }
  };

  // Calculate commission (simple formula - this would be more complex in reality)
  const calculateCommission = (salePrice: number, basePrice: number, quantity: number) => {
    const profit = (salePrice - basePrice) * quantity;
    // For this example, commission is 10% of profit
    return profit * 0.1;
  };

  // Update sale status (for owner)
  const handleUpdateSaleStatus = async (saleId: string, newStatus: 'approved' | 'rejected', rejectionReason?: string) => {
    try {
      // Find the sale to be updated
      const saleToUpdate = sales.find(sale => sale.id === saleId);
      
      // If not found or already in the requested status, no action needed
      if (!saleToUpdate || saleToUpdate.status === newStatus) {
        return;
      }
      
      // If the status is changing to rejected, we need to restore the inventory
      if (newStatus === 'rejected' && saleToUpdate.status === 'pending') {
        // Find the product
        const productToUpdate = products.find(product => product.id === saleToUpdate.productId);
        
        if (productToUpdate) {
          // Restore the quantity that was decreased when the sale was created
          const updatedProducts = products.map(product => {
            if (product.id === productToUpdate.id) {
              return {
                ...product,
                quantity: product.quantity + saleToUpdate.quantity,
              };
            }
            return product;
          });
          
          // Save updated products
          await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
          setProducts(updatedProducts);
        }
      }
      
      // Update the sale status
      const updatedSales = sales.map(sale => {
        if (sale.id === saleId) {
          return {
            ...sale,
            status: newStatus,
            rejectionReason: rejectionReason,
          };
        }
        return sale;
      });
      
      await AsyncStorage.setItem('sales', JSON.stringify(updatedSales));
      setSales(updatedSales);
      
      Alert.alert('Success', `Sale ${newStatus}`);
    } catch (error) {
      console.error('Error updating sale status:', error);
      Alert.alert('Error', 'Failed to update sale status');
    }
  };

  // Reset sale form
  const resetSaleForm = () => {
    setSaleForm({
      productId: '',
      quantity: 1,
      salePrice: 0,
    });
    setSelectedProduct(null);
  };

  // Add this function to handle rejection process
  const handleRejectButtonPress = (saleId: string) => {
    setSaleToReject(saleId);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const handleRejectConfirm = () => {
    if (saleToReject) {
      handleUpdateSaleStatus(
        saleToReject,
        'rejected',
        rejectionReason || 'No reason provided'
      );
      setShowRejectionModal(false);
      setSaleToReject(null);
    }
  };

  // Render a sale item
  const renderSaleItem = ({ item }: { item: Sale }) => {
    const statusColors = {
      pending: '#FFC107',
      approved: '#4CAF50',
      rejected: '#F44336',
    };
    
    return (
      <View style={styles.saleCard}>
        <View style={styles.saleHeader}>
          <Text style={styles.saleProductName}>{item.productName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
            <Text style={styles.statusText}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
          </View>
        </View>
        
        <View style={styles.saleDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>{item.quantity}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.detailValue}>₹{item.salePrice}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total:</Text>
            <Text style={styles.detailValue}>₹{item.totalAmount}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Salesman:</Text>
            <Text style={styles.detailValue}>{item.salesmanName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{new Date(item.timestamp).toLocaleDateString()}</Text>
          </View>
          
          {!isSalesmanView && item.commission > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Commission:</Text>
              <Text style={styles.detailValue}>₹{item.commission.toFixed(2)}</Text>
            </View>
          )}
          
          {item.status === 'rejected' && item.rejectionReason && (
            <View style={styles.rejectionContainer}>
              <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
              <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
            </View>
          )}
        </View>
        
        {!isSalesmanView && item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectButtonPress(item.id)}
            >
              <MaterialCommunityIcons name="close" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleUpdateSaleStatus(item.id, 'approved')}
            >
              <MaterialCommunityIcons name="check" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Render product selection item
  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[
        styles.productItem,
        selectedProduct?.id === item.id && styles.productItemSelected
      ]}
      onPress={() => {
        setSelectedProduct(item);
        setSaleForm(prev => ({
          ...prev,
          productId: item.id,
          salePrice: item.sellingPrice,
        }));
      }}
    >
      <Text style={styles.productItemName}>{item.name}</Text>
      <Text style={styles.productItemPrice}>₹{item.sellingPrice} (Stock: {item.quantity})</Text>
    </TouchableOpacity>
  );

  // Calculate summary data
  const getSummaryData = () => {
    const totalSales = filteredSales.length;
    const pendingSales = filteredSales.filter(sale => sale.status === 'pending').length;
    const approvedSales = filteredSales.filter(sale => sale.status === 'approved').length;
    const totalRevenue = filteredSales
      .filter(sale => sale.status === 'approved')
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    return { totalSales, pendingSales, approvedSales, totalRevenue };
  };

  // Main render
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetSaleForm();
            setShowModal(true);
          }}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Search and filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search product or salesman..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('all')}
          >
            <Text 
              style={[
                styles.filterButtonText,
                filterStatus === 'all' && styles.filterButtonTextActive
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === 'pending' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('pending')}
          >
            <Text 
              style={[
                styles.filterButtonText,
                filterStatus === 'pending' && styles.filterButtonTextActive
              ]}
            >
              Pending
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === 'approved' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('approved')}
          >
            <Text 
              style={[
                styles.filterButtonText,
                filterStatus === 'approved' && styles.filterButtonTextActive
              ]}
            >
              Approved
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === 'rejected' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('rejected')}
          >
            <Text 
              style={[
                styles.filterButtonText,
                filterStatus === 'rejected' && styles.filterButtonTextActive
              ]}
            >
              Rejected
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Summary cards */}
      {!isLoading && (
        <View style={styles.summaryContainer}>
          {(() => {
            const { totalSales, pendingSales, approvedSales, totalRevenue } = getSummaryData();
            return (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={[styles.summaryCard, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={styles.summaryValue}>{totalSales}</Text>
                  <Text style={styles.summaryLabel}>Total Sales</Text>
                </View>
                
                <View style={[styles.summaryCard, { backgroundColor: '#FFF8E1' }]}>
                  <Text style={styles.summaryValue}>{pendingSales}</Text>
                  <Text style={styles.summaryLabel}>Pending</Text>
                </View>
                
                <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={styles.summaryValue}>{approvedSales}</Text>
                  <Text style={styles.summaryLabel}>Approved</Text>
                </View>
                
                <View style={[styles.summaryCard, { backgroundColor: '#F3E5F5' }]}>
                  <Text style={styles.summaryValue}>₹{totalRevenue.toFixed(2)}</Text>
                  <Text style={styles.summaryLabel}>Revenue</Text>
                </View>
              </ScrollView>
            );
          })()}
        </View>
      )}
      
      {/* Sales list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading sales data...</Text>
        </View>
      ) : filteredSales.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="cash-register" size={60} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery.trim() !== '' || filterStatus !== 'all'
              ? 'No sales match your filters'
              : 'No sales recorded yet'}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => {
              resetSaleForm();
              setShowModal(true);
            }}
          >
            <Text style={styles.emptyButtonText}>Create Your First Sale</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredSales}
          renderItem={renderSaleItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.salesList}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Create Sale Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Sale</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.sectionTitle}>Select Product</Text>
              
              {products.length === 0 ? (
                <Text style={styles.noProductsText}>No products available</Text>
              ) : (
                <View style={styles.productList}>
                  {products.map(product => (
                    <TouchableOpacity
                      key={product.id}
                      style={[
                        styles.productItem,
                        selectedProduct?.id === product.id && styles.productItemSelected
                      ]}
                      onPress={() => {
                        setSelectedProduct(product);
                        setSaleForm(prev => ({
                          ...prev,
                          productId: product.id,
                          salePrice: product.sellingPrice,
                        }));
                      }}
                      disabled={product.quantity <= 0}
                    >
                      <Text 
                        style={[
                          styles.productItemName,
                          product.quantity <= 0 && styles.productItemDisabled
                        ]}
                      >
                        {product.name} {product.quantity <= 0 ? '(Out of Stock)' : ''}
                      </Text>
                      <Text style={styles.productItemPrice}>
                        ₹{product.sellingPrice} (Stock: {product.quantity})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {selectedProduct && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Quantity</Text>
                    <TextInput
                      style={styles.input}
                      value={saleForm.quantity.toString()}
                      onChangeText={(text) => {
                        const quantity = text.trim() === '' ? 0 : parseInt(text, 10);
                        setSaleForm(prev => ({ ...prev, quantity }));
                      }}
                      keyboardType="numeric"
                      placeholder="1"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Sale Price (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={saleForm.salePrice.toString()}
                      onChangeText={(text) => {
                        const salePrice = text.trim() === '' ? 0 : parseFloat(text);
                        setSaleForm(prev => ({ ...prev, salePrice }));
                      }}
                      keyboardType="numeric"
                      placeholder="0.00"
                    />
                  </View>
                  
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total Amount:</Text>
                    <Text style={styles.totalValue}>
                      ₹{(saleForm.quantity * saleForm.salePrice).toFixed(2)}
                    </Text>
                  </View>
                </>
              )}
              
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedProduct || products.length === 0) && styles.submitButtonDisabled
                ]}
                onPress={handleCreateSale}
                disabled={!selectedProduct || products.length === 0}
              >
                <Text style={styles.submitButtonText}>Create Sale</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        visible={showRejectionModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRejectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: 300 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rejection Reason</Text>
              <TouchableOpacity onPress={() => setShowRejectionModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.label}>Please provide a reason for rejection:</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Enter reason for rejection"
                multiline
              />
              
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setShowRejectionModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleRejectConfirm}
                >
                  <Text style={styles.confirmButtonText}>Confirm Rejection</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  filterContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  summaryContainer: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryCard: {
    width: 120,
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  salesList: {
    padding: 15,
  },
  saleCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  saleProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  saleDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  rejectionContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FFF5F5',
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  rejectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 5,
  },
  rejectionText: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  modalContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  productList: {
    marginBottom: 20,
  },
  productItem: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  productItemSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  productItemDisabled: {
    color: '#aaa',
  },
  productItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 5,
  },
  productItemPrice: {
    fontSize: 14,
    color: '#666',
  },
  noProductsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    margin: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#F44336',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 