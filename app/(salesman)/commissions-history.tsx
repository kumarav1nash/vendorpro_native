import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { format } from 'date-fns';
import { useCommission } from '../../src/contexts/CommissionContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Commission } from '../../src/types/commission';
import { formatCurrency } from '../../src/utils/formatting';

// Filter options
const FILTER_ALL = 'all';
const FILTER_PAID = 'paid';
const FILTER_UNPAID = 'unpaid';

export default function CommissionsHistoryScreen() {
  const { 
    commissions, 
    fetchCommissionsBySalesman, 
    markCommissionAsPaid, 
    loading,
    salesWithCommission,
    commissionSummary,
    activeCommissionRule
  } = useCommission();
  const { user } = useAuth();
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Load commissions data
  const loadData = async () => {
    if (!user?.id) {
      console.log('Cannot load commissions: User ID is missing');
      return;
    }
    
    try {
      console.log('Fetching commissions for salesman ID:', user.id);
      await fetchCommissionsBySalesman(user.id);
      console.log('Commission data fetched successfully');
    } catch (error: any) {
      console.error('Failed to load commissions:', error?.message || error);
    }
  };

  // Filter and sort sales when data changes
  useEffect(() => {
    if (salesWithCommission && salesWithCommission.length > 0) {
      console.log('Processing sales with commission for display:', salesWithCommission.length);
      
      // Filter by status if needed
      let filtered = [...salesWithCommission];
      
      if (activeFilter === FILTER_PAID) {
        filtered = filtered.filter(sale => sale.status === 'approved');
      } else if (activeFilter === FILTER_UNPAID) {
        filtered = filtered.filter(sale => sale.status === 'pending');
      }
      
      // Sort by date, newest first
      filtered.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log(`Displaying ${filtered.length} sales with commission (${activeFilter} filter)`);
      setFilteredSales(filtered);
    } else {
      setFilteredSales([]);
    }
  }, [salesWithCommission, activeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Calculate commission based on rule and sale
  const calculateCommission = (sale: any) => {
    if (!activeCommissionRule) return 0;
    
    const ruleValue = safeNumberConversion(activeCommissionRule.value);
    const ruleType = activeCommissionRule.type;
    const salePrice = safeNumberConversion(sale.salePrice);
    const basePrice = safeNumberConversion(sale.product?.basePrice || 0);
    const quantity = safeNumberConversion(sale.quantity);
    
    let commissionAmount = 0;
    
    switch (ruleType) {
      case 'PERCENTAGE_OF_SALES':
        commissionAmount = (salePrice * quantity) * (ruleValue / 100);
        break;
      case 'FIXED_AMOUNT':
        commissionAmount = ruleValue * quantity;
        break;
      case 'PERCENTAGE_ON_DIFFERENCE':
        const priceDifference = salePrice - basePrice;
        commissionAmount = (priceDifference * quantity) * (ruleValue / 100);
        break;
      default:
        commissionAmount = 0;
    }
    
    return commissionAmount > 0 ? commissionAmount : 0;
  };

  // Helper function for safe number conversion
  const safeNumberConversion = (value: string | number): number => {
    if (typeof value === 'string') {
      return parseFloat(value) || 0;
    }
    return value || 0;
  };

  const handleMarkAsPaid = async (commissionId: string) => {
    try {
      await markCommissionAsPaid(commissionId);
      Alert.alert('Success', 'Commission marked as paid');
      await loadData();
    } catch (error) {
      console.error('Failed to mark commission as paid:', error);
      Alert.alert('Error', 'Failed to mark commission as paid');
    }
  };

  const renderFilterTab = (label: string, filter: string) => (
    <TouchableOpacity
      style={[
        styles.filterTab,
        activeFilter === filter && styles.activeFilterTab
      ]}
      onPress={() => setActiveFilter(filter)}
    >
      <Text
        style={[
          styles.filterTabText,
          activeFilter === filter && styles.activeFilterTabText
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderCommissionItem = ({ item }: { item: any }) => {
    const isPaid = item.status === 'approved';
    const commissionAmount = calculateCommission(item);
    const formattedDate = format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm');
    
    return (
      <View style={styles.commissionItem}>
        <View style={styles.commissionHeader}>
          <View style={styles.commissionDetails}>
            <Text style={styles.commissionId}>Sale ID: {item.id.slice(0, 8)}</Text>
            <Text style={styles.commissionDate}>
              <MaterialCommunityIcons name="calendar" size={14} color="#64748B" /> {formattedDate}
            </Text>
          </View>
          <View 
            style={[
              styles.paymentStatus, 
              { backgroundColor: isPaid ? '#ECFDF5' : '#FEF9C3' }
            ]}
          >
            <MaterialCommunityIcons 
              name={isPaid ? 'check-circle' : 'clock-outline'} 
              size={16} 
              color={isPaid ? '#10B981' : '#F59E0B'} 
            />
            <Text 
              style={[
                styles.statusText, 
                { color: isPaid ? '#10B981' : '#F59E0B' }
              ]}
            >
              {isPaid ? 'Paid' : 'Pending'}
            </Text>
          </View>
        </View>
        
        {/* Product details */}
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{item.product?.productName || 'Unknown Product'}</Text>
          <Text style={styles.saleDetails}>
            {item.quantity} × ₹{safeNumberConversion(item.salePrice).toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.commissionBody}>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Commission Amount:</Text>
            <Text style={styles.amountValue}>{formatCurrency(commissionAmount)}</Text>
          </View>
        </View>
        
        {!isPaid && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleMarkAsPaid(item.id)}
            >
              <MaterialCommunityIcons name="cash-check" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Mark as Paid</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="cash-multiple" size={60} color="#CBD5E1" />
      <Text style={styles.emptyStateTitle}>No commissions found</Text>
      <Text style={styles.emptyStateDescription}>
        {activeFilter === FILTER_ALL
          ? "You don't have any commission records yet."
          : activeFilter === FILTER_PAID
          ? "You don't have any paid commissions yet."
          : "You don't have any unpaid commissions."}
      </Text>
      {activeFilter !== FILTER_ALL && (
        <TouchableOpacity 
          style={styles.viewAllButton} 
          onPress={() => setActiveFilter(FILTER_ALL)}
        >
          <Text style={styles.viewAllButtonText}>View All Commissions</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading commission history...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Commissions History',
        }}
      />
      
      <View style={styles.summaryContainer}>
        {commissionSummary && (
          <>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Commission</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(safeNumberConversion(commissionSummary.totalCommission))}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Approved</Text>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                {formatCurrency(safeNumberConversion(commissionSummary.approvedSalesCommission))}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
                {formatCurrency(safeNumberConversion(commissionSummary.pendingSalesCommission))}
              </Text>
            </View>
          </>
        )}
      </View>
      
      <View style={styles.filterContainer}>
        {renderFilterTab('All', FILTER_ALL)}
        {renderFilterTab('Paid', FILTER_PAID)}
        {renderFilterTab('Unpaid', FILTER_UNPAID)}
      </View>
      
      <FlatList
        data={filteredSales}
        renderItem={renderCommissionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.commissionsList}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007bff']}
            tintColor="#007bff"
          />
        }
      />
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
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: '#EFF6FF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeFilterTabText: {
    color: '#007bff',
    fontWeight: '600',
  },
  commissionsList: {
    padding: 16,
    paddingBottom: 24,
  },
  commissionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  commissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  commissionDetails: {
    flex: 1,
  },
  commissionId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  commissionDate: {
    fontSize: 12,
    color: '#64748B',
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  commissionBody: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    marginBottom: 24,
  },
  viewAllButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewAllButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  productDetails: {
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  saleDetails: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
}); 