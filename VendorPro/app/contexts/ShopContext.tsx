import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Shop type definition
export type Shop = {
  id: string;
  name: string;
  address: string;
  contactNumber: string;
  email?: string;
  gstin?: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  ownerId: string; // For future multi-user support
};

type ShopContextType = {
  shops: Shop[];
  isLoading: boolean;
  currentShop: Shop | null;
  setCurrentShop: (shop: Shop | null) => void;
  loadShops: () => Promise<void>;
  saveShops: (updatedShops: Shop[]) => Promise<void>;
  addShop: (shop: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Shop>;
  updateShop: (id: string, updates: Partial<Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteShop: (id: string) => Promise<void>;
};

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    // Save current shop to AsyncStorage when it changes
    if (currentShop) {
      AsyncStorage.setItem('currentShop', JSON.stringify(currentShop));
    }
  }, [currentShop]);

  const loadShops = async () => {
    setIsLoading(true);
    try {
      // Load shops
      const savedShops = await AsyncStorage.getItem('shops');
      let parsedShops: Shop[] = [];
      
      if (savedShops) {
        parsedShops = JSON.parse(savedShops) as Shop[];
        setShops(parsedShops);
      }

      // Load current shop
      const savedCurrentShop = await AsyncStorage.getItem('currentShop');
      
      if (savedCurrentShop) {
        const parsedCurrentShop = JSON.parse(savedCurrentShop) as Shop;
        setCurrentShop(parsedCurrentShop);
      } else if (parsedShops.length > 0) {
        // Set first shop as current if none is set but shops exist
        setCurrentShop(parsedShops[0]);
        await AsyncStorage.setItem('currentShop', JSON.stringify(parsedShops[0]));
      }
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveShops = async (updatedShops: Shop[]) => {
    try {
      await AsyncStorage.setItem('shops', JSON.stringify(updatedShops));
      setShops(updatedShops);
      
      // If current shop was deleted or modified, update it
      if (currentShop) {
        const updatedCurrentShop = updatedShops.find(shop => shop.id === currentShop.id);
        if (updatedCurrentShop) {
          setCurrentShop(updatedCurrentShop);
        } else if (updatedShops.length > 0) {
          setCurrentShop(updatedShops[0]);
        } else {
          setCurrentShop(null);
        }
      }
    } catch (error) {
      console.error('Error saving shops:', error);
      throw error;
    }
  };

  const addShop = async (shop: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>) => {
    const timestamp = Date.now();
    const newShop: Shop = {
      ...shop,
      id: `shop-${timestamp}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    const updatedShops = [...shops, newShop];
    await saveShops(updatedShops);
    
    // If this is the first shop, set it as current
    if (shops.length === 0) {
      setCurrentShop(newShop);
    }
    
    return newShop;
  };

  const updateShop = async (id: string, updates: Partial<Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const timestamp = Date.now();
    const updatedShops = shops.map(shop => 
      shop.id === id 
        ? { 
            ...shop, 
            ...updates, 
            updatedAt: timestamp 
          } 
        : shop
    );
    
    await saveShops(updatedShops);
    
    // Update current shop if it was the one that was modified
    if (currentShop && currentShop.id === id) {
      const updatedShop = updatedShops.find(shop => shop.id === id);
      if (updatedShop) {
        setCurrentShop(updatedShop);
      }
    }
  };

  const deleteShop = async (id: string) => {
    const updatedShops = shops.filter(shop => shop.id !== id);
    await saveShops(updatedShops);
    
    // If the deleted shop was the current shop, set a new current shop
    if (currentShop && currentShop.id === id) {
      if (updatedShops.length > 0) {
        setCurrentShop(updatedShops[0]);
      } else {
        setCurrentShop(null);
      }
    }
  };

  return (
    <ShopContext.Provider 
      value={{ 
        shops,
        isLoading,
        currentShop,
        setCurrentShop,
        loadShops, 
        saveShops,
        addShop,
        updateShop,
        deleteShop
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

// Add default export for the component to fix the routing error
export default function ShopContextScreen() {
  return null;
} 