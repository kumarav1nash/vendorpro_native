import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Product type definition
export type Product = {
  id: string;
  name: string;
  basePrice: number;
  sellingPrice: number;
  quantity: number;
  imageUri?: string;
  createdAt: number;
  updatedAt: number;
};

type ProductContextType = {
  products: Product[];
  isLoading: boolean;
  loadProducts: () => Promise<void>;
  saveProducts: (updatedProducts: Product[]) => Promise<void>;
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const savedProducts = await AsyncStorage.getItem('products');
      
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts) as Product[];
        setProducts(parsedProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProducts = async (updatedProducts: Product[]) => {
    try {
      await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Error saving products:', error);
      throw error;
    }
  };

  return (
    <ProductContext.Provider value={{ products, isLoading, loadProducts, saveProducts }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}; 