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
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCommission } from '../../src/contexts/CommissionContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Commission, CommissionDateRangeResult } from '../../src/types/commission';
import { formatCurrency } from '../../src/utils/formatting';
import { BlurView } from 'expo-blur';

// Filter options
const FILTER_ALL = 'all';
const FILTER_PAID = 'paid';
const FILTER_UNPAID = 'unpaid';

export default function CommissionsHistoryScreen() {
  const { 
    commissions, 
    dateRangeResult,
    fetchCommissionsByDateRange, 
    markCommissionAsPaid, 
    loading,
    salesWithCommission,
    commissionSummary,
    activeCommissionRule
  } = useCommission();
  const { user } = useAuth();
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [commissionDateRangeResult, setCommissionDateRangeResult] = useState<CommissionDateRangeResult | null>(null);
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);
  const [refreshing, setRefreshing] = useState(false);
  
  // Date picker state
  const currentDate = new Date();
  const [startDate, setStartDate] = useState(startOfMonth(subMonths(currentDate, 1)));
  const [endDate, setEndDate] = useState(endOfMonth(currentDate));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Total commission metrics
  const [totalCommissionData, setTotalCommissionData] = useState({
    totalCommission: 0,
    commissions: []
  });

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  // Load commissions data
  const loadData = async () => {
    if (!user?.id) {
      console.log('Cannot load commissions: User ID is missing');
      return;
    }
    
    try {
      console.log('Fetching commissions for salesman ID:', user.id);
      console.log('Date range:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));
      
       await fetchCommissionsByDateRange({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        salesmanId: user.id
      });
      
      // Store the response for showing metrics
      setCommissionDateRangeResult(dateRangeResult);
      
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

  // Update the useEffect to handle commission filtering when commissionDateRangeResult changes
  useEffect(() => {
    if (commissionDateRangeResult?.commissions && commissionDateRangeResult.commissions.length > 0) {
      console.log('Processing commissions for display:', commissionDateRangeResult.commissions.length);
      
      // Filter by paid status if needed
      let filtered = [...commissionDateRangeResult.commissions];
      
      if (activeFilter === FILTER_PAID) {
        filtered = filtered.filter(commission => commission.isPaid);
      } else if (activeFilter === FILTER_UNPAID) {
        filtered = filtered.filter(commission => !commission.isPaid);
      }
      
      // Sort by date, newest first
      filtered.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log(`Displaying ${filtered.length} commissions (${activeFilter} filter)`);
      setFilteredSales(filtered);
    } else {
      setFilteredSales([]);
    }
  }, [commissionDateRangeResult, activeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  // Date picker handlers
  const onStartDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    setStartDate(currentDate);
  };
  
  const onEndDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    setEndDate(currentDate);
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
    const isPaid = item.isPaid;
    const commissionAmount = safeNumberConversion(item.amount);
    const formattedDate = format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm');
    
    return (
      <View style={styles.commissionItem}>
        <View style={styles.commissionHeader}>
          <View style={styles.commissionDetails}>
            <Text style={styles.commissionId}>Commission ID: {item.id.slice(0, 8)}</Text>
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
        
        <View style={styles.commissionBody}>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Commission Amount:</Text>
            <Text style={styles.amountValue}>{formatCurrency(commissionAmount)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="cash-multiple" size={60} color="#CBD5E1" />
      <Text style={styles.emptyStateTitle}>No commissions found</Text>
      <Text style={styles.emptyStateDescription}>
        {activeFilter === FILTER_ALL
          ? "You don't have any commission records for the selected date range."
          : activeFilter === FILTER_PAID
          ? "You don't have any paid commissions for the selected date range."
          : "You don't have any unpaid commissions for the selected date range."}
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
      
      {/* Date Range Selector */}
      <View style={styles.dateRangeContainer}>
        <Text style={styles.dateRangeTitle}>Select Date Range</Text>
        <View style={styles.datePickersRow}>
          <TouchableOpacity 
            style={styles.datePickerButton} 
            onPress={() => setShowStartDatePicker(true)}
          >
            <MaterialCommunityIcons name="calendar-start" size={18} color="#007bff" />
            <Text style={styles.datePickerButtonText}>
              {format(startDate, 'dd MMM yyyy')}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.dateRangeSeparator}>to</Text>
          
          <TouchableOpacity 
            style={styles.datePickerButton} 
            onPress={() => setShowEndDatePicker(true)}
          >
            <MaterialCommunityIcons name="calendar-end" size={18} color="#007bff" />
            <Text style={styles.datePickerButtonText}>
              {format(endDate, 'dd MMM yyyy')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onStartDateChange}
            maximumDate={endDate}
          />
        )}
        
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onEndDateChange}
            minimumDate={startDate}
            maximumDate={new Date()}
          />
        )}
      </View>
      
      {/* Commission Summary Card */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeaderRow}>
          <Text style={styles.summaryHeaderTitle}>Commission Summary</Text>
          <View style={styles.summaryDateRange}>
            <MaterialCommunityIcons name="calendar-range" size={16} color="#64748B" />
            <Text style={styles.summaryDateRangeText}>
              {format(startDate, 'dd MMM')} - {format(endDate, 'dd MMM yyyy')}
            </Text>
          </View>
        </View>
        
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.primaryMetricCard]}>
            <Text style={styles.metricValue}>
              {formatCurrency(commissionDateRangeResult?.totalCommission || 0)}
            </Text>
            <Text style={styles.metricLabel}>Total Commission</Text>
          </View>
          
          <View style={[styles.metricCard, styles.infoMetricCard]}>
            <Text style={styles.metricValue}>
              {commissionDateRangeResult?.commissions?.length || 0}
            </Text>
            <Text style={styles.metricLabel}>Total Transactions</Text>
          </View>
        </View>
        
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.successMetricCard]}>
            <Text style={styles.metricValue}>
              {formatCurrency(commissionDateRangeResult?.commissions
                ?.filter(c => c.isPaid)
                .reduce((sum, c) => sum + safeNumberConversion(c.amount), 0) || 0)}
            </Text>
            <Text style={styles.metricLabel}>Paid Commission</Text>
          </View>
          
          <View style={[styles.metricCard, styles.warningMetricCard]}>
            <Text style={styles.metricValue}>
              {formatCurrency(commissionDateRangeResult?.commissions
                ?.filter(c => !c.isPaid)
                .reduce((sum, c) => sum + safeNumberConversion(c.amount), 0) || 0)}
            </Text>
            <Text style={styles.metricLabel}>Pending Commission</Text>
          </View>
        </View>
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
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  summaryDateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  summaryDateRangeText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  dateRangeContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dateRangeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  datePickersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#0F172A',
    marginLeft: 8,
  },
  dateRangeSeparator: {
    fontSize: 14,
    color: '#64748B',
    marginHorizontal: 8,
  },
}); 