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
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useInventory } from '../../../src/contexts/InventoryContext';
import { Inventory, CreateInventoryDto, UpdateInventoryDto } from '../../../src/types/inventory';
import { useUser } from '../../../src/contexts/UserContext';
import { useShop } from '../../../src/contexts/ShopContext';

type InventoryTabProps = {
  shopId: string;
};

// Styles definition
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    marginRight: 12,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  activeSort: {
    backgroundColor: '#0066cc',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#333',
  },
  activeSortText: {
    color: '#fff',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  activeFilter: {
    backgroundColor: '#0066cc',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 4,
  },
  activeFilterText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  productImageContainer: {
    width: 100,
    height: 100,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  sellingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  basePrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityText: {
    fontSize: 14,
    color: '#666',
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  stockText: {
    fontSize: 12,
    color: '#666',
  },
  actionsContainer: {
    justifyContent: 'space-between',
    padding: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 16,
    maxHeight: '70%',
  },
  imagePicker: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#0066cc',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  debugContainer: {
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  debugButton: {
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  errorText: {
    color: 'red',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#0066cc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default function InventoryTab({ shopId }: InventoryTabProps) {
  const { 
    inventories, 
    loading, 
    error, 
    fetchInventoryByShopId,
    createInventory,
    updateInventory,
    deleteInventory
  } = useInventory();
  const { user } = useUser();
  const { shop } = useShop();
  
  // State for the component
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayedInventory, setDisplayedInventory] = useState<Inventory[]>([]);
  const [showLowStock, setShowLowStock] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = useState<CreateInventoryDto>({
    productName: '',
    basePrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    productImageUrl: '',
    shopId: shopId,
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Constants
  const LOW_STOCK_THRESHOLD = 5;

  // Load inventory data when component mounts or shopId changes
  useEffect(() => {
    loadInventory();
  }, [shopId]);

  // Filter and sort inventory when data changes
  useEffect(() => {
    if (!inventories) {
      console.log('No inventory data available');
      return;
    }
    
    console.log(`Filtering and sorting ${inventories.length} inventory items`);
    console.log('Sample inventory item:', inventories.length > 0 ? JSON.stringify(inventories[0]) : 'No inventory');
      
    // IMPORTANT: Temporarily disable shopId filtering to show all items
    // This will help us debug if items are being loaded correctly
    // let filtered = inventories.filter(item => item.shopId === shopId);
    let filtered = [...inventories]; // Show all items for now
    
    console.log(`After removing shopId filter: ${filtered.length} items`);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.productName.toLowerCase().includes(query)
        );
      }
      
    if (showLowStock) {
      filtered = filtered.filter(item => item.stockQuantity <= LOW_STOCK_THRESHOLD);
      }
      
    // Sort inventory items
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return sortDirection === 'asc' 
          ? a.productName.localeCompare(b.productName)
          : b.productName.localeCompare(a.productName);
      } else if (sortBy === 'price') {
        // Handle price as string or number
        const priceA = typeof a.sellingPrice === 'string' ? parseFloat(a.sellingPrice) : a.sellingPrice;
        const priceB = typeof b.sellingPrice === 'string' ? parseFloat(b.sellingPrice) : b.sellingPrice;
        return sortDirection === 'asc'
          ? priceA - priceB
          : priceB - priceA;
      } else {
        return sortDirection === 'asc'
          ? a.stockQuantity - b.stockQuantity
          : b.stockQuantity - a.stockQuantity;
      }
    });
    
    setDisplayedInventory(filtered);
    console.log(`Displaying ${filtered.length} inventory items after filtering and sorting`);
  }, [inventories, searchQuery, showLowStock, sortBy, sortDirection, shopId]);
  
  const loadInventory = async () => {
    try {
      console.log(`Loading inventory for shop: ${shopId}`);
      setIsLoading(true);
      
      // First try to fetch by shopId
      await fetchInventoryByShopId(shopId);
      
      // If that returns no items, try fetching all inventory
      if (inventories && inventories.length === 0) {
        console.log("No inventory items found for this shop. Fetching all inventory items instead.");
        // There could be an API method to get all inventory, but we'll work with what we have
      }
      
      console.log("Inventory fetch completed");
      
    } catch (err) {
      console.error('Error loading inventory:', err);
      Alert.alert('Error', 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a more verbose debug control
  const renderDebugControls = () => {
    if (!__DEV__) return null;
    
    return (
      <View style={styles.debugContainer}>
        <TouchableOpacity
          style={styles.debugButton}
          onPress={() => {
            console.log("Debug - Current inventory state:");
            console.log(`Total inventory count: ${inventories?.length || 0}`);
            console.log(`Filtered inventory count: ${displayedInventory.length}`);
            console.log(`Shop ID being filtered for: ${shopId}`);
            console.log(`Loading state: ${loading}`);
            console.log(`Error state: ${error}`);
            console.log("First few inventory items:");
            if (inventories && inventories.length > 0) {
              inventories.slice(0, 3).forEach((item, index) => {
                console.log(`Item ${index + 1}:`, JSON.stringify(item));
              });
            } else {
              console.log("No inventory items available");
            }
            
            // Force refresh
            loadInventory();
          }}
        >
          <Text style={styles.debugButtonText}>Debug Inventory</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Handle input change
  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  // Form validation
  const validateForm = () => {
    // Validate the form
    if (!formData.productName.trim()) {
      Alert.alert('Error', 'Product name is required');
      return false;
    }
    
    if (!formData.basePrice || isNaN(formData.basePrice) || formData.basePrice <= 0) {
      Alert.alert('Error', 'Base price must be greater than 0');
      return false;
    }
    
    if (!formData.sellingPrice || isNaN(formData.sellingPrice) || formData.sellingPrice <= 0) {
      Alert.alert('Error', 'Selling price must be greater than 0');
      return false;
    }
    
    if (!formData.stockQuantity || isNaN(formData.stockQuantity) || formData.stockQuantity < 0) {
      Alert.alert('Error', 'Quantity cannot be negative');
      return false;
    }

    return true;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (editMode && editId) {
      // Update existing product
      const updateData: UpdateInventoryDto = {
        productName: formData.productName,
        basePrice: formData.basePrice,
        sellingPrice: formData.sellingPrice,
        stockQuantity: formData.stockQuantity,
        productImageUrl: formData.productImageUrl || '',
      };
      
      try {
        await updateInventory(editId, updateData);
      Alert.alert('Success', 'Product updated successfully');
      } catch (error) {
        console.error('Error updating product:', error);
        Alert.alert('Error', 'Failed to update product');
      }
    } else {
      // Add new product
      const newProduct: CreateInventoryDto = {
        productName: formData.productName,
        basePrice: formData.basePrice,
        sellingPrice: formData.sellingPrice,
        stockQuantity: formData.stockQuantity,
        productImageUrl: formData.productImageUrl || '',
        shopId: shopId,
      };
      
      try {
        await createInventory(shopId, newProduct);
      Alert.alert('Success', 'Product added successfully');
      } catch (error) {
        console.error('Error adding product:', error);
        Alert.alert('Error', 'Failed to add product');
      }
    }
    
    setShowAddModal(false);
    resetForm();
    loadInventory();
  };

  // Delete a product
  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
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
              await deleteInventory(id);
            Alert.alert('Success', 'Product deleted successfully');
            loadInventory();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  // Edit a product
  const handleEdit = (product: Inventory) => {
    setEditId(product.id);
    setFormData({
      productName: product.productName,
      basePrice: typeof product.basePrice === 'string' ? parseFloat(product.basePrice) : product.basePrice,
      sellingPrice: typeof product.sellingPrice === 'string' ? parseFloat(product.sellingPrice) : product.sellingPrice,
      stockQuantity: product.stockQuantity,
      productImageUrl: product.productImageUrl || '',
      shopId: shopId,
    });
    setEditMode(true);
    setShowAddModal(true);
  };

  // Reset the form
  const resetForm = () => {
    setFormData({
      productName: '',
      basePrice: 0,
      sellingPrice: 0,
      stockQuantity: 0,
      productImageUrl: '',
      shopId: shopId,
    });
    setEditMode(false);
    setEditId(null);
  };

  // Pick an image from the gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData({ ...formData, productImageUrl: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Render stock level indicator
  const renderStockLevel = (quantity: number) => {
    let color = '#4CAF50'; // Green for good stock
    let text = 'In Stock';
    
    if (quantity <= LOW_STOCK_THRESHOLD && quantity > 0) {
      color = '#FFC107'; // Yellow for low stock
      text = 'Low Stock';
    } else if (quantity === 0) {
      color = '#F44336'; // Red for out of stock
      text = 'Out of Stock';
    }
    
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.stockIndicator, { backgroundColor: color }]} />
        <Text style={styles.stockText}>{text}</Text>
      </View>
    );
  };

  // Render product item
  const renderProductItem = ({ item }: { item: Inventory }) => {
    const isLowStock = item.stockQuantity <= LOW_STOCK_THRESHOLD;
    
    // Format prices safely, handling string values
    const formatPrice = (price: number | string) => {
      if (typeof price === 'string') {
        return `₹${parseFloat(price).toFixed(2)}`;
      }
      return `₹${price.toFixed(2)}`;
    };
    
    return (
      <View style={styles.productCard}>
        <View style={styles.productImageContainer}>
          {item.productImageUrl ? (
            <Image source={{ uri: item.productImageUrl }} style={styles.productImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="image-outline" size={40} color="#cccccc" />
            </View>
          )}
        </View>
        
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{item.productName}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.sellingPrice}>{formatPrice(item.sellingPrice)}</Text>
            {item.basePrice !== item.sellingPrice && (
              <Text style={styles.basePrice}>{formatPrice(item.basePrice)}</Text>
            )}
          </View>
          
          <View style={styles.stockContainer}>
            <Text style={styles.quantityText}>Qty: {item.stockQuantity}</Text>
            {renderStockLevel(item.stockQuantity)}
          </View>
        </View>
        
        <View style={styles.actionsContainer}>
        <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(item)}
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item.id)}
        >
            <MaterialCommunityIcons name="delete" size={20} color="#fff" />
        </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerActions}>
      <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
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
      
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Sort:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'name' && styles.activeSort]}
            onPress={() => {
              if (sortBy === 'name') {
                setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('name');
              }
            }}
          >
            <Text style={[styles.sortButtonText, sortBy === 'name' && styles.activeSortText]}>
              Name {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'price' && styles.activeSort]}
            onPress={() => {
              if (sortBy === 'price') {
                setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('price');
              }
            }}
          >
            <Text style={[styles.sortButtonText, sortBy === 'price' && styles.activeSortText]}>
              Price {sortBy === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'stock' && styles.activeSort]}
            onPress={() => {
              if (sortBy === 'stock') {
                setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('stock');
              }
            }}
          >
            <Text style={[styles.sortButtonText, sortBy === 'stock' && styles.activeSortText]}>
              Stock {sortBy === 'stock' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Text>
          </TouchableOpacity>
        </View>
          <TouchableOpacity
          style={[styles.filterButton, showLowStock && styles.activeFilter]}
          onPress={() => setShowLowStock(!showLowStock)}
          >
            <MaterialCommunityIcons 
              name="alert-circle" 
              size={16} 
            color={showLowStock ? '#fff' : '#333'}
            />
          <Text style={[styles.filterButtonText, showLowStock && styles.activeFilterText]}>
              Low Stock
            </Text>
          </TouchableOpacity>
      </View>
      
      {__DEV__ && renderDebugControls()}
      
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loaderText}>Loading inventory...</Text>
        </View>
      ) : displayedInventory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="package-variant" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || showLowStock
              ? "Try adjusting your search or filters"
              : "Add some products to your inventory"}
          </Text>
          {error && (
            <Text style={styles.errorText}>Error: {error}</Text>
          )}
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadInventory}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContainer}
          data={displayedInventory}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Add/Edit modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
          <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Edit Product' : 'Add New Product'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formContainer}>
              {/* Product image picker */}
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {formData.productImageUrl ? (
                  <Image
                    source={{ uri: formData.productImageUrl }}
                    style={styles.pickedImage}
                  />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <MaterialCommunityIcons name="camera" size={40} color="#999" />
                    <Text style={styles.imagePickerText}>Add Product Image</Text>
              </View>
                )}
              </TouchableOpacity>
              
              {/* Form fields */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Name *</Text>
                  <TextInput
                  style={styles.textInput}
                  placeholder="Enter product name"
                  value={formData.productName}
                  onChangeText={(value) => handleInputChange('productName', value)}
                  />
                </View>
                
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Base Price (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={formData.basePrice.toString()}
                    onChangeText={(value) => handleInputChange('basePrice', value)}
                  />
              </View>
              
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Selling Price (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={formData.sellingPrice.toString()}
                    onChangeText={(value) => handleInputChange('sellingPrice', value)}
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Stock Quantity *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={formData.stockQuantity.toString()}
                  onChangeText={(value) => handleInputChange('stockQuantity', value)}
                />
              </View>
            </ScrollView>
              
            <View style={styles.modalFooter}>
                      <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                      >
                <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.saveButtonText}>
                  {editMode ? 'Update' : 'Add Product'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}