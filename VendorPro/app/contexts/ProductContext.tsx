import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Product = {
  id: string;
  shopId: string;
  name: string;
  category?: string;
  description?: string;
  basePrice: number;
  sellingPrice: number;
  quantity: number;
  unit?: string;
  createdAt: string;
  updatedAt: string;
};

type ProductContextType = {
  products: Product[];
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
  getShopProducts: (shopId: string) => Product[];
  loadProducts: () => Promise<void>;
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const productsData = await AsyncStorage.getItem('products');
      if (productsData) {
        setProducts(JSON.parse(productsData));
      } else {
        // Initialize with empty array if no data
        await AsyncStorage.setItem('products', JSON.stringify([]));
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const saveProducts = async (updatedProducts: Product[]) => {
    try {
      await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Error saving products:', error);
    }
  };

  const addProduct = async (product: Product) => {
    try {
      const updatedProducts = [...products, product];
      await saveProducts(updatedProducts);
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    try {
      const updatedProducts = products.map(product => 
        product.id === updatedProduct.id ? updatedProduct : product
      );
      await saveProducts(updatedProducts);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const updatedProducts = products.filter(product => product.id !== productId);
      await saveProducts(updatedProducts);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const getProductById = (productId: string) => {
    return products.find(product => product.id === productId);
  };

  const getShopProducts = (shopId: string) => {
    return products.filter(product => product.shopId === shopId);
  };

  const value = {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getShopProducts,
    loadProducts,
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

// Add default export for the component to fix the routing error
export default function ProductContextScreen() {
  return null;
} 