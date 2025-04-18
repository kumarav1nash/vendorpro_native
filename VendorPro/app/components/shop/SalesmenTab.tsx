import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSalesmen, Salesman } from '../../contexts/SalesmenContext';
import { useSales, Sale } from '../../contexts/SalesContext';

type SalesmenTabProps = {
  shopId: string;
};

type PerformanceMetrics = {
  totalSales: number;
  totalAmount: number;
  totalCommission: number;
  completedSales: number;
  pendingSales: number;
};

export default function SalesmenTab({ shopId }: SalesmenTabProps) {
  const { salesmen, addSalesman, updateSalesman, deleteSalesman, getShopSalesmen } = useSalesmen();
  const { sales, getShopSales } = useSales();
  
  const [shopSalesmen, setShopSalesmen] = useState<Salesman[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSalesmen, setFilteredSalesmen] = useState<Salesman[]>([]);
  
  // Form state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSalesman, setCurrentSalesman] = useState<Salesman | null>(null);
  const [salesmanForm, setSalesmanForm] = useState({
    name: '',
    mobile: '',
    username: '',
    commissionRate: '',
  });
  
  // Performance metrics state
  const [selectedSalesman, setSelectedSalesman] = useState<Salesman | null>(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [salesmanPerformance, setSalesmanPerformance] = useState<PerformanceMetrics>({
    totalSales: 0,
    totalAmount: 0,
    totalCommission: 0,
    completedSales: 0,
    pendingSales: 0,
  });
  
  useEffect(() => {
    loadSalesmen();
  }, [shopId, salesmen]);
  
  useEffect(() => {
    if (shopSalesmen.length > 0) {
      if (searchQuery.trim() === '') {
        setFilteredSalesmen(shopSalesmen);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = shopSalesmen.filter(salesman => 
          salesman.name.toLowerCase().includes(query) ||
          salesman.mobile.includes(query) ||
          (salesman.username && salesman.username.toLowerCase().includes(query))
        );
        setFilteredSalesmen(filtered);
      }
    }
  }, [searchQuery, shopSalesmen]);
  
  const loadSalesmen = () => {
    setIsLoading(true);
    const salesmenForShop = getShopSalesmen(shopId);
    setShopSalesmen(salesmenForShop);
    setFilteredSalesmen(salesmenForShop);
    setIsLoading(false);
  };
  
  const handleInputChange = (field: string, value: string) => {
    setSalesmanForm({ ...salesmanForm, [field]: value });
  };
  
  const validateForm = () => {
    const requiredFields = ['name', 'mobile'];
    
    for (const field of requiredFields) {
      if (!salesmanForm[field as keyof typeof salesmanForm]) {
        Alert.alert('Error', `${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        return false;
      }
    }
    
    // Validate mobile number
    if (!/^\d{10}$/.test(salesmanForm.mobile)) {
      Alert.alert('Error', 'Mobile number must be 10 digits');
      return false;
    }
    
    // Validate commission rate is a valid percentage
    if (salesmanForm.commissionRate) {
      const rate = parseFloat(salesmanForm.commissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        Alert.alert('Error', 'Commission rate must be between 0 and 100');
        return false;
      }
    }
    
    return true;
  };
  
  const handleAddSalesman = () => {
    if (!validateForm()) return;
    
    const newSalesman: Salesman = {
      id: Date.now().toString(),
      shopId: shopId,
      name: salesmanForm.name,
      mobile: salesmanForm.mobile,
      username: salesmanForm.username || undefined,
      commissionRate: salesmanForm.commissionRate ? parseFloat(salesmanForm.commissionRate) : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    addSalesman(newSalesman);
    
    setIsModalVisible(false);
    resetForm();
    
    Alert.alert('Success', 'Salesman added successfully');
    loadSalesmen();
  };
  
  const handleEditSalesman = () => {
    if (!validateForm() || !currentSalesman) return;
    
    const updatedSalesman: Salesman = {
      ...currentSalesman,
      name: salesmanForm.name,
      mobile: salesmanForm.mobile,
      username: salesmanForm.username || undefined,
      commissionRate: salesmanForm.commissionRate ? parseFloat(salesmanForm.commissionRate) : 0,
      updatedAt: new Date().toISOString(),
    };
    
    updateSalesman(updatedSalesman);
    
    setIsModalVisible(false);
    resetForm();
    
    Alert.alert('Success', 'Salesman updated successfully');
    loadSalesmen();
  };
  
  const handleDeleteSalesman = (salesmanId: string) => {
    // Check if salesman has any sales
    const shopSales = getShopSales(shopId);
    const salesmanSales = shopSales.filter(sale => sale.salesmanId === salesmanId);
    
    if (salesmanSales.length > 0) {
      Alert.alert(
        'Cannot Delete Salesman',
        'This salesman has sales associated with them. Remove the sales first or assign them to another salesman.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Delete Salesman',
      'Are you sure you want to delete this salesman?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteSalesman(salesmanId);
            Alert.alert('Success', 'Salesman deleted successfully');
            loadSalesmen();
          }
        }
      ]
    );
  };
  
  const openAddModal = () => {
    setIsEditMode(false);
    resetForm();
    setIsModalVisible(true);
  };
  
  const openEditModal = (salesman: Salesman) => {
    setIsEditMode(true);
    setCurrentSalesman(salesman);
    setSalesmanForm({
      name: salesman.name,
      mobile: salesman.mobile,
      username: salesman.username || '',
      commissionRate: salesman.commissionRate ? salesman.commissionRate.toString() : '',
    });
    setIsModalVisible(true);
  };
  
  const resetForm = () => {
    setSalesmanForm({
      name: '',
      mobile: '',
      username: '',
      commissionRate: '',
    });
    setCurrentSalesman(null);
  };
  
  const viewPerformance = (salesman: Salesman) => {
    setSelectedSalesman(salesman);
    
    // Calculate performance metrics
    const shopSales = getShopSales(shopId);
    const salesmanSales = shopSales.filter(sale => sale.salesmanId === salesman.id);
    
    const totalSales = salesmanSales.length;
    const totalAmount = salesmanSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalCommission = salesmanSales.reduce((sum, sale) => sum + sale.commission, 0);
    const completedSales = salesmanSales.filter(sale => sale.status === 'completed').length;
    const pendingSales = salesmanSales.filter(sale => sale.status === 'pending').length;
    
    setSalesmanPerformance({
      totalSales,
      totalAmount,
      totalCommission,
      completedSales,
      pendingSales,
    });
    
    setShowPerformanceModal(true);
  };
  
  const renderSalesmanItem = ({ item }: { item: Salesman }) => (
    <View style={styles.salesmanItem}>
      <View style={styles.salesmanHeader}>
        <View>
          <Text style={styles.salesmanName}>{item.name}</Text>
          <Text style={styles.salesmanContact}>{item.mobile}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => viewPerformance(item)}
          >
            <MaterialCommunityIcons name="chart-bar" size={18} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <MaterialCommunityIcons name="pencil" size={18} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteSalesman(item.id)}
          >
            <MaterialCommunityIcons name="delete" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.salesmanDetails}>
        {item.username && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Username:</Text>
            <Text style={styles.detailValue}>{item.username}</Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Commission Rate:</Text>
          <Text style={styles.detailValue}>
            {item.commissionRate ? `${item.commissionRate}%` : 'Not set'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Joined:</Text>
          <Text style={styles.detailValue}>
            {new Date(item.createdAt).toLocaleDateString('en-IN')}
          </Text>
        </View>
      </View>
    </View>
  );
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading salesmen...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search salesmen..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      
      {filteredSalesmen.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-group" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No salesmen found</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={openAddModal}>
            <Text style={styles.emptyStateButtonText}>Add Salesman</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredSalesmen}
          renderItem={renderSalesmanItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      {/* Add/Edit Salesman Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Edit Salesman' : 'Add Salesman'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              <View style={styles.formField}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Salesman name"
                  value={salesmanForm.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.label}>Mobile *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  value={salesmanForm.mobile}
                  onChangeText={(value) => handleInputChange('mobile', value)}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Username (optional)"
                  value={salesmanForm.username}
                  onChangeText={(value) => handleInputChange('username', value)}
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.label}>Commission Rate (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10 for 10%"
                  value={salesmanForm.commissionRate}
                  onChangeText={(value) => handleInputChange('commissionRate', value)}
                  keyboardType="numeric"
                />
              </View>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={isEditMode ? handleEditSalesman : handleAddSalesman}
              >
                <Text style={styles.submitButtonText}>
                  {isEditMode ? 'Update Salesman' : 'Add Salesman'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Performance Modal */}
      <Modal
        visible={showPerformanceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPerformanceModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Performance Metrics</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPerformanceModal(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {selectedSalesman && (
              <ScrollView>
                <View style={styles.salesmanProfileHeader}>
                  <MaterialCommunityIcons name="account-circle" size={64} color="#007AFF" />
                  <View style={styles.salesmanProfileInfo}>
                    <Text style={styles.salesmanProfileName}>{selectedSalesman.name}</Text>
                    <Text style={styles.salesmanProfileDetail}>{selectedSalesman.mobile}</Text>
                    {selectedSalesman.commissionRate > 0 && (
                      <Text style={styles.salesmanProfileDetail}>
                        Commission Rate: {selectedSalesman.commissionRate}%
                      </Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.performanceContainer}>
                  <View style={styles.performanceCard}>
                    <Text style={styles.performanceValue}>
                      {salesmanPerformance.totalSales}
                    </Text>
                    <Text style={styles.performanceLabel}>Total Sales</Text>
                  </View>
                  
                  <View style={styles.performanceCard}>
                    <Text style={styles.performanceValue}>
                      ₹{salesmanPerformance.totalAmount.toFixed(2)}
                    </Text>
                    <Text style={styles.performanceLabel}>Total Revenue</Text>
                  </View>
                </View>
                
                <View style={styles.performanceContainer}>
                  <View style={styles.performanceCard}>
                    <Text style={styles.performanceValue}>
                      ₹{salesmanPerformance.totalCommission.toFixed(2)}
                    </Text>
                    <Text style={styles.performanceLabel}>Total Commission</Text>
                  </View>
                  
                  <View style={styles.performanceCard}>
                    <Text style={styles.performanceValue}>
                      {salesmanPerformance.completedSales}/{salesmanPerformance.totalSales}
                    </Text>
                    <Text style={styles.performanceLabel}>Completed Sales</Text>
                  </View>
                </View>
                
                {salesmanPerformance.totalSales > 0 ? (
                  <View style={styles.performanceProgress}>
                    <View style={styles.progressContainer}>
                      <Text style={styles.progressLabel}>Completion Rate</Text>
                      <Text style={styles.progressValue}>
                        {Math.round((salesmanPerformance.completedSales / salesmanPerformance.totalSales) * 100)}%
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${(salesmanPerformance.completedSales / salesmanPerformance.totalSales) * 100}%`,
                            backgroundColor: salesmanPerformance.completedSales === salesmanPerformance.totalSales ? '#4CD964' : '#007AFF'
                          }
                        ]} 
                      />
                    </View>
                  </View>
                ) : (
                  <Text style={styles.noDataText}>No sales data available for this salesman</Text>
                )}
              </ScrollView>
            )}
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
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  listContainer: {
    padding: 16,
  },
  salesmanItem: {
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
  salesmanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  salesmanName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  salesmanContact: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 6,
    marginLeft: 8,
  },
  salesmanDetails: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
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
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  formField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  salesmanProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  salesmanProfileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  salesmanProfileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  salesmanProfileDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  performanceContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  performanceCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  performanceProgress: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    fontStyle: 'italic',
  },
}); 