import React, { createContext, useContext, useState, useEffect } from 'react';
import { ServiceFactory } from '../services/ServiceFactory';

// Shop type definition
export type Shop = {
  id: string;
  name: string;
  gstin: string;
  address?: string;
  ownerName: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
};

type ShopContextType = {
  shops: Shop[];
  currentShop: Shop | null;
  addShop: (shop: Shop) => Promise<void>;
  updateShop: (shop: Shop) => Promise<void>;
  deleteShop: (shopId: string) => Promise<void>;
  getShopById: (shopId: string) => Shop | undefined;
  setCurrentShop: (shop: Shop | null) => void;
  loadShops: () => Promise<void>;
};

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  // Get repository instance
  const shopsRepository = ServiceFactory.getShopsRepository();

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      const loadedShops = await shopsRepository.getAll();
      setShops(loadedShops);
    } catch (error) {
      console.error('Error loading shops:', error);
    }
  };

  const addShop = async (shop: Shop) => {
    try {
      await shopsRepository.create(shop);
      await loadShops(); // Reload shops after adding
    } catch (error) {
      console.error('Error adding shop:', error);
    }
  };

  const updateShop = async (updatedShop: Shop) => {
    try {
      await shopsRepository.update(updatedShop);
      await loadShops(); // Reload shops after updating
      
      // Update currentShop if it's the one being updated
      if (currentShop && currentShop.id === updatedShop.id) {
        setCurrentShop(updatedShop);
      }
    } catch (error) {
      console.error('Error updating shop:', error);
    }
  };

  const deleteShop = async (shopId: string) => {
    try {
      await shopsRepository.delete(shopId);
      await loadShops(); // Reload shops after deleting
      
      // Clear currentShop if it's the one being deleted
      if (currentShop && currentShop.id === shopId) {
        setCurrentShop(null);
      }
    } catch (error) {
      console.error('Error deleting shop:', error);
    }
  };

  const getShopById = (shopId: string) => {
    return shops.find(shop => shop.id === shopId);
  };

  const value = {
    shops,
    currentShop,
    addShop,
    updateShop,
    deleteShop,
    getShopById,
    setCurrentShop,
    loadShops,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

// Add default export for the component to fix the routing error
export default function ShopContextScreen() {
  return null;
} 