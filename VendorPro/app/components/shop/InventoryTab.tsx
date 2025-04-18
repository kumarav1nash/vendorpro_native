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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProducts, Product } from '../../contexts/ProductContext';

type InventoryTabProps = {
  shopId: string;
};

export default function InventoryTab({ shopId }: InventoryTabProps) {
  const { products, addProduct, updateProduct, deleteProduct, getShopProducts } = useProducts();
  
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Form state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    description: '',
    basePrice: '',
    sellingPrice: '',
    quantity: '',
    unit: '',
  });
  
  useEffect(() => {
    loadInventory();
  }, [shopId, products]);
  
  useEffect(() => {
    if (shopProducts.length > 0) {
      const filtered = shopProducts.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, shopProducts]);
  
  const loadInventory = () => {
    setIsLoading(true);
    const productsForShop = getShopProducts(shopId);
    setShopProducts(productsForShop);
    setFilteredProducts(productsForShop);
    setIsLoading(false);
  };
  
  const handleInputChange = (field: string, value: string) => {
    setProductForm({ ...productForm, [field]: value });
  };
  
  const validateForm = () => {
    const requiredFields = ['name', 'basePrice', 'sellingPrice', 'quantity'];
    
    for (const field of requiredFields) {
      if (!productForm[field as keyof typeof productForm]) {
        Alert.alert('Error', `${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        return false;
      }
    }
    
    // Validate prices and quantity are numbers
    if (isNaN(parseFloat(productForm.basePrice)) || parseFloat(productForm.basePrice) < 0) {
      Alert.alert('Error', 'Base price must be a valid number');
      return false;
    }
    
    if (isNaN(parseFloat(productForm.sellingPrice)) || parseFloat(productForm.sellingPrice) < 0) {
      Alert.alert('Error', 'Selling price must be a valid number');
      return false;
    }
    
    if (isNaN(parseInt(productForm.quantity)) || parseInt(productForm.quantity) < 0) {
      Alert.alert('Error', 'Quantity must be a valid number');
      return false;
    }
    
    return true;
  };
  
  const handleAddProduct = () => {
    if (!validateForm()) return;
    
    const newProduct: Product = {
      id: Date.now().toString(),
      shopId: shopId,
      name: productForm.name,
      category: productForm.category || undefined,
      description: productForm.description || undefined,
      basePrice: parseFloat(productForm.basePrice),
      sellingPrice: parseFloat(productForm.sellingPrice),
      quantity: parseInt(productForm.quantity),
      unit: productForm.unit || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    addProduct(newProduct);
    
    setIsModalVisible(false);
    resetForm();
    
    Alert.alert('Success', 'Product added successfully');
    loadInventory();
  };
  
  const handleEditProduct = () => {
    if (!validateForm() || !currentProduct) return;
    
    const updatedProduct: Product = {
      ...currentProduct,
      name: productForm.name,
      category: productForm.category || undefined,
      description: productForm.description || undefined,
      basePrice: parseFloat(productForm.basePrice),
      sellingPrice: parseFloat(productForm.sellingPrice),
      quantity: parseInt(productForm.quantity),
      unit: productForm.unit || undefined,
      updatedAt: new Date().toISOString(),
    };
    
    updateProduct(updatedProduct);
    
    setIsModalVisible(false);
    resetForm();
    
    Alert.alert('Success', 'Product updated successfully');
    loadInventory();
  };
  
  const handleDeleteProduct = (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteProduct(productId);
            Alert.alert('Success', 'Product deleted successfully');
            loadInventory();
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
  
  const openEditModal = (product: Product) => {
    setIsEditMode(true);
    setCurrentProduct(product);
    setProductForm({
      name: product.name,
      category: product.category || '',
      description: product.description || '',
      basePrice: product.basePrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      quantity: product.quantity.toString(),
      unit: product.unit || '',
    });
    setIsModalVisible(true);
  };
  
  const resetForm = () => {
    setProductForm({
      name: '',
      category: '',
      description: '',
      basePrice: '',
      sellingPrice: '',
      quantity: '',
      unit: '',
    });
    setCurrentProduct(null);
  };
  
  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      <View style={styles.productHeader}>
        <Text style={styles.productName}>{item.name}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <MaterialCommunityIcons name="pencil" size={18} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteProduct(item.id)}
          >
            <MaterialCommunityIcons name="delete" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.productDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category:</Text>
          <Text style={styles.detailValue}>{item.category || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Base Price:</Text>
          <Text style={styles.detailValue}>₹{item.basePrice.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Selling Price:</Text>
          <Text style={styles.detailValue}>₹{item.sellingPrice.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quantity:</Text>
          <Text style={styles.detailValue}>{item.quantity} {item.unit || ''}</Text>
        </View>
      </View>
    </View>
  );
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading inventory...</Text>
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
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      
      {filteredProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="package-variant" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No products found</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={openAddModal}>
            <Text style={styles.emptyStateButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
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
                {isEditMode ? 'Edit Product' : 'Add Product'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Product name"
                value={productForm.name}
                onChangeText={(value) => handleInputChange('name', value)}
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="Category (optional)"
                value={productForm.category}
                onChangeText={(value) => handleInputChange('category', value)}
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                value={productForm.description}
                onChangeText={(value) => handleInputChange('description', value)}
                multiline={true}
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Base Price *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={productForm.basePrice}
                  onChangeText={(value) => handleInputChange('basePrice', value)}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.formField, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Selling Price *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={productForm.sellingPrice}
                  onChangeText={(value) => handleInputChange('sellingPrice', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={productForm.quantity}
                  onChangeText={(value) => handleInputChange('quantity', value)}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.formField, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Unit</Text>
                <TextInput
                  style={styles.input}
                  placeholder="pcs, kg, etc."
                  value={productForm.unit}
                  onChangeText={(value) => handleInputChange('unit', value)}
                />
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={isEditMode ? handleEditProduct : handleAddProduct}
            >
              <Text style={styles.submitButtonText}>
                {isEditMode ? 'Update Product' : 'Add Product'}
              </Text>
            </TouchableOpacity>
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
  productItem: {
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
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  productDetails: {
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
  formRow: {
    flexDirection: 'row',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
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
}); 