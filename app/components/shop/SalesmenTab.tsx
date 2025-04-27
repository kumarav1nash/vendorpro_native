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
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../../../src/contexts/UserContext';
import { useShop } from '../../../src/contexts/ShopContext';
import { useSales } from '../../../src/contexts/SalesContext';
import { User, UserRole, UserProfile } from '../../../src/types/user';
import { CreateSalesmanDto } from '../../../src/types/shop';
import { Sale } from '../../../src/types/sales';

type SalesmenTabProps = {
  shopId: string;
};

// Extend the User type to include profile info
interface UserWithProfile extends User {
  profile?: UserProfile;
}

// Extend the Sale type to include calculated fields
interface ExtendedSale extends Sale {
  totalAmount?: number;
  commission?: number;
}

type PerformanceMetrics = {
  totalSales: number;
  totalAmount: number;
  totalCommission: number;
  completedSales: number;
  pendingSales: number;
};

export default function SalesmenTab({ shopId }: SalesmenTabProps) {
  const { fetchUsersByRole, updateUser, users } = useUser();
  const { createSalesman, getShopSalesmen, removeSalesman } = useShop();
  const { fetchAllSales, sales } = useSales();
  
  const [shopSalesmen, setShopSalesmen] = useState<UserWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSalesmen, setFilteredSalesmen] = useState<UserWithProfile[]>([]);
  
  // Form state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSalesman, setCurrentSalesman] = useState<UserWithProfile | null>(null);
  const [salesmanForm, setSalesmanForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    commissionRate: '',
    isActive: true,
  });
  
  // Performance metrics state
  const [selectedSalesman, setSelectedSalesman] = useState<UserWithProfile | null>(null);
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
    loadSales();
  }, [shopId]);
  
  useEffect(() => {
    if (shopSalesmen.length > 0) {
      if (searchQuery.trim() === '') {
        setFilteredSalesmen(shopSalesmen);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = shopSalesmen.filter(salesman => 
          (salesman.profile?.firstName && salesman.profile.firstName.toLowerCase().includes(query)) ||
          (salesman.profile?.lastName && salesman.profile.lastName.toLowerCase().includes(query)) ||
          salesman.phoneNumber.includes(query) ||
          (salesman.email && salesman.email.toLowerCase().includes(query))
        );
        setFilteredSalesmen(filtered);
      }
    }
  }, [searchQuery, shopSalesmen]);
  
  const loadSalesmen = async () => {
    setIsLoading(true);
    try {
      const salesmenData = await getShopSalesmen(shopId) as UserWithProfile[];
      setShopSalesmen(salesmenData);
      setFilteredSalesmen(salesmenData);
    } catch (error) {
      console.error('Error loading salesmen:', error);
      Alert.alert('Error', 'Failed to load salesmen');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadSales = async () => {
    try {
      await fetchAllSales({ shopId });
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };
  
  const handleInputChange = (field: string, value: string | number | boolean) => {
    setSalesmanForm({ ...salesmanForm, [field]: value });
  };
  
  const validateForm = () => {
    const requiredFields = ['firstName', 'lastName', 'phoneNumber'];
    
    for (const field of requiredFields) {
      if (!salesmanForm[field as keyof typeof salesmanForm]) {
        Alert.alert('Error', `${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        return false;
      }
    }
    
    // Validate phone number
    if (!/^\d{10}$/.test(salesmanForm.phoneNumber)) {
      Alert.alert('Error', 'Phone number must be 10 digits');
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
  
  const handleAddSalesman = async () => {
    if (!validateForm()) return;
    
    const newSalesmanData: CreateSalesmanDto = {
      firstName: salesmanForm.firstName,
      lastName: salesmanForm.lastName,
      phoneNumber: salesmanForm.phoneNumber,
      email: salesmanForm.email || '',
      password: salesmanForm.password || '',
      username: `${salesmanForm.firstName.toLowerCase()}${Math.floor(Math.random() * 100)}`
    };
    
    try {
      await createSalesman(shopId, newSalesmanData);
      setIsModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Salesman added successfully');
      loadSalesmen();
    } catch (error) {
      console.error('Error adding salesman:', error);
      Alert.alert('Error', 'Failed to add salesman');
    }
  };
  
  const handleEditSalesman = async () => {
    if (!validateForm() || !currentSalesman) return;
    
    try {
      // Note: This is simplified and may need adjustment based on your API
      const userData: Partial<User> = {
        isActive: salesmanForm.isActive
      };
      
      // Update user data
      await updateUser(currentSalesman.id, userData);
      
      setIsModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Salesman updated successfully');
      loadSalesmen();
    } catch (error) {
      console.error('Error updating salesman:', error);
      Alert.alert('Error', 'Failed to update salesman');
    }
  };
  
  const handleDeleteSalesman = (salesmanId: string) => {
    // Check if salesman has any sales
    const salesmanSales = sales.filter(sale => sale.salesmanId === salesmanId);
    
    if (salesmanSales.length > 0) {
      Alert.alert(
        'Cannot Delete Salesman',
        'This salesman has sales associated with them. Remove the sales first or assign them to another salesman.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Remove Salesman',
      'Are you sure you want to remove this salesman from the shop?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeSalesman(shopId, salesmanId);
              Alert.alert('Success', 'Salesman removed successfully');
              loadSalesmen();
            } catch (error) {
              console.error('Error removing salesman:', error);
              Alert.alert('Error', 'Failed to remove salesman');
            }
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
  
  const openEditModal = (salesman: UserWithProfile) => {
    setIsEditMode(true);
    setCurrentSalesman(salesman);
    setSalesmanForm({
      firstName: salesman.profile?.firstName || '',
      lastName: salesman.profile?.lastName || '',
      phoneNumber: salesman.phoneNumber,
      email: salesman.email || '',
      password: '',
      commissionRate: '', // Commission may need to be fetched from user profile or elsewhere
      isActive: salesman.isActive,
    });
    setIsModalVisible(true);
  };
  
  const resetForm = () => {
    setSalesmanForm({
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      password: '',
      commissionRate: '',
      isActive: true,
    });
    setCurrentSalesman(null);
  };
  
  const viewPerformance = (salesman: UserWithProfile) => {
    setSelectedSalesman(salesman);
    
    // Calculate performance metrics
    const salesmanSales = sales.filter(sale => sale.salesmanId === salesman.id) as ExtendedSale[];
    
    // Calculate derived values that aren't in the Sale type
    const totalSales = salesmanSales.length;
    const totalAmount = salesmanSales.reduce((sum, sale) => 
      sum + (sale.totalAmount || (sale.salePrice * sale.quantity)), 0);
    
    // Calculate commission (assuming 10% if not defined elsewhere)
    const commissionRate = 10; // Default rate - you may want to store this in user profile
    const totalCommission = salesmanSales.reduce((sum, sale) => 
      sum + (sale.commission || ((sale.salePrice * sale.quantity) * commissionRate / 100)), 0);
    
    // Count approved sales as "completed"
    const completedSales = salesmanSales.filter(sale => sale.status === 'approved').length;
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
  
  // Generate a random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleInputChange('password', password);
  };

  // Generate a username based on name
  const generateUsername = () => {
    if (!salesmanForm.firstName.trim()) {
      Alert.alert('Error', 'Please enter salesman first name first');
      return;
    }
    
    // Create username from name
    let username = salesmanForm.firstName.trim().toLowerCase();
    
    if (salesmanForm.lastName.trim()) {
      username += salesmanForm.lastName.trim().toLowerCase().charAt(0);
    }
    
    // Add random number to make it unique
    username += Math.floor(Math.random() * 100);
    
    handleInputChange('email', `${username}@example.com`);
  };
  
  const getFullName = (user: UserWithProfile) => {
    return `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown';
  };
  
  const renderSalesmanItem = ({ item }: { item: UserWithProfile }) => (
    <View style={[styles.salesmanItem, !item.isActive && styles.inactiveSalesman]}>
      <View style={styles.salesmanHeader}>
        <View>
          <Text style={styles.salesmanName}>{getFullName(item)}</Text>
          <Text style={styles.salesmanContact}>{item.phoneNumber}</Text>
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
        {item.email && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{item.email}</Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <View style={[styles.statusBadge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
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
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
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
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  value={salesmanForm.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  value={salesmanForm.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit phone number"
                  value={salesmanForm.phoneNumber}
                  onChangeText={(value) => handleInputChange('phoneNumber', value)}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              
              <View style={styles.formField}>
                <View style={styles.usernameContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TouchableOpacity onPress={generateUsername}>
                    <Text style={styles.generateText}>Generate</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email (optional)"
                  value={salesmanForm.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              
              {!isEditMode && (
                <View style={styles.formField}>
                  <View style={styles.usernameContainer}>
                    <Text style={styles.label}>Password</Text>
                    <TouchableOpacity onPress={generatePassword}>
                      <Text style={styles.generateText}>Generate</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password (optional)"
                    value={salesmanForm.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry={true}
                  />
                </View>
              )}
              
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
              
              {isEditMode && (
                <View style={styles.formField}>
                  <View style={styles.switchContainer}>
                    <Text style={styles.label}>Active Status</Text>
                    <Switch
                      trackColor={{ false: "#ccc", true: "#007AFF" }}
                      thumbColor="#fff"
                      ios_backgroundColor="#ccc"
                      onValueChange={(value) => handleInputChange('isActive', value)}
                      value={salesmanForm.isActive}
                    />
                  </View>
                </View>
              )}
              
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
                    <Text style={styles.salesmanProfileName}>{getFullName(selectedSalesman)}</Text>
                    <Text style={styles.salesmanProfileDetail}>{selectedSalesman.phoneNumber}</Text>
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
  clearSearch: {
    padding: 4,
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
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  inactiveSalesman: {
    borderLeftColor: '#ccc',
    opacity: 0.7,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  inactiveBadge: {
    backgroundColor: '#999',
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
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
  usernameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  generateText: {
    color: '#007AFF',
    fontSize: 14,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
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