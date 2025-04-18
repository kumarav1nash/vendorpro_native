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
import { useProducts, Product } from '../../contexts/ProductContext';

type InventoryTabProps = {
  shopId: string;
};

export default function InventoryTab({ shopId }: InventoryTabProps) {
  const { products, addProduct, updateProduct, deleteProduct, getShopProducts } = useProducts();
  
  // State management
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'quantity'>('name');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    basePrice: '',
    sellingPrice: '',
    quantity: '',
    imageUri: '',
    category: '',
    description: '',
    unit: '',
  });

  // Constants
  const LOW_STOCK_THRESHOLD = 5;

  // Load products on component mount
  useEffect(() => {
    loadInventory();
  }, [shopId, products]);

  // Filter products when search query changes
  useEffect(() => {
    if (shopProducts.length > 0) {
      let filtered = [...shopProducts];
      
      // Apply search filter
      if (searchQuery.trim() !== '') {
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.category?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply low stock filter
      if (filterLowStock) {
        filtered = filtered.filter(product => product.quantity <= LOW_STOCK_THRESHOLD);
      }
      
      setFilteredProducts(filtered);
    }
  }, [searchQuery, shopProducts, filterLowStock]);

  // Sort products when sort criteria changes
  useEffect(() => {
    const sortedProducts = [...filteredProducts].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        return a.sellingPrice - b.sellingPrice;
      } else {
        return a.quantity - b.quantity;
      }
    });
    
    setFilteredProducts(sortedProducts);
  }, [sortBy]);

  // Load inventory from context
  const loadInventory = () => {
    setIsLoading(true);
    try {
      const productsForShop = getShopProducts(shopId);
      setShopProducts(productsForShop);
      setFilteredProducts(productsForShop);
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
    if (!productForm.name.trim()) {
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
    
    if (!productForm.quantity || isNaN(parseInt(productForm.quantity)) || parseInt(productForm.quantity) < 0) {
      Alert.alert('Error', 'Quantity cannot be negative');
      return false;
    }

    return true;
  };

  // Submit form
  const handleSubmit = () => {
    if (!validateForm()) return;

    const timestamp = new Date().toISOString();
    
    if (isEditing && currentProduct) {
      // Update existing product
      const updatedProduct: Product = {
        ...currentProduct,
        name: productForm.name,
        basePrice: parseFloat(productForm.basePrice),
        sellingPrice: parseFloat(productForm.sellingPrice),
        quantity: parseInt(productForm.quantity),
        imageUri: productForm.imageUri || undefined,
        category: productForm.category || undefined,
        description: productForm.description || undefined,
        unit: productForm.unit || undefined,
        updatedAt: timestamp
      };
      
      updateProduct(updatedProduct);
      Alert.alert('Success', 'Product updated successfully');
    } else {
      // Add new product
      const newProduct: Product = {
        id: Date.now().toString(),
        shopId: shopId,
        name: productForm.name,
        basePrice: parseFloat(productForm.basePrice),
        sellingPrice: parseFloat(productForm.sellingPrice),
        quantity: parseInt(productForm.quantity),
        imageUri: productForm.imageUri || undefined,
        category: productForm.category || undefined,
        description: productForm.description || undefined,
        unit: productForm.unit || undefined,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      
      addProduct(newProduct);
      Alert.alert('Success', 'Product added successfully');
    }
    
    setShowModal(false);
    resetForm();
    loadInventory();
  };

  // Delete a product
  const handleDelete = (id: string) => {
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
          onPress: () => {
            deleteProduct(id);
            Alert.alert('Success', 'Product deleted successfully');
            loadInventory();
          },
        },
      ]
    );
  };

  // Edit a product
  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setProductForm({
      name: product.name,
      basePrice: product.basePrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      quantity: product.quantity.toString(),
      imageUri: product.imageUri || '',
      category: product.category || '',
      description: product.description || '',
      unit: product.unit || '',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // Reset the form
  const resetForm = () => {
    setProductForm({
      name: '',
      basePrice: '',
      sellingPrice: '',
      quantity: '',
      imageUri: '',
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
      // Request permission if not already granted
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Please allow access to your photo library to add product images.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleInputChange('imageUri', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Render a product item
  const renderProductItem = ({ item }: { item: Product }) => {
    const isLowStock = item.quantity <= LOW_STOCK_THRESHOLD;
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleEdit(item)}
      >
        <View style={styles.productImageContainer}>
          {item.imageUri ? (
            <Image source={{ uri: item.imageUri }} style={styles.productImage} />
          ) : (
            <MaterialCommunityIcons name="package-variant" size={40} color="#ccc" />
          )}
        </View>
        
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>₹{item.sellingPrice.toFixed(2)} <Text style={styles.basePrice}>(Base: ₹{item.basePrice.toFixed(2)})</Text></Text>
          <View style={styles.quantityContainer}>
            <Text 
              style={[
                styles.quantityText, 
                isLowStock && styles.lowStockText
              ]}
            >
              Qty: {item.quantity} {item.unit || ''}
            </Text>
            {isLowStock && (
              <View style={styles.lowStockBadge}>
                <Text style={styles.lowStockBadgeText}>Low Stock</Text>
              </View>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <MaterialCommunityIcons name="delete" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Main component render
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
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
      
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              sortBy === 'name' && styles.filterButtonActive
            ]}
            onPress={() => setSortBy('name')}
          >
            <Text 
              style={[
                styles.filterButtonText,
                sortBy === 'name' && styles.filterButtonTextActive
              ]}
            >
              Name
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              sortBy === 'price' && styles.filterButtonActive
            ]}
            onPress={() => setSortBy('price')}
          >
            <Text 
              style={[
                styles.filterButtonText,
                sortBy === 'price' && styles.filterButtonTextActive
              ]}
            >
              Price
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              sortBy === 'quantity' && styles.filterButtonActive
            ]}
            onPress={() => setSortBy('quantity')}
          >
            <Text 
              style={[
                styles.filterButtonText,
                sortBy === 'quantity' && styles.filterButtonTextActive
              ]}
            >
              Quantity
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterLowStock && styles.filterButtonActive,
              styles.lowStockFilter
            ]}
            onPress={() => setFilterLowStock(!filterLowStock)}
          >
            <MaterialCommunityIcons 
              name="alert-circle" 
              size={16} 
              color={filterLowStock ? "#fff" : "#FF3B30"} 
            />
            <Text 
              style={[
                styles.filterButtonText,
                filterLowStock && styles.filterButtonTextActive,
                { color: filterLowStock ? "#fff" : "#FF3B30" }
              ]}
            >
              Low Stock
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="package-variant" size={60} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery.trim() !== '' || filterLowStock
              ? 'No products match your filters'
              : 'No products added yet'}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Text style={styles.emptyButtonText}>Add Your First Product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productList}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetForm();
          setShowModal(true);
        }}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        <Text style={styles.fabText}>Add Product</Text>
      </TouchableOpacity>
      
      {/* Add/Edit Product Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Name*</Text>
                <TextInput
                  style={styles.input}
                  value={productForm.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                  placeholder="Enter product name"
                />
              </View>
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Base Price (₹)*</Text>
                  <TextInput
                    style={styles.input}
                    value={productForm.basePrice}
                    onChangeText={(text) => handleInputChange('basePrice', text)}
                    keyboardType="numeric"
                    placeholder="0.00"
                  />
                </View>
                
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Selling Price (₹)*</Text>
                  <TextInput
                    style={styles.input}
                    value={productForm.sellingPrice}
                    onChangeText={(text) => handleInputChange('sellingPrice', text)}
                    keyboardType="numeric"
                    placeholder="0.00"
                  />
                </View>
              </View>
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Quantity*</Text>
                  <TextInput
                    style={styles.input}
                    value={productForm.quantity}
                    onChangeText={(text) => handleInputChange('quantity', text)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    value={productForm.unit}
                    onChangeText={(text) => handleInputChange('unit', text)}
                    placeholder="e.g. pcs, kg, etc."
                  />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={productForm.category}
                  onChangeText={(text) => handleInputChange('category', text)}
                  placeholder="Product category"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={productForm.description}
                  onChangeText={(text) => handleInputChange('description', text)}
                  placeholder="Product description"
                  multiline
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Image (Optional)</Text>
                <View style={styles.imagePickerContainer}>
                  {productForm.imageUri ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image 
                        source={{ uri: productForm.imageUri }} 
                        style={styles.imagePreview} 
                      />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => handleInputChange('imageUri', '')}
                      >
                        <MaterialCommunityIcons name="close-circle" size={24} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.imagePickerButton}
                      onPress={pickImage}
                    >
                      <MaterialCommunityIcons name="camera" size={24} color="#007AFF" />
                      <Text style={styles.imagePickerText}>Select Image</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.imagePickerLink}
                  onPress={pickImage}
                >
                  <Text style={styles.imagePickerLinkText}>
                    {productForm.imageUri ? 'Change Image' : 'Add Image from Gallery'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Update Product' : 'Add Product'}
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
  filterContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  lowStockFilter: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FF3B30',
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
  productList: {
    padding: 15,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    color: '#000',
    marginBottom: 5,
  },
  basePrice: {
    fontSize: 14,
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    color: '#666',
  },
  lowStockText: {
    color: '#FF3B30',
  },
  lowStockBadge: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  lowStockBadgeText: {
    fontSize: 10,
    color: '#FF3B30',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 5,
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
    paddingHorizontal: 20,
    paddingVertical: 15,
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
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 20,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  imagePickerContainer: {
    marginTop: 10,
  },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
  },
  imagePickerText: {
    color: '#007AFF',
    fontSize: 16,
    marginTop: 8,
  },
  imagePickerLink: {
    marginTop: 10,
    alignItems: 'center',
  },
  imagePickerLinkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 20,
  },
}); 