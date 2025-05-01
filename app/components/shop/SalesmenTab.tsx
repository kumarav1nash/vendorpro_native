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
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../../../src/contexts/UserContext';
import { useShop } from '../../../src/contexts/ShopContext';
import { useSales } from '../../../src/contexts/SalesContext';
import { useCommission } from '../../../src/contexts/CommissionContext';
import { User, UserRole, UserProfile } from '../../../src/types/user';
import { CreateSalesmanDto, Shop } from '../../../src/types/shop';
import { Sale } from '../../../src/types/sales';
import { Commission, CommissionRule, CommissionSummary, SalesCommissionResponse } from '../../../src/types/commission';

type SalesmenTabProps = {
  shopId: string;
  shop: Shop;
};

// Extend the User type to include profile info
interface UserWithProfile extends User {
  profile?: UserProfile;
}



type PerformanceMetrics = {
  totalSales: number;
  totalAmount: number;
  totalCommission: number;
  completedSales: number;
  pendingSales: number;
};

export default function SalesmenTab({ shopId }: SalesmenTabProps) {
  const { fetchUsersByRole, updateUser, user } = useUser();
  const { createSalesman, getShopSalesmen, removeSalesman } = useShop();
  const { fetchAllSales, sales } = useSales();
  const { 
    commissions, 
    commissionResponse,
    commissionSummary,
    rules: commissionRules,
    fetchCommissionsBySalesman,
    fetchAllCommissionRules
  } = useCommission();
  
  const [shopSalesmen, setShopSalesmen] = useState<UserWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSalesmen, setFilteredSalesmen] = useState<UserWithProfile[]>([]);
  const [salesmanCommissions, setSalesmanCommissions] = useState<Commission[]>([]);
  const [salesmanCommissionSummary, setSalesmanCommissionSummary] = useState<CommissionSummary[]>([]);
  const [allSalesmenCommissionData, setAllSalesmenCommissionData] = useState<Map<string, CommissionSummary | null>>(new Map());
  const [totalCommissionSum, setTotalCommissionSum] = useState(0);
  
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
    commissionRuleId: '',
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
  
  // Dropdown state
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  
  // KPI metrics state
  const [metrics, setMetrics] = useState({
    totalSalesmen: 0,
    activeSalesmen: 0,
    totalCommission: 0,
    topPerformer: '',
    topPerformerSales: 0
  });
  
  useEffect(() => {
    loadSalesmen();
    loadSales();
    loadCommissionRules();
  }, [shopId]);
  
  useEffect(() => {
    if (shopSalesmen.length > 0) {
      loadAllSalesmenCommissions();
    }
  }, [shopSalesmen]);
  
  useEffect(() => {
    if (commissionResponse && selectedSalesman) {
      // This is for the individual salesman view
      if (commissionSummary) {
        setSalesmanPerformance(prev => ({
          ...prev,
          totalCommission: commissionSummary.totalCommission
        }));
      }
    }
  }, [commissionResponse, commissionSummary]);
  
  useEffect(() => {
    let total = 0;
    allSalesmenCommissionData.forEach((summary) => {
      if (summary) {
        total += summary.totalCommission;
      }
    });
    setTotalCommissionSum(total);
  }, [allSalesmenCommissionData]);
  
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

  const loadCommissionRules = async () => {
    try {
      await fetchAllCommissionRules();
    } catch (error) {
      console.error('Error loading commission rules:', error);
    }
  };

  // Function to load commissions for a specific salesman
  const loadSalesmanCommissions = async (salesmanId: string) => {
    try {
      await fetchCommissionsBySalesman(salesmanId);
    } catch (error) {
      console.error('Error loading salesman commissions:', error);
    }
  };
  
  // Function to load commissions for all salesmen
  const loadAllSalesmenCommissions = async () => {
    const commissionMap = new Map<string, CommissionSummary | null>();
    
    for (const salesman of shopSalesmen) {
      try {
        await fetchCommissionsBySalesman(salesman.id);
        
        if (commissionSummary) {
          commissionMap.set(salesman.id, commissionSummary);
        }
      } catch (error) {
        console.error(`Error loading commissions for salesman ${salesman.id}:`, error);
      }
    }
    
    setAllSalesmenCommissionData(commissionMap);
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
    const salesmanSales = sales.filter(sale => sale.salesman.id === salesmanId);
    
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
      commissionRuleId: '', // This would need to be fetched if stored elsewhere
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
      commissionRuleId: '',
      isActive: true,
    });
    setCurrentSalesman(null);
  };
  
  const viewPerformance = async (salesman: UserWithProfile) => {
    setSelectedSalesman(salesman);
    
    // Load commissions first
    await loadSalesmanCommissions(salesman.id);
    
    // Calculate performance metrics
    const salesmanSales = sales.filter(sale => sale.salesman.id === salesman.id);
    
    // Calculate totals
    const totalSales = salesmanSales.length;
    const totalAmount = salesmanSales.reduce((sum, sale) => 
      sum + (typeof sale.totalAmount === 'string' ? parseFloat(sale.totalAmount) : sale.totalAmount || 0), 0);
    
    // Get commission from actual commissions
    const totalCommission = salesmanCommissionSummary.reduce((sum, commission) => 
      sum + commission.totalCommission, 0);
    
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
  
  // Calculate metrics when data changes
  useEffect(() => {
    if (shopSalesmen.length > 0 && sales) {
      // Calculate basic metrics
      const totalSalesmen = shopSalesmen.length;
      const activeSalesmen = shopSalesmen.filter(s => s.isActive).length;
      
      // Calculate sales metrics and find top performer
      let topPerformerSales = 0;
      let topPerformer = '';
      
      // Create a map of salesman ID to their sales count
      const salesBySalesman = new Map<string, number>();
      const amountBySalesman = new Map<string, number>();
      
      // Process sales data
      sales.forEach(sale => {
        // Skip if not approved
        if (sale.status !== 'approved') return;
        
        const salesmanId = sale.salesman.id || '';
        if (!salesmanId) return;
        
        // Count sales by salesman
        const currentCount = salesBySalesman.get(salesmanId) || 0;
        salesBySalesman.set(salesmanId, currentCount + 1);
        
        // Sum amount by salesman
        const saleAmount = typeof sale.totalAmount === 'string' 
          ? parseFloat(sale.totalAmount) 
          : (sale.totalAmount || 0);
        
        const currentAmount = amountBySalesman.get(salesmanId) || 0;
        amountBySalesman.set(salesmanId, currentAmount + saleAmount);
      });
      
      // Find top performer
      shopSalesmen.forEach(salesman => {
        const salesCount = salesBySalesman.get(salesman.id) || 0;
        if (salesCount > topPerformerSales) {
          topPerformerSales = salesCount;
          topPerformer = salesman.profile?.firstName || salesman.email || salesman.phoneNumber || 'Unknown';
        }
      });
      
      // Update metrics
      setMetrics({
        totalSalesmen,
        activeSalesmen,
        totalCommission: totalCommissionSum,
        topPerformer,
        topPerformerSales
      });
    }
  }, [shopSalesmen, sales, totalCommissionSum]);
  
  // Render KPI metrics
  const renderMetricsCards = () => {
    return (
      <View style={styles.metricsContainer}>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <MaterialCommunityIcons name="account-group" size={24} color="#007AFF" />
            </View>
            <View style={styles.metricTextContainer}>
              <Text style={styles.metricValue}>{metrics.totalSalesmen}</Text>
              <Text style={styles.metricLabel}>Total Salesmen</Text>
            </View>
          </View>
          
          <View style={styles.metricCard}>
            <View style={[styles.metricIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="account-check" size={24} color="#4CAF50" />
            </View>
            <View style={styles.metricTextContainer}>
              <Text style={styles.metricValue}>{metrics.activeSalesmen}</Text>
              <Text style={styles.metricLabel}>Active Salesmen</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconContainer, { backgroundColor: '#FFF8E1' }]}>
              <MaterialCommunityIcons name="trophy" size={24} color="#FFC107" />
            </View>
            <View style={styles.metricTextContainer}>
              <Text style={styles.metricValue} numberOfLines={1}>{metrics.topPerformer || 'N/A'}</Text>
              <Text style={styles.metricLabel}>Top Performer ({metrics.topPerformerSales} sales)</Text>
            </View>
          </View>
          
          <View style={styles.metricCard}>
            <View style={[styles.metricIconContainer, { backgroundColor: '#E3F2FD' }]}>
              <MaterialCommunityIcons name="currency-inr" size={24} color="#2196F3" />
            </View>
            <View style={styles.metricTextContainer}>
              <Text style={styles.metricValue}>₹{metrics.totalCommission.toFixed(2)}</Text>
              <Text style={styles.metricLabel}>Total Commission</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };
  
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
      {/* KPI Metrics Section */}
      {!isLoading && renderMetricsCards()}
      
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
              <View>
                <View style={styles.formField}>
                  <Text style={styles.label}>First Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="First name"
                    value={salesmanForm.firstName}
                    onChangeText={(value) => handleInputChange('firstName', value)}
                    onFocus={() => setIsDropdownVisible(false)}
                  />
                </View>
                
                <View style={styles.formField}>
                  <Text style={styles.label}>Last Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Last name"
                    value={salesmanForm.lastName}
                    onChangeText={(value) => handleInputChange('lastName', value)}
                    onFocus={() => setIsDropdownVisible(false)}
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
                    onFocus={() => setIsDropdownVisible(false)}
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
                    onFocus={() => setIsDropdownVisible(false)}
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
                      onFocus={() => setIsDropdownVisible(false)}
                    />
                  </View>
                )}
                
                <View style={styles.formField}>
                  <Text style={styles.label}>Commission Rule</Text>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => {
                      setIsDropdownVisible(!isDropdownVisible);
                    }}
                  >
                    <Text style={styles.dropdownButtonText}>
                      {salesmanForm.commissionRuleId 
                        ? commissionRules.find(rule => rule.id === salesmanForm.commissionRuleId)?.description || 'Select commission rule'
                        : 'Select commission rule'
                      }
                    </Text>
                    <MaterialCommunityIcons 
                      name={isDropdownVisible ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                  
                  {isDropdownVisible && (
                    <View style={styles.dropdownList}>
                      <ScrollView 
                        style={{ maxHeight: 200 }}
                        nestedScrollEnabled={true}
                      >
                        {commissionRules.length > 0 ? (
                          commissionRules.map((rule) => (
                            <TouchableOpacity 
                              key={rule.id}
                              style={[
                                styles.dropdownItem,
                                salesmanForm.commissionRuleId === rule.id && styles.dropdownItemSelected
                              ]}
                              onPress={() => {
                                handleInputChange('commissionRuleId', rule.id);
                                setIsDropdownVisible(false);
                              }}
                            >
                              <View>
                                <Text style={[
                                  styles.dropdownItemText,
                                  salesmanForm.commissionRuleId === rule.id && styles.dropdownItemTextSelected
                                ]}>
                                  {rule.description}
                                </Text>
                                <Text style={styles.dropdownItemDetail}>
                                  {rule.type === 'PERCENTAGE_OF_SALES' 
                                    ? `${rule.value}% of sales` 
                                    : rule.type === 'FIXED_AMOUNT' 
                                      ? `Fixed ₹${rule.value}` 
                                      : `${rule.value}% of price difference`}
                                </Text>
                              </View>
                              {salesmanForm.commissionRuleId === rule.id && (
                                <MaterialCommunityIcons name="check" size={20} color="#007AFF" />
                              )}
                            </TouchableOpacity>
                          ))
                        ) : (
                          <Text style={styles.noRulesText}>No commission rules available</Text>
                        )}
                      </ScrollView>
                    </View>
                  )}
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
              </View>
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
                
                {commissions.length > 0 && (
                  <View style={styles.commissionSection}>
                    <Text style={styles.sectionTitle}>Commission Details</Text>
                    <View style={styles.commissionHeader}>
                      <Text style={styles.commissionHeaderText}>Amount</Text>
                      <Text style={styles.commissionHeaderText}>Status</Text>
                      <Text style={styles.commissionHeaderText}>Date</Text>
                    </View>
                    {commissions.filter(c => c.salesmanId === selectedSalesman.id).slice(0, 5).map(commission => (
                      <View key={commission.id} style={styles.commissionRow}>
                        <Text style={styles.commissionAmount}>₹{commission.amount}</Text>
                        <View style={[styles.statusBadge, commission.isPaid ? styles.paidBadge : styles.unpaidBadge]}>
                          <Text style={styles.statusText}>{commission.isPaid ? 'Paid' : 'Unpaid'}</Text>
                        </View>
                        <Text style={styles.commissionDate}>
                          {new Date(commission.createdAt).toLocaleDateString('en-IN')}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                
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
    height: 50,
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
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: '#E5F5E8',
  },
  inactiveBadge: {
    backgroundColor: '#eee',
  },
  paidBadge: {
    backgroundColor: '#E5F5E8',
  },
  unpaidBadge: {
    backgroundColor: '#FFE8E8',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
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
    marginTop: 12,
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
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  formField: {
    marginHorizontal: 16,
    marginVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  usernameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  generateText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
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
    margin: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  salesmanProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  salesmanProfileInfo: {
    marginLeft: 16,
  },
  salesmanProfileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  salesmanProfileDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  performanceContainer: {
    flexDirection: 'row',
    padding: 8,
  },
  performanceCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  performanceProgress: {
    padding: 16,
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
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 24,
  },
  pickerContainer: {
    marginTop: 8,
    maxHeight: 65,
  },
  ruleOption: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedRuleOption: {
    backgroundColor: '#E1F5FE',
    borderColor: '#007AFF',
  },
  ruleOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedRuleOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  noRulesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    padding: 8,
  },
  commissionSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  commissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  commissionHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commissionAmount: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  commissionDate: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownList: {
    position: 'absolute',
    top: 74,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#E1F5FE',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  dropdownItemTextSelected: {
    color: '#007AFF',
  },
  dropdownItemDetail: {
    fontSize: 12,
    color: '#666',
  },
  metricsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    width: '48%',
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricTextContainer: {
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
}); 