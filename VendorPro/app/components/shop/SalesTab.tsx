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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSales, Sale } from '../../contexts/SalesContext';
import { useProducts, Product } from '../../contexts/ProductContext';
import { useSalesmen, Salesman } from '../../contexts/SalesmenContext';

type SalesTabProps = {
  shopId: string;
};

export default function SalesTab({ shopId }: SalesTabProps) {
  const { sales, addSale, updateSale, getShopSales } = useSales();
  const { products, getProductById } = useProducts();
  const { salesmen, getSalesmanById } = useSalesmen();
  
  const [shopSales, setShopSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [sortField, setSortField] = useState<'date' | 'amount' | 'createdAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  
  useEffect(() => {
    loadSales();
  }, [shopId, sales]);
  
  useEffect(() => {
    if (shopSales.length > 0) {
      let filtered = [...shopSales];
      
      // Apply status filter
      if (filterStatus !== 'all') {
        filtered = filtered.filter(sale => sale.status === filterStatus);
      }
      
      // Apply search filter
      if (searchQuery.trim() !== '') {
        filtered = filtered.filter(sale => {
          const customer = sale.customerName.toLowerCase();
          const product = getProductById(sale.productId)?.name.toLowerCase() || '';
          const salesman = getSalesmanById(sale.salesmanId)?.name.toLowerCase() || '';
          const query = searchQuery.toLowerCase();
          
          return customer.includes(query) || 
                 product.includes(query) || 
                 salesman.includes(query);
        });
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        if (sortField === 'date') {
          return sortDirection === 'asc' 
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortField === 'amount') {
          return sortDirection === 'asc' 
            ? a.totalAmount - b.totalAmount
            : b.totalAmount - a.totalAmount;
        } else {
          return sortDirection === 'asc' 
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
      
      setFilteredSales(filtered);
    }
  }, [searchQuery, shopSales, sortField, sortDirection, filterStatus]);
  
  const loadSales = () => {
    setIsLoading(true);
    const salesForShop = getShopSales(shopId);
    setShopSales(salesForShop);
    setFilteredSales(salesForShop);
    setIsLoading(false);
  };
  
  const handleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const handleStatusFilter = (status: 'all' | 'pending' | 'completed') => {
    setFilterStatus(status);
  };
  
  const handleMarkAsCompleted = (saleId: string) => {
    const sale = shopSales.find(sale => sale.id === saleId);
    if (sale) {
      const updatedSale: Sale = { 
        ...sale, 
        status: 'completed',
        updatedAt: new Date().toISOString() 
      };
      updateSale(updatedSale);
      Alert.alert('Success', 'Sale marked as completed');
      loadSales();
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
  
  const renderSaleItem = ({ item }: { item: Sale }) => {
    const product = getProductById(item.productId);
    const salesman = getSalesmanById(item.salesmanId);
    
    return (
      <View style={[styles.saleItem, item.status === 'completed' ? styles.completedSale : null]}>
        <View style={styles.saleHeader}>
          <View>
            <Text style={styles.customerId}>Order #{item.id.slice(-6)}</Text>
            <Text style={styles.customerName}>{item.customerName}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.saleDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Product:</Text>
            <Text style={styles.detailValue}>{product ? product.name : 'Unknown Product'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>{item.quantity} {product ? product.unit || '' : ''}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Salesman:</Text>
            <Text style={styles.detailValue}>{salesman ? salesman.name : 'Unassigned'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Commission:</Text>
            <Text style={styles.detailValue}>₹{item.commission.toFixed(2)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        
        <View style={styles.saleFooter}>
          <Text style={styles.totalAmount}>₹{item.totalAmount.toFixed(2)}</Text>
          
          {item.status === 'pending' && (
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={() => handleMarkAsCompleted(item.id)}
            >
              <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />
              <Text style={styles.completeButtonText}>Mark Completed</Text>
            </TouchableOpacity>
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
              filterStatus === 'completed' ? styles.activeChip : null
            ]}
            onPress={() => handleStatusFilter('completed')}
          >
            <Text style={[
              styles.filterChipText,
              filterStatus === 'completed' ? styles.activeChipText : null
            ]}>Completed</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textTransform: 'capitalize',
  },
  saleDetails: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
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
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CD964',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  completeButtonText: {
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
}); 