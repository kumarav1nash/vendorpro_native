import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sale } from '../contexts/SalesContext';
import { Salesman } from '../contexts/SalesmenContext';
import { router } from 'expo-router';

export default function SalesHistoryScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [salesman, setSalesman] = useState<Salesman | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Apply filters and sorting
    if (sales.length > 0 && salesman) {
      let filtered = sales.filter(sale => sale.salesmanId === salesman.id);
      
      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(sale => sale.status === statusFilter);
      }
      
      // Apply search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          sale =>
            sale.productName.toLowerCase().includes(query) ||
            sale.customerName.toLowerCase().includes(query)
        );
      }
      
      // Apply sorting
      const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'date') {
          return sortOrder === 'asc' ? a.date - b.date : b.date - a.date;
        } else {
          return sortOrder === 'asc'
            ? a.totalAmount - b.totalAmount
            : b.totalAmount - a.totalAmount;
        }
      });
      
      setFilteredSales(sorted);
    }
  }, [sales, salesman, searchQuery, statusFilter, sortBy, sortOrder]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load salesman data
      const salesmanData = await AsyncStorage.getItem('currentSalesman');
      if (salesmanData) {
        const parsedSalesman = JSON.parse(salesmanData) as Salesman;
        setSalesman(parsedSalesman);
      }

      // Load sales
      const salesData = await AsyncStorage.getItem('sales');
      if (salesData) {
        const parsedSales = JSON.parse(salesData) as Sale[];
        setSales(parsedSales);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load sales history');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'rejected':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getTotalCommission = () => {
    if (!salesman) return 0;
    
    return filteredSales
      .filter(sale => sale.status === 'completed')
      .reduce((sum, sale) => sum + (sale.commission || 0), 0);
  };

  const getTotalSales = () => {
    if (!salesman) return 0;
    
    return filteredSales.reduce((sum, sale) => {
      if (sale.status !== 'rejected') {
        return sum + sale.totalAmount;
      }
      return sum;
    }, 0);
  };

  const renderSaleItem = ({ item }: { item: Sale }) => {
    return (
      <View style={styles.saleItem}>
        <View style={styles.saleHeader}>
          <Text style={styles.productName}>{item.productName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.saleDetails}>
          <View style={styles.saleInfo}>
            <Text style={styles.saleInfoText}>Customer: {item.customerName}</Text>
            <Text style={styles.saleInfoText}>Quantity: {item.quantity}</Text>
            <Text style={styles.saleInfoText}>
              Date: {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.saleAmount}>
            <Text style={styles.amountText}>₹{item.totalAmount.toFixed(2)}</Text>
            {item.status === 'completed' && (
              <Text style={styles.commissionText}>
                Commission: ₹{(item.commission || 0).toFixed(2)}
              </Text>
            )}
          </View>
        </View>
        
        {item.status === 'rejected' && item.rejectionReason && (
          <View style={styles.rejectionReason}>
            <Text style={styles.rejectionReasonText}>
              Reason: {item.rejectionReason}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{filteredSales.length}</Text>
            <Text style={styles.statLabel}>Total Entries</Text>
          </View>
          
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹{getTotalSales().toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Sales</Text>
          </View>
          
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹{getTotalCommission().toFixed(2)}</Text>
            <Text style={styles.statLabel}>Commission</Text>
          </View>
        </View>
        
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={24} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search sales..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.pillContainer}>
                <TouchableOpacity
                  style={[
                    styles.pill,
                    statusFilter === 'all' && styles.pillActive,
                  ]}
                  onPress={() => setStatusFilter('all')}
                >
                  <Text
                    style={[
                      styles.pillText,
                      statusFilter === 'all' && styles.pillTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.pill,
                    statusFilter === 'pending' && styles.pillActive,
                  ]}
                  onPress={() => setStatusFilter('pending')}
                >
                  <Text
                    style={[
                      styles.pillText,
                      statusFilter === 'pending' && styles.pillTextActive,
                    ]}
                  >
                    Pending
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.pill,
                    statusFilter === 'completed' && styles.pillActive,
                  ]}
                  onPress={() => setStatusFilter('completed')}
                >
                  <Text
                    style={[
                      styles.pillText,
                      statusFilter === 'completed' && styles.pillTextActive,
                    ]}
                  >
                    Completed
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.pill,
                    statusFilter === 'rejected' && styles.pillActive,
                  ]}
                  onPress={() => setStatusFilter('rejected')}
                >
                  <Text
                    style={[
                      styles.pillText,
                      statusFilter === 'rejected' && styles.pillTextActive,
                    ]}
                  >
                    Rejected
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.pillContainer}>
                <TouchableOpacity
                  style={[
                    styles.pill,
                    sortBy === 'date' && styles.pillActive,
                  ]}
                  onPress={() => {
                    if (sortBy === 'date') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('date');
                      setSortOrder('desc');
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.pillText,
                      sortBy === 'date' && styles.pillTextActive,
                    ]}
                  >
                    Date
                    {sortBy === 'date' && (
                      <MaterialCommunityIcons
                        name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                        size={14}
                        color={sortBy === 'date' ? '#fff' : '#666'}
                      />
                    )}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.pill,
                    sortBy === 'amount' && styles.pillActive,
                  ]}
                  onPress={() => {
                    if (sortBy === 'amount') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('amount');
                      setSortOrder('desc');
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.pillText,
                      sortBy === 'amount' && styles.pillTextActive,
                    ]}
                  >
                    Amount
                    {sortBy === 'amount' && (
                      <MaterialCommunityIcons
                        name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                        size={14}
                        color={sortBy === 'amount' ? '#fff' : '#666'}
                      />
                    )}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="receipt" size={60} color="#ccc" />
        <Text style={styles.emptyText}>
          {searchQuery.length > 0 || statusFilter !== 'all'
            ? 'No sales match your filters'
            : 'No sales records found'}
        </Text>
        {(searchQuery.length > 0 || statusFilter !== 'all') && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
          >
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading sales history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Sales History</Text>
        <View style={styles.placeholder} />
      </View>
      
      <FlatList
        data={filteredSales}
        renderItem={renderSaleItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
      />
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
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
  listContainer: {
    paddingBottom: 20,
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filtersContainer: {
    marginTop: 8,
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
  clearSearch: {
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  pillActive: {
    backgroundColor: '#007AFF',
  },
  pillText: {
    fontSize: 14,
    color: '#666',
  },
  pillTextActive: {
    color: '#fff',
  },
  saleItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
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
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  saleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saleInfo: {
    flex: 1,
  },
  saleInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  saleAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  commissionText: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
  },
  rejectionReason: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  rejectionReasonText: {
    fontSize: 14,
    color: '#F44336',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  resetButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
});