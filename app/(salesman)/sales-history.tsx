import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { format, set } from 'date-fns';
import { useSales } from '../../src/contexts/SalesContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Sale, SaleWithCommission } from '../../src/types/sales';
import { useCommission } from '@/src/contexts/CommissionContext';
import { ProductImage } from '../components/ui/ProductImage';

// Filter options
const FILTER_ALL = 'all';
const FILTER_PENDING = 'pending';
const FILTER_APPROVED = 'approved';
const FILTER_REJECTED = 'rejected';


export default function SalesHistoryScreen() {
  const { salesWithCommission, fetchAllSalesWithCommission, loading } = useSales();
  const { activeCommissionRule,fetchActiveCommissionRule } = useCommission();
  const { user } = useAuth();
  const [filteredSales, setFilteredSales] = useState<SaleWithCommission[]>([]);
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user?.id && salesWithCommission) {

      // Filter sales for current user with strong type checking
      
      // Apply status filter
      let statusFilteredSales = salesWithCommission;
      if (activeFilter !== FILTER_ALL) {
        statusFilteredSales = salesWithCommission.filter(sale => sale.status === activeFilter);
        console.log(`Applied ${activeFilter} filter:`, statusFilteredSales.length, 'items');
      }
      
      // Sort by most recent first
      statusFilteredSales.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setFilteredSales(statusFilteredSales);
    } else {
      console.log('No user ID or sales available');
      setFilteredSales([]);
    }
  }, [salesWithCommission, activeFilter, user?.id]);

  const loadData = async () => {
    if (!user?.id) {
      console.log('Cannot load sales: User ID is missing');
      return;
    }
    
    try {
      await fetchActiveCommissionRule(user.id);
      console.log('Fetching sales for salesman ID:', user.id);
      // Explicitly pass salesmanId parameter to fetch only user's sales
      if(activeCommissionRule){
        await fetchAllSalesWithCommission(activeCommissionRule, { salesmanId: user.id });
      }
      setFilteredSales(salesWithCommission)
      console.log('Sales fetched successfully');
    } catch (error: any) {
      if (error?.response?.status === 404) {
        console.log('No sales found (404 response)');
        setFilteredSales([]);
      } else {
        console.error('Failed to load sales:', error?.message || error);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'pending':
      default:
        return '#F59E0B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return 'check-circle';
      case 'rejected':
        return 'close-circle';
      case 'pending':
      default:
        return 'clock-outline';
    }
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${numAmount.toFixed(2)}`;
  };

  const renderSaleItem = ({ item }: { item: SaleWithCommission }) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);
    const formattedDate = format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm');
    // Use the first product's image for the card
    const firstProduct = item.items[0]?.product;
    return (
      <View style={styles.saleItem}>
        <View style={styles.saleBody}>
          <View style={styles.productInfo}>
            <ProductImage
              filename={firstProduct?.productImageFilename}
              fallbackUrl={firstProduct?.productImageUrl}
              width={48}
              height={48}
              borderRadius={8}
              placeholderIconSize={24}
              placeholderIconName="package-variant"
              placeholderIconColor="#9CA3AF"
            />
            <View style={styles.productDetails}>
              {/* List all products in the sale */}
              {item.items.map((saleItem, idx) => (
                <Text key={idx} style={styles.productName} numberOfLines={1}>
                  {saleItem.product?.productName || 'Unknown Product'} x {saleItem.quantity} @ {formatCurrency(saleItem.soldAt)}
                </Text>
              ))}
            </View>
          </View>
          {/* add the status just above footer aligned all the way right  */} 
          <View style={[styles.sellingPriceTag, {backgroundColor: `${statusColor}15`} ]}>
          <MaterialCommunityIcons name="cash-check" size={16} color={statusColor} />

            <Text style={[styles.statusText, {color: statusColor}]}>
              Earnings: {formatCurrency(item.commissionAmount)}
          </Text>
        </View>
          <View style={[styles.saleStatus, { backgroundColor: `${statusColor}15`}]}>
            <MaterialCommunityIcons name={statusIcon} size={16} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}> 
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        <View style={styles.saleFooter}>
          <Text style={styles.saleDate}>
            <MaterialCommunityIcons name="calendar" size={14} color="#64748B" /> {formattedDate}
          </Text>
          <Text style={styles.saleTotal}>{formatCurrency(item.totalAmount)}</Text>
        </View>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="receipt" size={60} color="#CBD5E1" />
      <Text style={styles.emptyStateTitle}>No sales found</Text>
      <Text style={styles.emptyStateDescription}>
        {activeFilter === FILTER_ALL
          ? "You haven't made any sales yet."
          : `No ${activeFilter} sales found.`}
      </Text>
      {activeFilter !== FILTER_ALL ? (
        <TouchableOpacity style={styles.createSaleButton} onPress={() => setActiveFilter(FILTER_ALL)}>
          <Text style={styles.createSaleButtonText}>Show All Sales</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.createSaleButton} onPress={() => router.push('/(salesman)/dashboard')}>
          <Text style={styles.createSaleButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !refreshing && !filteredSales.length) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading sales history...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Sales History',
        }}
      />
      
      <View style={styles.filterContainer}>
        {renderFilterTab('All', FILTER_ALL)}
        {renderFilterTab('Pending', FILTER_PENDING)}
        {renderFilterTab('Approved', FILTER_APPROVED)}
        {renderFilterTab('Rejected', FILTER_REJECTED)}
      </View>
      
      <FlatList
        data={filteredSales}
        renderItem={renderSaleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.salesList}
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
  salesList: {
    padding: 16,
    paddingBottom: 24,
  },
  saleItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    paddingTop: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  saleBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    marginLeft: 12,
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  sellingPriceTag: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderColor: '#0EA5E9',
    borderTopLeftRadius: 0,
    borderBottomRightRadius: 0,
    position: 'absolute', 
    top: -24, 
    right: -16,
    zIndex: 1,
  },
  sellingPriceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  productQuantity: {
    fontSize: 14,
    color: '#64748B',
  },
  saleStatus: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderRightWidth: 2,
    borderColor: '#0EA5E9',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    position: 'absolute', 
    bottom: -12, 
    right: -16,
    zIndex: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saleDate: {
    fontSize: 12,
    color: '#64748B',
  },
  saleTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
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
  createSaleButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createSaleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});