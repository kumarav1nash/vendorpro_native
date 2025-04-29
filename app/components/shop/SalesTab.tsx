import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Sale, CreateSaleDto, UpdateSaleDto } from '../../../src/types/sales';

import { useInventory } from '../../../src/contexts/InventoryContext';
import { useSales } from '../../../src/contexts/SalesContext';
import { useShop } from '../../../src/contexts/ShopContext';
import { Inventory } from '@/src/types/inventory';
import { getUserById } from '@/src/services/user.service';
import { User } from '@/src/types/user';
import { Shop } from '@/src/types/shop';

// Define a separate type for API response to avoid TypeScript errors
interface SaleWithNestedObjects {
  id: string;
  quantity: number;
  salePrice: string | number; // Accept both string and number
  status: string;
  createdAt: string;
  updatedAt: string;
  salesman?: User;
  shop?: Shop;
  product?: Inventory;
}

type SalesTabProps = {
  shopId: string;
};

export default function SalesTab({ shopId }: SalesTabProps) {
  const { 
    sales, 
    loading: salesLoading, 
    error: salesError,
    fetchAllSales, 
    approveSale, 
    rejectSale 
  } = useSales();
  
  const { inventories } = useInventory();
  const { shop } = useShop();
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [filteredSales, setFilteredSales] = useState<SaleWithNestedObjects[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleWithNestedObjects | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Format currency - handles undefined and string values safely
  const formatCurrency = (amount: string | number | undefined) => {
    if (amount === undefined || amount === null) {
      return '₹0.00';
    }
    
    // Convert to number if it's a string
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Check if it's a valid number
    if (isNaN(numericAmount)) {
      return '₹0.00';
    }
    
    return `₹${numericAmount.toFixed(2)}`;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
  });
  };
  
  // Load sales data
  useEffect(() => {
    loadSalesData();
  }, [shopId]);
  
  // Filter and sort sales when data changes
  useEffect(() => {
    if (!sales) {
      console.log('No sales data available');
      return;
    }
    
    console.log(`Processing sales data. Total sales: ${sales.length}`);
    console.log('Sample sale item:', sales.length > 0 ? JSON.stringify(sales[0]) : 'No sales');
    
    // Convert the sales array to match our expected structure
    const salesWithNestedObjects = sales.map(sale => sale as unknown as SaleWithNestedObjects);
    
    // For debugging - check the structure of the first item
    if (salesWithNestedObjects.length > 0) {
      console.log('First sale structure:', JSON.stringify(salesWithNestedObjects[0]));
    }
    
    // IMPORTANT: Temporarily show all sales instead of filtering by shopId
    // This will help us debug if any sales are loading at all
    let filtered = [...salesWithNestedObjects];
    
    console.log(`Working with ${filtered.length} sales after removing shopId filter`);
      
      // Apply status filter
    if (activeTab === 'pending') {
      filtered = filtered.filter(sale => sale.status === 'pending');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(sale => sale.status === 'approved');
    } else if (activeTab === 'rejected') {
      filtered = filtered.filter(sale => sale.status === 'rejected');
      }
    
    console.log(`After status filter: ${filtered.length} sales`);
      
    // Apply search filter if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
        filtered = filtered.filter(sale => {
        // Search by id, product name, or salesman email
        return (
          sale.id?.toLowerCase().includes(query) ||
          sale.product?.productName?.toLowerCase().includes(query) ||
          sale.salesman?.email?.toLowerCase().includes(query)
        );
      });
      
      console.log(`After search filter: ${filtered.length} sales`);
      }
      
    // Sort the filtered sales
      filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
        // Convert string salePrice to number for comparison
        const priceA = typeof a.salePrice === 'string' ? parseFloat(a.salePrice) : (a.salePrice || 0);
        const priceB = typeof b.salePrice === 'string' ? parseFloat(b.salePrice) : (b.salePrice || 0);
          return sortDirection === 'asc' 
          ? priceA - priceB
          : priceB - priceA;
        }
      });
      
      setFilteredSales(filtered);
    console.log(`Final: Displaying ${filtered.length} sales after filtering and sorting`);
  }, [sales, activeTab, sortBy, sortDirection, searchQuery, shopId, inventories]);
  
  // Load sales data from the API
  const loadSalesData = async () => {
    try {
      console.log(`Loading sales data for shop: ${shopId}`);
    setIsLoading(true);
      
      await fetchAllSales({ shopId });
      console.log("Sales fetch completed");
      
    } catch (err) {
      console.error('Error loading sales:', err);
      Alert.alert('Error', 'Failed to load sales data');
    } finally {
    setIsLoading(false);
    }
  };
  
  // Debug function for development
  const renderDebugControls = () => {
    if (!__DEV__) return null;
    
    return (
      <View style={styles.debugContainer}>
        <TouchableOpacity
          style={styles.debugButton}
          onPress={() => {
            console.log("Debug - Current sales state:");
            console.log(`Total sales count: ${sales?.length || 0}`);
            console.log(`Filtered sales count: ${filteredSales.length}`);
            console.log(`Shop ID: ${shopId}`);
            console.log(`Loading state: ${isLoading}`);
            console.log(`Sales loading state: ${salesLoading}`);
            console.log(`Error state: ${salesError}`);
            console.log("Sample sale item:", sales && sales.length > 0 ? JSON.stringify(sales[0]) : 'No sales');
            
            // Log specific properties to check structure
            if (sales && sales.length > 0) {
              const sampleSale = sales[0] as unknown as SaleWithNestedObjects;
              console.log("Product name:", sampleSale.product?.productName);
              console.log("Sale price:", sampleSale.salePrice);
              console.log("Status:", sampleSale.status);
            }
            
            // Force refresh
            loadSalesData();
          }}
        >
          <Text style={styles.debugButtonText}>Debug Sales</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Handle sale approval
  const handleApproveSale = async (saleId: string) => {
    try {
      setIsLoading(true);
      await approveSale(saleId);
      Alert.alert('Success', 'Sale approved successfully');
      
      // Close modal if open
      if (showDetailsModal) {
        setShowDetailsModal(false);
        setSelectedSale(null);
      }
      
      // Refresh data
      await loadSalesData();
    } catch (error) {
      console.error('Error approving sale:', error);
      Alert.alert('Error', 'Failed to approve sale');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle sale rejection
  const handleRejectSale = async (saleId: string) => {
    try {
      setIsLoading(true);
      await rejectSale(saleId);
      Alert.alert('Success', 'Sale rejected successfully');
      
      // Close modal if open
      if (showDetailsModal) {
        setShowDetailsModal(false);
        setSelectedSale(null);
    }
      
      // Refresh data
      await loadSalesData();
    } catch (error) {
      console.error('Error rejecting sale:', error);
      Alert.alert('Error', 'Failed to reject sale');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render individual sale item
  const renderSaleItem = ({ item }: { item: SaleWithNestedObjects }) => {
    // Add safety check
    if (!item) {
      console.log('Undefined sale item encountered');
      return null;
    }
    
    // Handle both flat and nested product structures
    const productName = item.product?.productName || 'Unknown Product';
    console.log(`Rendering sale item: ${item.id}, product: ${productName}`);
    
    return (
      <TouchableOpacity
        style={styles.saleItem}
        onPress={() => {
          setSelectedSale(item);
          setShowDetailsModal(true);
        }}
      >
        <View style={styles.saleHeader}>
          <Text style={styles.invoiceNumber}>#{item.id || 'N/A'}</Text>
          <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
            <Text style={styles.statusText}>{item.status?.toUpperCase() || 'UNKNOWN'}</Text>
          </View>
        </View>
        
        <View style={styles.saleDetails}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{productName}</Text>
            <Text style={styles.quantity}>Qty: {item.quantity || 0}</Text>
          </View>
          <View style={styles.priceInfo}>
            <Text style={styles.amount}>{formatCurrency(item.salePrice)}</Text>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        
        <View style={styles.saleFooter}>
          <Text style={styles.salesmanName}>
            <MaterialCommunityIcons name="account" size={14} color="#666" />
            {' '}{item.salesman?.phoneNumber || item.salesman?.email || 'Direct Sale'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Helper function to get status style
  const getStatusStyle = (status: string | undefined) => {
    if (!status) return {};
    
    switch (status.toLowerCase()) {
      case 'pending':
        return styles.statusPending;
      case 'approved':
        return styles.statusApproved;
      case 'rejected':
        return styles.statusRejected;
      default:
        return {};
    }
  };
  
  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  // Calculate unit price safely
  const calculateUnitPrice = (sale: SaleWithNestedObjects) => {
    if (!sale || !sale.quantity || sale.quantity <= 0) return 0;
    const salePrice = typeof sale.salePrice === 'string' ? parseFloat(sale.salePrice) : (sale.salePrice || 0);
    return salePrice / sale.quantity;
  };
  
  return (
    <View style={styles.container}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sales..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
      <View style={styles.tabsContainer}>
          <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
          >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
          >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity 
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
          >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>Completed</Text>
          </TouchableOpacity>
          <TouchableOpacity 
          style={[styles.tab, activeTab === 'rejected' && styles.activeTab]}
          onPress={() => setActiveTab('rejected')}
          >
          <Text style={[styles.tabText, activeTab === 'rejected' && styles.activeTabText]}>Rejected</Text>
          </TouchableOpacity>
      </View>
      
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity 
          style={[styles.sortButton, sortBy === 'date' && styles.activeSortButton]}
          onPress={() => {
            if (sortBy === 'date') {
              toggleSortDirection();
            } else {
              setSortBy('date');
            }
          }}
        >
          <Text style={[styles.sortButtonText, sortBy === 'date' && styles.activeSortText]}>
            Date {sortBy === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.sortButton, sortBy === 'amount' && styles.activeSortButton]}
          onPress={() => {
            if (sortBy === 'amount') {
              toggleSortDirection();
            } else {
              setSortBy('amount');
            }
          }}
        >
          <Text style={[styles.sortButtonText, sortBy === 'amount' && styles.activeSortText]}>
            Amount {sortBy === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
          </Text>
        </TouchableOpacity>
      </View>
      
      {__DEV__ && renderDebugControls()}
      
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loaderText}>Loading sales data...</Text>
        </View>
      ) : filteredSales.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="receipt" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No sales found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || activeTab !== 'all' 
              ? "Try adjusting your search or filters" 
              : "Sales will appear here once created"}
          </Text>
          {salesError && (
            <Text style={styles.errorText}>Error: {salesError}</Text>
          )}
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadSalesData}
          >
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredSales}
          renderItem={renderSaleItem}
          keyExtractor={(item) => item.id || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Sale details modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowDetailsModal(false);
          setSelectedSale(null);
        }}
      >
        {selectedSale && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sale Details</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowDetailsModal(false);
                    setSelectedSale(null);
                  }}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Invoice:</Text>
                  <Text style={styles.detailValue}>#{selectedSale.id || 'N/A'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge, 
                    getStatusStyle(selectedSale.status)
                  ]}>
                    <Text style={styles.statusText}>{selectedSale.status?.toUpperCase() || 'UNKNOWN'}</Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedSale.createdAt)}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Product:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSale.product?.productName || 'Unknown Product'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity:</Text>
                  <Text style={styles.detailValue}>{selectedSale.quantity || 0}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Unit Price:</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(calculateUnitPrice(selectedSale))}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={[styles.detailValue, styles.totalAmount]}>
                    {formatCurrency(selectedSale.salePrice)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Salesman:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSale.salesman?.phoneNumber || selectedSale.salesman?.email || 'Direct Sale'}
                  </Text>
                </View>
                
                {selectedSale.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApproveSale(selectedSale.id)}
                      disabled={isLoading}
                    >
                      <MaterialCommunityIcons name="check" size={18} color="#fff" />
                      <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleRejectSale(selectedSale.id)}
                      disabled={isLoading}
                >
                      <MaterialCommunityIcons name="close" size={18} color="#fff" />
                      <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    padding: 12,
    paddingBottom: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  activeSortButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  activeSortText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
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
  closeButton: {
    padding: 10,
  },
  detailsContainer: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  saleItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusPending: {
    backgroundColor: '#FFC107',
  },
  statusApproved: {
    backgroundColor: '#4CAF50',
  },
  statusRejected: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    textTransform: 'capitalize',
  },
  saleDetails: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quantity: {
    fontSize: 14,
    color: '#666',
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salesmanName: {
    fontSize: 14,
    color: '#666',
  },
  debugContainer: {
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  debugButton: {
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  errorText: {
    color: 'red',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#0066cc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
}); 