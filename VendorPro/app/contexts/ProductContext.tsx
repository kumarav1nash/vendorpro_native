import React, { createContext, useContext, useState, useEffect } from 'react';
import { ServiceFactory } from '../services/ServiceFactory';

export type Product = {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  quantity: number;
  basePrice: number;
  sellingPrice: number;
  unit?: string;
  createdAt: string;
  updatedAt: string;
};

type ProductsContextType = {
  products: Product[];
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getShopProducts: (shopId: string) => Product[];
  getProductById: (productId: string) => Product | undefined;
  loadProducts: () => Promise<void>;
};

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  // Get repository instance
  const productsRepository = ServiceFactory.getProductsRepository();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const loadedProducts = await productsRepository.getAll();
      setProducts(loadedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const addProduct = async (product: Product) => {
    try {
      await productsRepository.create(product);
      await loadProducts(); // Reload products after adding
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    try {
      await productsRepository.update(updatedProduct);
      await loadProducts(); // Reload products after updating
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await productsRepository.delete(productId);
      await loadProducts(); // Reload products after deleting
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const getShopProducts = (shopId: string) => {
    return products.filter(product => product.shopId === shopId);
  };

  const getProductById = (productId: string) => {
    return products.find(product => product.id === productId);
  };

  const value = {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getShopProducts,
    getProductById,
    loadProducts,
  };

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
};

// Add default export for the component to fix the routing error
export default function ProductsContextScreen() {
  return null;
} 