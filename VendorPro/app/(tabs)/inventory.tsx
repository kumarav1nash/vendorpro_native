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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

// Product type definition
type Product = {
  id: string;
  name: string;
  basePrice: number;
  sellingPrice: number;
  quantity: number;
  imageUri?: string;
  createdAt: number;
  updatedAt: number;
};

// Form state type for adding/editing products
type ProductForm = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export default function InventoryScreen() {
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<ProductForm>({
    name: '',
    basePrice: 0,
    sellingPrice: 0,
    quantity: 0,
    imageUri: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'quantity'>('name');
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Constants
  const LOW_STOCK_THRESHOLD = 5;

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '' && !filterLowStock) {
      setFilteredProducts(products);
    } else {
      let filtered = products;
      
      // Apply search filter
      if (searchQuery.trim() !== '') {
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply low stock filter
      if (filterLowStock) {
        filtered = filtered.filter(product => product.quantity <= LOW_STOCK_THRESHOLD);
      }
      
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products, filterLowStock]);

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

  // Load products from storage
  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const savedProducts = await AsyncStorage.getItem('products');
      
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts) as Product[];
        setProducts(parsedProducts);
        setFilteredProducts(parsedProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  // Save products to storage
  const saveProducts = async (updatedProducts: Product[]) => {
    try {
      await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
    } catch (error) {
      console.error('Error saving products:', error);
      Alert.alert('Error', 'Failed to save products');
    }
  };

  // Add or update a product
  const handleSubmit = () => {
    // Validate the form
    if (!currentProduct.name.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }
    
    if (currentProduct.basePrice <= 0) {
      Alert.alert('Error', 'Base price must be greater than 0');
      return;
    }
    
    if (currentProduct.sellingPrice <= 0) {
      Alert.alert('Error', 'Selling price must be greater than 0');
      return;
    }
    
    if (currentProduct.quantity < 0) {
      Alert.alert('Error', 'Quantity cannot be negative');
      return;
    }

    const timestamp = Date.now();
    
    if (isEditing) {
      // Update existing product
      const productId = (currentProduct as any).id;
      const updatedProducts = products.map(p => 
        p.id === productId 
          ? { 
              ...p, 
              ...currentProduct, 
              updatedAt: timestamp 
            } 
          : p
      );
      
      saveProducts(updatedProducts);
      Alert.alert('Success', 'Product updated successfully');
    } else {
      // Add new product
      const newProduct: Product = {
        ...currentProduct,
        id: `product-${timestamp}`,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      
      const updatedProducts = [...products, newProduct];
      saveProducts(updatedProducts);
      Alert.alert('Success', 'Product added successfully');
    }
    
    setShowModal(false);
    resetForm();
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
          onPress: async () => {
            const updatedProducts = products.filter(p => p.id !== id);
            await saveProducts(updatedProducts);
          },
        },
      ]
    );
  };

  // Edit a product
  const handleEdit = (product: Product) => {
    setCurrentProduct({ ...product });
    setIsEditing(true);
    setShowModal(true);
  };

  // Reset the form
  const resetForm = () => {
    setCurrentProduct({
      name: '',
      basePrice: 0,
      sellingPrice: 0,
      quantity: 0,
      imageUri: '',
    });
    setIsEditing(false);
  };

  // Request permission to access the gallery
  useEffect(() => {
    (async () => {
      const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (galleryStatus.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library to add product images.');
      }
    })();
  }, []);

  // Pick an image from the gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCurrentProduct({
          ...currentProduct,
          imageUri: result.assets[0].uri,
        });
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
          <Text style={styles.productPrice}>₹{item.sellingPrice} <Text style={styles.basePrice}>(Base: ₹{item.basePrice})</Text></Text>
          <View style={styles.quantityContainer}>
            <Text 
              style={[
                styles.quantityText, 
                isLowStock && styles.lowStockText
              ]}
            >
              Qty: {item.quantity}
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
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Management</Text>
      </View>
      
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
                  value={currentProduct.name}
                  onChangeText={(text) => setCurrentProduct({ ...currentProduct, name: text })}
                  placeholder="Enter product name"
                />
              </View>
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Base Price (₹)*</Text>
                  <TextInput
                    style={styles.input}
                    value={currentProduct.basePrice.toString()}
                    onChangeText={(text) => {
                      const basePrice = text.trim() === '' ? 0 : parseFloat(text);
                      setCurrentProduct({ ...currentProduct, basePrice });
                    }}
                    keyboardType="numeric"
                    placeholder="0.00"
                  />
                </View>
                
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Selling Price (₹)*</Text>
                  <TextInput
                    style={styles.input}
                    value={currentProduct.sellingPrice.toString()}
                    onChangeText={(text) => {
                      const sellingPrice = text.trim() === '' ? 0 : parseFloat(text);
                      setCurrentProduct({ ...currentProduct, sellingPrice });
                    }}
                    keyboardType="numeric"
                    placeholder="0.00"
                  />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Quantity*</Text>
                <TextInput
                  style={styles.input}
                  value={currentProduct.quantity.toString()}
                  onChangeText={(text) => {
                    const quantity = text.trim() === '' ? 0 : parseInt(text, 10);
                    setCurrentProduct({ ...currentProduct, quantity });
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Image (Optional)</Text>
                <View style={styles.imagePickerContainer}>
                  {currentProduct.imageUri ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image 
                        source={{ uri: currentProduct.imageUri }} 
                        style={styles.imagePreview} 
                      />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => setCurrentProduct({ ...currentProduct, imageUri: '' })}
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
                    {currentProduct.imageUri ? 'Change Image' : 'Add Image from Gallery'}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
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