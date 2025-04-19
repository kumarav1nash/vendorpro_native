import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useShop, Shop } from '../contexts/ShopContext';

export default function ShopsScreen() {
  // State management
  const { shops, isLoading, addShop, updateShop, deleteShop, setCurrentShop, currentShop, loadShops } = useShop();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [shopForm, setShopForm] = useState({
    name: '',
    address: '',
    contactNumber: '',
    email: '',
    gstin: '',
    isActive: true,
    ownerId: 'owner-1' // Default owner id
  });
  const [editingShopId, setEditingShopId] = useState<string | null>(null);

  // Load and filter shops
  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredShops(shops);
    } else {
      const filtered = shops.filter(shop => 
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredShops(filtered);
    }
  }, [searchQuery, shops]);

  // Handle form reset
  const resetForm = () => {
    setShopForm({
      name: '',
      address: '',
      contactNumber: '',
      email: '',
      gstin: '',
      isActive: true,
      ownerId: 'owner-1'
    });
    setEditingShopId(null);
  };

  // Handle edit shop
  const handleEditShop = (shop: Shop) => {
    setShopForm({
      name: shop.name,
      address: shop.address,
      contactNumber: shop.contactNumber,
      email: shop.email || '',
      gstin: shop.gstin || '',
      isActive: shop.isActive,
      ownerId: shop.ownerId
    });
    setEditingShopId(shop.id);
    setShowEditModal(true);
  };

  // Handle form input change
  const handleChange = (field: string, value: string | boolean) => {
    setShopForm(prev => ({ ...prev, [field]: value }));
  };

  // Form validation
  const validateForm = () => {
    if (!shopForm.name.trim()) {
      Alert.alert('Error', 'Shop name is required');
      return false;
    }

    if (!shopForm.address.trim()) {
      Alert.alert('Error', 'Shop address is required');
      return false;
    }

    if (!shopForm.contactNumber.trim()) {
      Alert.alert('Error', 'Contact number is required');
      return false;
    }

    return true;
  };

  // Handle add shop submission
  const handleAddSubmit = async () => {
    if (!validateForm()) return;

    try {
      await addShop(shopForm);
      setShowAddModal(false);
      resetForm();
      Alert.alert('Success', 'Shop added successfully');
    } catch (error) {
      console.error('Error adding shop:', error);
      Alert.alert('Error', 'Failed to add shop');
    }
  };

  // Handle edit shop submission
  const handleEditSubmit = async () => {
    if (!validateForm() || !editingShopId) return;

    try {
      await updateShop(editingShopId, shopForm);
      setShowEditModal(false);
      resetForm();
      Alert.alert('Success', 'Shop updated successfully');
    } catch (error) {
      console.error('Error updating shop:', error);
      Alert.alert('Error', 'Failed to update shop');
    }
  };

  // Handle delete shop
  const handleDeleteShop = (shop: Shop) => {
    Alert.alert(
      'Delete Shop',
      `Are you sure you want to delete ${shop.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteShop(shop.id);
              Alert.alert('Success', 'Shop deleted successfully');
            } catch (error) {
              console.error('Error deleting shop:', error);
              Alert.alert('Error', 'Failed to delete shop');
            }
          }
        }
      ]
    );
  };

  // Handle selecting a shop
  const handleSelectShop = (shop: Shop) => {
    setCurrentShop(shop);
    router.push(`/shop/${shop.id}`);
  };

  // Render shop item
  const renderShopItem = ({ item }: { item: Shop }) => (
    <TouchableOpacity
      style={[
        styles.shopCard,
        currentShop?.id === item.id && styles.selectedShopCard
      ]}
      onPress={() => handleSelectShop(item)}
    >
      <View style={styles.shopInfo}>
        <Text style={styles.shopName}>{item.name}</Text>
        <Text style={styles.shopAddress}>{item.address}</Text>
        <Text style={styles.shopContact}>{item.contactNumber}</Text>
        {item.gstin && <Text style={styles.shopGstin}>GSTIN: {item.gstin}</Text>}
      </View>
      <View style={styles.shopActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditShop(item)}
        >
          <MaterialCommunityIcons name="pencil" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteShop(item)}
        >
          <MaterialCommunityIcons name="delete" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Main render
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Shops</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shops..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Shops list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading shops...</Text>
        </View>
      ) : filteredShops.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="store" size={60} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery.trim() !== ''
              ? 'No shops match your search'
              : 'No shops added yet'}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <Text style={styles.emptyButtonText}>Add Your First Shop</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredShops}
          renderItem={renderShopItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.shopsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Shop Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Shop</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Shop Name*</Text>
                <TextInput
                  style={styles.input}
                  value={shopForm.name}
                  onChangeText={(text) => handleChange('name', text)}
                  placeholder="Enter shop name"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Address*</Text>
                <TextInput
                  style={styles.input}
                  value={shopForm.address}
                  onChangeText={(text) => handleChange('address', text)}
                  placeholder="Enter shop address"
                  multiline
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Contact Number*</Text>
                <TextInput
                  style={styles.input}
                  value={shopForm.contactNumber}
                  onChangeText={(text) => handleChange('contactNumber', text)}
                  placeholder="Enter contact number"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={shopForm.email}
                  onChangeText={(text) => handleChange('email', text)}
                  placeholder="Enter email (optional)"
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>GSTIN</Text>
                <TextInput
                  style={styles.input}
                  value={shopForm.gstin}
                  onChangeText={(text) => handleChange('gstin', text)}
                  placeholder="Enter GSTIN (optional)"
                />
              </View>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddSubmit}
              >
                <Text style={styles.submitButtonText}>Add Shop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Shop Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Shop</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Shop Name*</Text>
                <TextInput
                  style={styles.input}
                  value={shopForm.name}
                  onChangeText={(text) => handleChange('name', text)}
                  placeholder="Enter shop name"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Address*</Text>
                <TextInput
                  style={styles.input}
                  value={shopForm.address}
                  onChangeText={(text) => handleChange('address', text)}
                  placeholder="Enter shop address"
                  multiline
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Contact Number*</Text>
                <TextInput
                  style={styles.input}
                  value={shopForm.contactNumber}
                  onChangeText={(text) => handleChange('contactNumber', text)}
                  placeholder="Enter contact number"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={shopForm.email}
                  onChangeText={(text) => handleChange('email', text)}
                  placeholder="Enter email (optional)"
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>GSTIN</Text>
                <TextInput
                  style={styles.input}
                  value={shopForm.gstin}
                  onChangeText={(text) => handleChange('gstin', text)}
                  placeholder="Enter GSTIN (optional)"
                />
              </View>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleEditSubmit}
              >
                <Text style={styles.submitButtonText}>Update Shop</Text>
              </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  shopsList: {
    padding: 15,
  },
  shopCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedShopCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  shopAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  shopContact: {
    fontSize: 14,
    color: '#666',
  },
  shopGstin: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  shopActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 5,
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
    padding: 20,
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
  formGroup: {
    marginBottom: 15,
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
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 