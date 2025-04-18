import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSalesmen, Salesman } from '../contexts/SalesmenContext';

// Form state type for adding/editing salesmen
type SalesmanForm = Omit<Salesman, 'id' | 'createdAt' | 'updatedAt' | 'totalSales' | 'totalCommission'>;

export default function SalesmenScreen() {
  // State management
  const { salesmen, isLoading, loadSalesmen, addSalesman, updateSalesman, deleteSalesman } = useSalesmen();
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSalesmen, setFilteredSalesmen] = useState<Salesman[]>([]);
  const [currentSalesman, setCurrentSalesman] = useState<SalesmanForm>({
    name: '',
    mobile: '',
    username: '',
    password: '',
    commissionRate: 5, // Default commission rate (5%)
    isActive: true,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Load salesmen on component mount
  useEffect(() => {
    loadSalesmen();
  }, []);

  // Filter salesmen when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSalesmen(salesmen);
    } else {
      const filtered = salesmen.filter(salesman => 
        salesman.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salesman.mobile.includes(searchQuery) ||
        salesman.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSalesmen(filtered);
    }
  }, [searchQuery, salesmen]);

  // Reset the form
  const resetForm = () => {
    setCurrentSalesman({
      name: '',
      mobile: '',
      username: '',
      password: '',
      commissionRate: 5,
      isActive: true,
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  // Handle form input change
  const handleChange = (key: keyof SalesmanForm, value: string | number | boolean) => {
    setCurrentSalesman(prev => ({ ...prev, [key]: value }));
  };

  // Validate form
  const validateForm = () => {
    if (!currentSalesman.name.trim()) {
      Alert.alert('Error', 'Salesman name is required');
      return false;
    }
    
    if (!currentSalesman.mobile.trim() || currentSalesman.mobile.length < 10) {
      Alert.alert('Error', 'Valid mobile number is required');
      return false;
    }
    
    if (!currentSalesman.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return false;
    }
    
    if (!isEditing && !currentSalesman.password.trim()) {
      Alert.alert('Error', 'Password is required for new salesmen');
      return false;
    }
    
    if (currentSalesman.commissionRate < 0 || currentSalesman.commissionRate > 100) {
      Alert.alert('Error', 'Commission rate must be between 0 and 100%');
      return false;
    }
    
    // Check for duplicate username
    const duplicateUsername = salesmen.find(
      s => s.username.toLowerCase() === currentSalesman.username.toLowerCase() && 
      (!isEditing || s.id !== currentId)
    );
    
    if (duplicateUsername) {
      Alert.alert('Error', 'Username already exists. Please choose another.');
      return false;
    }
    
    // Check for duplicate mobile
    const duplicateMobile = salesmen.find(
      s => s.mobile === currentSalesman.mobile && 
      (!isEditing || s.id !== currentId)
    );
    
    if (duplicateMobile) {
      Alert.alert('Error', 'Mobile number already registered with another salesman');
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      if (isEditing && currentId) {
        // Handle password - don't update if empty (means keep existing)
        const updates = {...currentSalesman};
        if (!updates.password.trim()) {
          const existingSalesman = salesmen.find(s => s.id === currentId);
          if (existingSalesman) {
            updates.password = existingSalesman.password;
          }
        }
        
        await updateSalesman(currentId, updates);
        Alert.alert('Success', 'Salesman updated successfully');
      } else {
        await addSalesman(currentSalesman);
        Alert.alert('Success', 'Salesman added successfully');
      }
      
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving salesman:', error);
      Alert.alert('Error', 'Failed to save salesman');
    }
  };

  // Handle editing a salesman
  const handleEdit = (salesman: Salesman) => {
    setCurrentSalesman({
      name: salesman.name,
      mobile: salesman.mobile,
      username: salesman.username,
      password: '', // Don't show existing password
      commissionRate: salesman.commissionRate,
      isActive: salesman.isActive,
    });
    setIsEditing(true);
    setCurrentId(salesman.id);
    setShowModal(true);
  };

  // Handle deleting a salesman
  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Salesman',
      'Are you sure you want to delete this salesman? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSalesman(id);
              Alert.alert('Success', 'Salesman deleted successfully');
            } catch (error) {
              console.error('Error deleting salesman:', error);
              Alert.alert('Error', 'Failed to delete salesman');
            }
          },
        },
      ]
    );
  };

  // Generate a random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleChange('password', password);
  };

  // Generate a username based on name
  const generateUsername = () => {
    if (!currentSalesman.name.trim()) {
      Alert.alert('Error', 'Please enter salesman name first');
      return;
    }
    
    // Create username from name (first name + first letter of last name if exists)
    const nameParts = currentSalesman.name.trim().toLowerCase().split(' ');
    let username = nameParts[0];
    
    if (nameParts.length > 1) {
      username += nameParts[nameParts.length - 1].charAt(0);
    }
    
    // Add random number to make it unique
    username += Math.floor(Math.random() * 100);
    
    handleChange('username', username);
  };

  // Render a salesman item
  const renderSalesmanItem = ({ item }: { item: Salesman }) => {
    return (
      <View style={[styles.salesmanCard, !item.isActive && styles.inactiveSalesman]}>
        <View style={styles.salesmanInfo}>
          <Text style={styles.salesmanName}>{item.name}</Text>
          <Text style={styles.salesmanDetail}>Mobile: {item.mobile}</Text>
          <Text style={styles.salesmanDetail}>Username: {item.username}</Text>
          <Text style={styles.salesmanDetail}>Commission: {item.commissionRate}%</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        
        <View style={styles.salesmanActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]} 
            onPress={() => handleEdit(item)}
          >
            <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]} 
            onPress={() => handleDelete(item.id)}
          >
            <MaterialCommunityIcons name="delete" size={18} color="#fff" />
          </TouchableOpacity>
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
      <View style={styles.header}>
        <Text style={styles.title}>Salesman Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <MaterialCommunityIcons name="account-plus" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Salesman</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color="#999" style={styles.searchIcon} />
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
      
      {filteredSalesmen.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-off" size={60} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery.length > 0 
              ? 'No salesmen match your search' 
              : 'No salesmen added yet'}
          </Text>
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>Clear search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredSalesmen}
          renderItem={renderSalesmanItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      )}
      
      {/* Add/Edit Salesman Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Salesman' : 'Add Salesman'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowModal(false);
                resetForm();
              }}>
                <MaterialCommunityIcons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name*</Text>
                <TextInput
                  style={styles.input}
                  value={currentSalesman.name}
                  onChangeText={(text) => handleChange('name', text)}
                  placeholder="Enter salesman's full name"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Mobile Number*</Text>
                <TextInput
                  style={styles.input}
                  value={currentSalesman.mobile}
                  onChangeText={(text) => handleChange('mobile', text)}
                  placeholder="Enter 10-digit mobile number"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              
              <View style={styles.formGroup}>
                <View style={styles.usernameContainer}>
                  <Text style={styles.label}>Username*</Text>
                  <TouchableOpacity onPress={generateUsername}>
                    <Text style={styles.generateText}>Generate</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  value={currentSalesman.username}
                  onChangeText={(text) => handleChange('username', text.toLowerCase())}
                  placeholder="Enter login username"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.formGroup}>
                <View style={styles.usernameContainer}>
                  <Text style={styles.label}>{isEditing ? 'New Password' : 'Password*'}</Text>
                  <TouchableOpacity onPress={generatePassword}>
                    <Text style={styles.generateText}>Generate</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  value={currentSalesman.password}
                  onChangeText={(text) => handleChange('password', text)}
                  placeholder={isEditing ? "Leave blank to keep current" : "Enter password"}
                  secureTextEntry={true}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Commission Rate (%)*</Text>
                <TextInput
                  style={styles.input}
                  value={currentSalesman.commissionRate.toString()}
                  onChangeText={(text) => {
                    const rate = text.trim() === '' ? 0 : parseFloat(text);
                    handleChange('commissionRate', rate);
                  }}
                  keyboardType="numeric"
                  placeholder="Enter commission percentage"
                />
              </View>
              
              <View style={styles.formGroup}>
                <View style={styles.switchContainer}>
                  <Text style={styles.label}>Active Status</Text>
                  <Switch
                    trackColor={{ false: "#ccc", true: "#007AFF" }}
                    thumbColor="#fff"
                    ios_backgroundColor="#ccc"
                    onValueChange={(value) => handleChange('isActive', value)}
                    value={currentSalesman.isActive}
                  />
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Update Salesman' : 'Add Salesman'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  clearSearchText: {
    color: '#007AFF',
    fontSize: 16,
    marginTop: 16,
  },
  list: {
    padding: 16,
  },
  salesmanCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inactiveSalesman: {
    borderLeftColor: '#ccc',
    opacity: 0.7,
  },
  salesmanInfo: {
    flex: 1,
  },
  salesmanName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  salesmanDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  statusBadge: {
    marginTop: 8,
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  salesmanActions: {
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScrollView: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  usernameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 