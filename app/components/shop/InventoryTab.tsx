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
});

export default function InventoryTab({ shopId }: InventoryTabProps) {
  const { inventories, createInventory, updateInventory, deleteInventory, fetchInventoryByShopId, loading } = useInventory();
  
  // State management
  const [shopProducts, setShopProducts] = useState<Inventory[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Inventory | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sortBy, setSortBy] = useState<'productName' | 'sellingPrice' | 'stockQuantity'>('productName');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [productForm, setProductForm] = useState({
    productName: '',
    basePrice: '',
    sellingPrice: '',
    stockQuantity: '',
    productImageUrl: '',
    category: '',
    description: '',
    unit: '',
  });

  // Constants
  const LOW_STOCK_THRESHOLD = 5;

  // Load products on component mount
  useEffect(() => {
    loadInventory();
  }, [shopId]);

  // Update local state when inventory changes
  useEffect(() => {
    if (inventories.length > 0) {
      setShopProducts(inventories.filter(item => item.shopId === shopId));
    }
  }, [inventories, shopId]);

  // Filter products when search query changes
  useEffect(() => {
    if (shopProducts.length > 0) {
      let filtered = [...shopProducts];
      
      // Apply search filter
      if (searchQuery.trim() !== '') {
        filtered = filtered.filter(product => 
          product.productName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply low stock filter
      if (filterLowStock) {
        filtered = filtered.filter(product => product.stockQuantity <= LOW_STOCK_THRESHOLD);
      }
      
      setFilteredProducts(filtered);
    }
  }, [searchQuery, shopProducts, filterLowStock]);

  // Sort products when sort criteria changes
  useEffect(() => {
    const sortedProducts = [...filteredProducts].sort((a, b) => {
      if (sortBy === 'productName') {
        return a.productName.localeCompare(b.productName);
      } else if (sortBy === 'sellingPrice') {
        return a.sellingPrice - b.sellingPrice;
      } else {
        return a.stockQuantity - b.stockQuantity;
      }
    });
    
    setFilteredProducts(sortedProducts);
  }, [sortBy]);

  // Load inventory from context
  const loadInventory = async () => {
    setIsLoading(true);
    try {
      await fetchInventoryByShopId(shopId);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (field: string, value: string) => {
    setProductForm({ ...productForm, [field]: value });
  };

  // Form validation
  const validateForm = () => {
    // Validate the form
    if (!productForm.productName.trim()) {
      Alert.alert('Error', 'Product name is required');
      return false;
    }
    
    if (!productForm.basePrice || isNaN(parseFloat(productForm.basePrice)) || parseFloat(productForm.basePrice) <= 0) {
      Alert.alert('Error', 'Base price must be greater than 0');
      return false;
    }
    
    if (!productForm.sellingPrice || isNaN(parseFloat(productForm.sellingPrice)) || parseFloat(productForm.sellingPrice) <= 0) {
      Alert.alert('Error', 'Selling price must be greater than 0');
      return false;
    }
    
    if (!productForm.stockQuantity || isNaN(parseInt(productForm.stockQuantity)) || parseInt(productForm.stockQuantity) < 0) {
      Alert.alert('Error', 'Quantity cannot be negative');
      return false;
    }

    return true;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    if (isEditing && currentProduct) {
      // Update existing product
      const updateData: UpdateInventoryDto = {
        productName: productForm.productName,
        basePrice: parseFloat(productForm.basePrice),
        sellingPrice: parseFloat(productForm.sellingPrice),
        stockQuantity: parseInt(productForm.stockQuantity),
        productImageUrl: productForm.productImageUrl || '',
      };
      
      try {
        await updateInventory(currentProduct.id, updateData);
        Alert.alert('Success', 'Product updated successfully');
      } catch (error) {
        console.error('Error updating product:', error);
        Alert.alert('Error', 'Failed to update product');
      }
    } else {
      // Add new product
      const newProduct: CreateInventoryDto = {
        productName: productForm.productName,
        basePrice: parseFloat(productForm.basePrice),
        sellingPrice: parseFloat(productForm.sellingPrice),
        stockQuantity: parseInt(productForm.stockQuantity),
        productImageUrl: productForm.productImageUrl || '',
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
    
    setShowModal(false);
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
    setCurrentProduct(product);
    setProductForm({
      productName: product.productName,
      basePrice: product.basePrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      stockQuantity: product.stockQuantity.toString(),
      productImageUrl: product.productImageUrl || '',
      category: '',
      description: '',
      unit: '',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // Reset the form
  const resetForm = () => {
    setProductForm({
      productName: '',
      basePrice: '',
      sellingPrice: '',
      stockQuantity: '',
      productImageUrl: '',
      category: '',
      description: '',
      unit: '',
    });
    setIsEditing(false);
    setCurrentProduct(null);
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
        setProductForm({ ...productForm, productImageUrl: result.assets[0].uri });
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
            <Text style={styles.sellingPrice}>₹{item.sellingPrice.toFixed(2)}</Text>
            {item.basePrice !== item.sellingPrice && (
              <Text style={styles.basePrice}>₹{item.basePrice.toFixed(2)}</Text>
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
      {/* Header actions */}
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
            setShowModal(true);
          }}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'productName' ? styles.activeSort : null]}
            onPress={() => setSortBy('productName')}
          >
            <Text style={styles.sortButtonText}>Name</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'sellingPrice' ? styles.activeSort : null]}
            onPress={() => setSortBy('sellingPrice')}
          >
            <Text style={styles.sortButtonText}>Price</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'stockQuantity' ? styles.activeSort : null]}
            onPress={() => setSortBy('stockQuantity')}
          >
            <Text style={styles.sortButtonText}>Stock</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[styles.filterButton, filterLowStock ? styles.activeFilter : null]}
          onPress={() => setFilterLowStock(!filterLowStock)}
        >
          <MaterialCommunityIcons 
            name={filterLowStock ? "filter" : "filter-outline"} 
            size={16} 
            color={filterLowStock ? "#fff" : "#333"} 
          />
          <Text style={[styles.filterButtonText, filterLowStock ? styles.activeFilterText : null]}>
            Low Stock
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Product list */}
      {isLoading || loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loaderText}>Loading products...</Text>
        </View>
      ) : filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="package-variant" size={60} color="#cccccc" />
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? "Try a different search term" : "Add products to your inventory"}
          </Text>
        </View>
      )}
      
      {/* Add/Edit modal */}
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
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formContainer}>
              {/* Product image picker */}
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {productForm.productImageUrl ? (
                  <Image
                    source={{ uri: productForm.productImageUrl }}
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
                  value={productForm.productName}
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
                    value={productForm.basePrice}
                    onChangeText={(value) => handleInputChange('basePrice', value)}
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Selling Price (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={productForm.sellingPrice}
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
                  value={productForm.stockQuantity}
                  onChangeText={(value) => handleInputChange('stockQuantity', value)}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowModal(false);
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
                  {isEditing ? 'Update' : 'Add Product'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
} 