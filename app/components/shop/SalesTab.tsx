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
type SalesTabProps = {
  shopId: string;
};

export default function SalesTab({ shopId }: SalesTabProps) {
  const { sales, loading, error, fetchAllSales, createSale, updateSale, approveSale, rejectSale } = useSales();
  const { inventory, fetchInventoryById,fetchInventoryByShopId } = useInventory();
  const { getShopSalesmen } = useShop();
  
  const [shopSales, setShopSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [sortField, setSortField] = useState<'date' | 'amount' | 'createdAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Inventory | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [saleToReject, setSaleToReject] = useState<string | null>(null);
  const [saleForm, setSaleForm] = useState<CreateSaleDto>({
    shopId,
    productId: '',
    salesmanId: '',
    quantity: 1,
    salePrice: 0,
  });
  
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchAllSales({ shopId });
      setIsLoading(false);
    };
    load();
  }, [shopId]);
  
  useEffect(() => {
    let filtered = sales.filter(sale => sale.shopId === shopId);
    if (filterStatus !== 'all') {
      filtered = filtered.filter(sale => sale.status === filterStatus);
    }
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sale =>
        sale.productId.toLowerCase().includes(query) ||
        sale.salesmanId.toLowerCase().includes(query)
      );
    }
    filtered.sort((a, b) => {
      if (sortField === 'date') {
        return sortDirection === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortField === 'amount') {
        return sortDirection === 'asc'
          ? a.salePrice - b.salePrice
          : b.salePrice - a.salePrice;
      } else {
        return sortDirection === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    setFilteredSales(filtered);
  }, [sales, shopId, searchQuery, sortField, sortDirection, filterStatus]);
  
  const handleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const handleStatusFilter = (status: 'all' | 'pending' | 'approved' | 'rejected') => {
    setFilterStatus(status);
  };
  
  const handleMarkAsApproved = async (saleId: string) => {
    try {
      await approveSale(saleId);
      Alert.alert('Success', 'Sale approved');
      await fetchAllSales({ shopId });
    } catch (err) {
      Alert.alert('Error', 'Failed to approve sale');
    }
  };

  const handleRejectButtonPress = (saleId: string) => {
    setSaleToReject(saleId);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const handleRejectConfirm = async () => {
    if (saleToReject) {
      try {
        await rejectSale(saleToReject);
        Alert.alert('Success', 'Sale rejected');
        setShowRejectionModal(false);
        setSaleToReject(null);
        await fetchAllSales({ shopId });
      } catch (err) {
        Alert.alert('Error', 'Failed to reject sale');
      }
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric'
    });
  };

  // Calculate summary data
  const getSummaryData = () => {
    const totalSales = filteredSales.length;
    const pendingSales = filteredSales.filter(sale => sale.status === 'pending').length;
    const approvedSales = filteredSales.filter(sale => sale.status === 'approved').length;
    const totalRevenue = filteredSales
      .filter(sale => sale.status === 'approved')
      .reduce((sum, sale) => sum + sale.salePrice, 0);
    
    return { totalSales, pendingSales, approvedSales, totalRevenue };
  };
  
  const renderSaleItem = ({ item }: { item: Sale }) => {
    const product = fetchInventoryById(item.productId);
    const salesman = getUserById(item.salesmanId);
    
    return (
      <View style={[styles.saleCard, item.status === 'approved' ? styles.completedSale : null]}>
        <View style={styles.saleHeader}>
          <View>
            <Text style={styles.customerId}>Order #{item.id.slice(-6)}</Text>
            <Text style={styles.customerName}>{item.productId}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            item.status === 'approved'
              ? styles.completedBadge
              : item.status === 'rejected'
              ? styles.rejectedBadge
              : styles.pendingBadge,
          ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.saleDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Product ID:</Text>
            <Text style={styles.detailValue}>{item.productId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>{item.quantity}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Salesman ID:</Text>
            <Text style={styles.detailValue}>{item.salesmanId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sale Price:</Text>
            <Text style={styles.detailValue}>₹{item.salePrice.toFixed(2)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        
        <View style={styles.saleFooter}>
          <Text style={styles.totalAmount}>₹{item.salePrice.toFixed(2)}</Text>
          
          {item.status === 'pending' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleRejectButtonPress(item.id)}
              >
                <MaterialCommunityIcons name="close" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleMarkAsApproved(item.id)}
              >
                <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading sales...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sales..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.filterChips}>
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              filterStatus === 'all' ? styles.activeChip : null
            ]}
            onPress={() => handleStatusFilter('all')}
          >
            <Text style={[
              styles.filterChipText,
              filterStatus === 'all' ? styles.activeChipText : null
            ]}>All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              filterStatus === 'pending' ? styles.activeChip : null
            ]}
            onPress={() => handleStatusFilter('pending')}
          >
            <Text style={[
              styles.filterChipText,
              filterStatus === 'pending' ? styles.activeChipText : null
            ]}>Pending</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              filterStatus === 'approved' ? styles.activeChip : null
            ]}
            onPress={() => handleStatusFilter('approved')}
          >
            <Text style={[
              styles.filterChipText,
              filterStatus === 'approved' ? styles.activeChipText : null
            ]}>Approved</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              filterStatus === 'rejected' ? styles.activeChip : null
            ]}
            onPress={() => handleStatusFilter('rejected')}
          >
            <Text style={[
              styles.filterChipText,
              filterStatus === 'rejected' ? styles.activeChipText : null
            ]}>Rejected</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Summary cards */}
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
      
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => handleSort('date')}
        >
          <Text style={[
            styles.sortButtonText,
            sortField === 'date' ? styles.activeSortText : null
          ]}>Date</Text>
          {sortField === 'date' && (
            <MaterialCommunityIcons 
              name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} 
              size={16} 
              color="#007AFF" 
            />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => handleSort('amount')}
        >
          <Text style={[
            styles.sortButtonText,
            sortField === 'amount' ? styles.activeSortText : null
          ]}>Amount</Text>
          {sortField === 'amount' && (
            <MaterialCommunityIcons 
              name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} 
              size={16} 
              color="#007AFF" 
            />
          )}
        </TouchableOpacity>
      </View>
      
      {filteredSales.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="cart-off" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No sales found</Text>
          <Text style={styles.emptyStateSubtext}>
            {filterStatus !== 'all' 
              ? `Try changing your filter from "${filterStatus}"` 
              : 'Sales will appear here when they are created'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSales}
          renderItem={renderSaleItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Sale Floating Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowModal(true)}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        <Text style={styles.fabText}>New Sale</Text>
      </TouchableOpacity>

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
              
              <View style={styles.actionButtonsContainer}>
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
  filtersContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  filterChips: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  activeChipText: {
    color: '#fff',
    fontWeight: '500',
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
  sortButtonText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  activeSortText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  saleCard: {
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
  completedSale: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CD964',
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pendingBadge: {
    backgroundColor: '#FFC107',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
  },
  rejectedBadge: {
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
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  completeButton: {
    backgroundColor: '#4CD964',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
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
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    margin: 5,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
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