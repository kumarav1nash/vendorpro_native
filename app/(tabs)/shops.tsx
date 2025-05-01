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
import { useShop } from '../../src/contexts/ShopContext';
import { useUser } from '../../src/contexts/UserContext';
import { CreateShopDto, Shop } from '../../src/types/shop';

export default function ShopsScreen() {
  // User context
  const { user } = useUser();
  
  // State management
  const { shops, isLoading, createShop, updateShop, fetchMyShops, deleteShop} = useShop();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [shopForm, setShopForm] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    gstinNumber: '',
  });
  const [editingShopId, setEditingShopId] = useState<string | null>(null);

  // Load and filter shops
  useEffect(() => {
    fetchMyShops();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredShops(shops);
    } else {
      const filtered = shops.filter(shop => 
        shop.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.ownerName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredShops(filtered);
    }
  }, [searchQuery, shops]);

  // Handle form reset
  const resetForm = () => {
    setShopForm({
      shopName: '',
      ownerName: '',
      email: '',
      gstinNumber: '',
    });
    setEditingShopId(null);
  };

  // Handle edit shop
  const handleEditShop = async (shop: Shop) => {
    setShopForm({
      shopName: shop.shopName,
      ownerName: shop.ownerName,
      email: shop.email,
      gstinNumber: shop.gstinNumber || '',
    });
    setEditingShopId(shop.id);
    setShowEditModal(true);
  };

  // Handle form input change
  const handleChange = (field: string, value: string) => {
    setShopForm(prev => ({ ...prev, [field]: value }));
  };

  // Form validation
  const validateForm = () => {
    if (!shopForm.shopName.trim()) {
      Alert.alert('Error', 'Shop name is required');
      return false;
    }
    if (!shopForm.ownerName.trim()) {
      Alert.alert('Error', 'Owner name is required');
      return false;
    }
    if (!shopForm.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }
    return true;
  };

  // Handle add shop submission
  const handleAddSubmit = async () => {
    if (!validateForm()) return;
    try {
      //remove gstinNumber from shopForm if it is empty or undefined, pass the relevant fields to createShop
      const { gstinNumber, ...shopFormWithoutGstin } = shopForm as CreateShopDto;
      if(gstinNumber){
        await createShop(shopForm);
      }else{
        await createShop(shopFormWithoutGstin);

      }
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
      `Are you sure you want to delete ${shop.shopName}?`,
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

  // Render shop item
  const renderShopItem = ({ item }: { item: Shop }) => (
    <TouchableOpacity
      style={styles.shopCard}
      onPress={() => router.push(`/shop/${item.id}`)}
    >
      <View style={styles.shopInfo}>
        <Text style={styles.shopName}>{item.shopName}</Text>
        <Text style={styles.shopOwner}>Owner: {item.ownerName}</Text>
        <Text style={styles.shopEmail}>Email: {item.email}</Text>
        {item.gstinNumber && <Text style={styles.shopGstin}>GSTIN: {item.gstinNumber}</Text>}
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
                  value={shopForm.shopName}
                  onChangeText={(text) => handleChange('shopName', text)}
                  placeholder="Enter shop name"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Owner Name*</Text>
                <TextInput
                  style={styles.input}
                  value={shopForm.ownerName}
                  onChangeText={(text) => handleChange('ownerName', text)}
                  placeholder="Enter owner name"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email*</Text>
                <TextInput
                  style={styles.input}
                  value={shopForm.email}
                  onChangeText={(text) => handleChange('email', text)}
                  placeholder="Enter email"
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>GSTIN</Text>
                <TextInput
                  style={styles.input}
                  value={shopForm.gstinNumber}
                  onChangeText={(text) => handleChange('gstinNumber', text)}
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
                  value={shopForm.shopName}
                  onChangeText={(text) => handleChange('shopName', text)}
                  placeholder="Enter shop name"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Owner Name*</Text>
                <TextInput
                  style={styles.input}
                  value={shopForm.ownerName}
                  onChangeText={(text) => handleChange('ownerName', text)}
                  placeholder="Enter owner name"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email*</Text>
                <TextInput
                  style={styles.input}
                  value={shopForm.email}
                  onChangeText={(text) => handleChange('email', text)}
                  placeholder="Enter email"
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>GSTIN</Text>
                <TextInput
                  style={styles.input}
                  value={shopForm.gstinNumber}
                  onChangeText={(text) => handleChange('gstinNumber', text)}
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
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  shopOwner: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  shopEmail: {
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