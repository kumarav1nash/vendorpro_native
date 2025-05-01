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
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useInventory } from '../../../src/contexts/InventoryContext';
import { Inventory, CreateInventoryDto, UpdateInventoryDto } from '../../../src/types/inventory';
import { useUser } from '../../../src/contexts/UserContext';
import { useShop } from '../../../src/contexts/ShopContext';
import { useImages } from '../../../src/contexts/ImageContext';
import { ProductImage } from '../ui/ProductImage';
import { Shop } from '@/src/types/shop';
import { ImagePickerResult } from '../../../src/utils/imageHelpers';

type InventoryTabProps = {
  shopId: string;
  shop: Shop;
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
    height: 50,
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
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productImageContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
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
    color: '#333',
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
    borderLeftWidth: 1,
    borderLeftColor: '#f0f0f0',
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
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
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
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
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
    backgroundColor: '#f9f9f9',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
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
    borderRadius: 12,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    width: '48%',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricTextContainer: {
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  uploadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
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
  const { uploadImageWithPicker, uploadImageForEntity } = useImages();
  
  // Enable this for detailed logging
  const DEBUG_MODE = true;
  
  // State for the component
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [displayedInventory, setDisplayedInventory] = useState<Inventory[]>([]);
  const [showLowStock, setShowLowStock] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = useState<CreateInventoryDto>({
    productName: '',
    basePrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    productImageFilename: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  //import API_BASE_URL from env
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
  // KPI metrics state
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalValue: 0,
    averagePrice: 0
  });

  // Constants
  const LOW_STOCK_THRESHOLD = 10;

  // Load inventory data when component mounts or shopId changes
  useEffect(() => {
    loadInventory();
  }, [shopId]);

  // Calculate metrics
  useEffect(() => {
    if (inventories && inventories.length > 0) {
      // Filter products for this shop
      
      // Count products
      const totalProducts = inventories.length;
      
      // Count low stock products
      const lowStockProducts = inventories.filter(
        item => item.stockQuantity <= LOW_STOCK_THRESHOLD && item.stockQuantity > 0
      ).length;
      
      // Count out of stock products
      const outOfStockProducts = inventories.filter(
        item => item.stockQuantity === 0
      ).length;
      
      // Calculate total inventory value and average price
      let totalValue = 0;
      inventories.forEach(item => {
        const price = typeof item.sellingPrice === 'string' 
          ? parseFloat(item.sellingPrice) 
          : item.sellingPrice;
        
        totalValue += price * item.stockQuantity;
      });
      
      const averagePrice = totalProducts > 0 
        ? inventories.reduce((sum, item) => {
            const price = typeof item.sellingPrice === 'string' 
              ? parseFloat(item.sellingPrice) 
              : item.sellingPrice;
            return sum + price;
          }, 0) / totalProducts
        : 0;
      
      // Update metrics
      setMetrics({
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalValue,
        averagePrice
      });
    }
  }, [inventories, shopId]);

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
      
      if (__DEV__ && inventories) {
        console.log(`Loaded ${inventories.length} inventory items`);
        // Log the first item to see if it has image data
        if (inventories.length > 0) {
          console.log("First inventory item sample:", JSON.stringify(inventories[0], null, 2));
        }
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
    
    if (!formData.basePrice || isNaN(Number(formData.basePrice)) || Number(formData.basePrice) <= 0) {
      Alert.alert('Error', 'Base price must be greater than 0');
      return false;
    }
    
    if (!formData.sellingPrice || isNaN(Number(formData.sellingPrice)) || Number(formData.sellingPrice) <= 0) {
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
    
    try {
      // If we have a local image URI, upload it first using the context's uploadImageForEntity method
      let uploadedImageUrl = undefined;
      if (formData.productImageFilename && !formData.productImageFilename.startsWith('http')) {
        // Show loading state
        setFormSubmitting(true);
        
        try {
          // Get file info for creating a proper ImagePickerResult
          const fileInfo = await FileSystem.getInfoAsync(formData.productImageFilename);
          if (!fileInfo.exists) {
            console.error('File not found:', formData.productImageFilename);
            Alert.alert('Error', 'The selected image file was not found');
            return;
          }
          
          // Create the image object in the format expected by the context
          const imagePickerResult: ImagePickerResult = {
            uri: formData.productImageFilename,
            name: formData.productImageFilename.split('/').pop() || `image_${Date.now()}.jpg`,
            type: 'image/jpeg',
            size: fileInfo.size,
          };
          
          // Use the context's uploadImageForEntity method
          // Note: We're not passing the description parameter anymore since the API only needs the file
          console.log('Uploading image using ImageContext:', imagePickerResult.uri);
          const uploadResult = await uploadImageForEntity(imagePickerResult);
          
          // Detailed logging to understand the response structure
          console.log('Upload result type:', typeof uploadResult);
          console.log('Upload result complete:', JSON.stringify(uploadResult, null, 2));
          
          if (uploadResult) {
            // Check for URL in different possible response formats
            if (typeof uploadResult === 'object') {
              if (uploadResult.url) {
                uploadedImageUrl = uploadResult.url;
                //add the base url to the image url if it's a relative path
                if (!uploadedImageUrl.startsWith('http')) {
                  // Make sure we handle path joining correctly without extra slashes
                  const baseUrl = API_BASE_URL?.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
                  const imagePath = uploadedImageUrl.startsWith('/') ? uploadedImageUrl : `/${uploadedImageUrl}`;
                  uploadedImageUrl = `${baseUrl}${imagePath}`;
                }
                console.log('Image URL found at uploadResult.url:', uploadedImageUrl);
              } else if (uploadResult.filename) {
                uploadedImageUrl = uploadResult.filename;
                //add the base url to the image url if it's a relative path
                if (!uploadedImageUrl.startsWith('http')) {
                  // Make sure we handle path joining correctly without extra slashes
                  const baseUrl = API_BASE_URL?.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
                  const imagePath = uploadedImageUrl.startsWith('/') ? uploadedImageUrl : `/${uploadedImageUrl}`;
                  uploadedImageUrl = `${baseUrl}${imagePath}`;
                }
                console.log('Image URL found at uploadResult.filename:', uploadedImageUrl);
              }
            }
            
            if (uploadedImageUrl) {
              console.log('Final image URL to use:', uploadedImageUrl);
            } else {
              console.error('Could not extract URL from upload result');
            }
          } else {
            console.error('Upload completed but returned null or undefined');
          }
        } catch (uploadError: any) {
          console.error('Error uploading image:', uploadError);
          Alert.alert('Upload Error', uploadError.message || 'Failed to upload image');
          setFormSubmitting(false);
          return;
        }
      }
      
      // Set form submitting state
      setFormSubmitting(true);
      
      if (editMode && editId) {
        // Update existing product
        const updateData: UpdateInventoryDto = {
          productName: formData.productName,
          basePrice: Number(formData.basePrice),
          sellingPrice: Number(formData.sellingPrice),
          stockQuantity: Number(formData.stockQuantity),
          productImageUrl: uploadedImageUrl || formData.productImageUrl,
        };
        
        // Log the update data
        console.log('Updating product with data:', JSON.stringify(updateData, null, 2));
        
        try {
          // Only include image if we have one
          if (!uploadedImageUrl && !formData.productImageUrl) {
            const { productImageUrl, ...dataWithoutImage } = updateData;
            console.log('Updating without image data:', JSON.stringify(dataWithoutImage, null, 2));
            await updateInventory(editId, dataWithoutImage);
          } else {
            await updateInventory(editId, updateData);
          }
          Alert.alert('Success', 'Product updated successfully');
        } catch (error) {
          console.error('Error updating product:', error);
          Alert.alert('Error', 'Failed to update product');
        }
      } else {
        // Add new product
        const newProduct: CreateInventoryDto = {
          productName: formData.productName,
          basePrice: Number(formData.basePrice) || 0,
          sellingPrice: Number(formData.sellingPrice) || 0,
          stockQuantity: Number(formData.stockQuantity) || 0,
          productImageUrl: uploadedImageUrl,
        };
        
        // Log the new product data
        console.log('Creating product with data:', JSON.stringify(newProduct, null, 2));
        
        try {
          // Only include image if we have one
          if (!uploadedImageUrl) {
            const { productImageUrl, ...newProductWithoutImage } = newProduct;
            console.log('Creating without image data:', JSON.stringify(newProductWithoutImage, null, 2));
            await createInventory(shopId, newProductWithoutImage);
          } else {
            await createInventory(shopId, newProduct);
          }
          Alert.alert('Success', 'Product added successfully');
        } catch (error) {
          console.error('Error adding product:', error);
          Alert.alert('Error', 'Failed to add product');
        }
      }
      
      setShowAddModal(false);
      resetForm();
      loadInventory();
    } catch (error: any) {
      console.error('Error during product submission:', error.message);
      Alert.alert('Error', `Failed to process your request: ${error.message}`);
    } finally {
      setFormSubmitting(false);
    }
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
      stockQuantity: typeof product.stockQuantity === 'string' ? parseInt(product.stockQuantity) : product.stockQuantity,
      productImageFilename: product.productImageFilename || '',
      productImageUrl: product.productImageUrl || '',
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
      productImageFilename: '',
      productImageUrl: '',
    });
    setEditMode(false);
    setEditId(null);
  };

  // Pick an image from the gallery
  const pickImage = async () => {
    try {
      // Use the same ImagePicker configuration as in the context
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        
        if (DEBUG_MODE) {
          console.log('Selected image:', selectedImageUri);
          
          // Get file info for debug purposes
          const fileInfo = await FileSystem.getInfoAsync(selectedImageUri);
          console.log('Selected image file info:', fileInfo);
        }
        
        // Store the local URI in productImageFilename for display purposes only
        // This will be used as the source for the image upload when submitting the form
        setFormData({
          ...formData,
          productImageFilename: selectedImageUri,
          // Clear any existing URL as we're selecting a new image
          productImageUrl: ''
        });
        
        // Show a message that the image will be uploaded when the form is submitted
        Alert.alert(
          'Image Selected',
          'The image will be uploaded when you save the product.',
          [{ text: 'OK' }]
        );
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
    
    // Log image URLs for debugging
    if (__DEV__ && DEBUG_MODE) {
      console.log(`Product ${item.productName} image data:`, {
        productImageUrl: item.productImageUrl,
        productImageFilename: item.productImageFilename
      });
    }
    
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
          <ProductImage 
            imageUrl={item.productImageUrl}
            width="100%"
            height="100%"
            borderRadius={8}
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.productDetails}>
          <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
            {item.productName}
          </Text>
          
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

  // Render KPI Cards
  const renderMetricsCards = () => {
    return (
      <View style={styles.metricsContainer}>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <MaterialCommunityIcons name="package-variant" size={24} color="#007AFF" />
            </View>
            <View style={styles.metricTextContainer}>
              <Text style={styles.metricValue}>{metrics.totalProducts}</Text>
              <Text style={styles.metricLabel}>Total Products</Text>
            </View>
          </View>
          
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <MaterialCommunityIcons name="cash" size={24} color="#4CAF50" />
            </View>
            <View style={styles.metricTextContainer}>
              <Text style={styles.metricValue}>₹{metrics.totalValue.toFixed(0)}</Text>
              <Text style={styles.metricLabel}>Inventory Value</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconContainer, { backgroundColor: '#FFF9C4' }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#FFC107" />
            </View>
            <View style={styles.metricTextContainer}>
              <Text style={styles.metricValue}>{metrics.lowStockProducts}</Text>
              <Text style={styles.metricLabel}>Low Stock Items</Text>
            </View>
          </View>
          
          <View style={styles.metricCard}>
            <View style={[styles.metricIconContainer, { backgroundColor: '#FFEBEE' }]}>
              <MaterialCommunityIcons name="package-variant-closed" size={24} color="#F44336" />
            </View>
            <View style={styles.metricTextContainer}>
              <Text style={styles.metricValue}>{metrics.outOfStockProducts}</Text>
              <Text style={styles.metricLabel}>Out of Stock</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* KPI Metrics Section */}
      {!isLoading && renderMetricsCards()}
      
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
              <TouchableOpacity 
                style={styles.imagePicker} 
                onPress={pickImage}
                disabled={formSubmitting}
              >
                {formData.productImageFilename ? (
                  <>
                    <Image
                      source={{ uri: formData.productImageFilename }}
                      style={styles.pickedImage}
                      contentFit="cover"
                      transition={100}
                    />
                    {formSubmitting && (
                      <View style={styles.imageOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.uploadingText}>Uploading...</Text>
                      </View>
                    )}
                  </>
                ) : formData.productImageUrl ? (
                  <Image
                    source={{ uri: formData.productImageUrl }}
                    style={styles.pickedImage}
                    contentFit="cover"
                    transition={100}
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
                  placeholderTextColor="#999"
                  returnKeyType="next"
                />
              </View>
              
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Base Price (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={formData.basePrice.toString()}
                    onChangeText={(value) => handleInputChange('basePrice', value)}
                    placeholderTextColor="#999"
                    returnKeyType="next"
                  />
                </View>
              
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Selling Price (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={formData.sellingPrice.toString()}
                    onChangeText={(value) => handleInputChange('sellingPrice', value)}
                    placeholderTextColor="#999"
                    returnKeyType="next"
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Stock Quantity *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  keyboardType="number-pad"
                  value={formData.stockQuantity.toString()}
                  onChangeText={(value) => handleInputChange('stockQuantity', value)}
                  placeholderTextColor="#999"
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
                disabled={formSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSubmit}
                disabled={formSubmitting}
              >
                {formSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editMode ? 'Update' : 'Add Product'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}