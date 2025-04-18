import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Salesman type definition
export type Salesman = {
  id: string;
  name: string;
  mobile: string;
  username: string;
  password: string; // In a real app, this should be hashed
  commissionRate: number; // Percentage of sales
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  totalSales?: number; // Calculated value
  totalCommission?: number; // Calculated value
};

type SalesmenContextType = {
  salesmen: Salesman[];
  isLoading: boolean;
  loadSalesmen: () => Promise<void>;
  saveSalesmen: (updatedSalesmen: Salesman[]) => Promise<void>;
  addSalesman: (salesman: Omit<Salesman, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSalesman: (id: string, updates: Partial<Omit<Salesman, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteSalesman: (id: string) => Promise<void>;
};

const SalesmenContext = createContext<SalesmenContextType | undefined>(undefined);

export const SalesmenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSalesmen();
  }, []);

  const loadSalesmen = async () => {
    setIsLoading(true);
    try {
      const savedSalesmen = await AsyncStorage.getItem('salesmen');
      
      if (savedSalesmen) {
        const parsedSalesmen = JSON.parse(savedSalesmen) as Salesman[];
        setSalesmen(parsedSalesmen);
      }
    } catch (error) {
      console.error('Error loading salesmen:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSalesmen = async (updatedSalesmen: Salesman[]) => {
    try {
      await AsyncStorage.setItem('salesmen', JSON.stringify(updatedSalesmen));
      setSalesmen(updatedSalesmen);
    } catch (error) {
      console.error('Error saving salesmen:', error);
      throw error;
    }
  };

  const addSalesman = async (salesman: Omit<Salesman, 'id' | 'createdAt' | 'updatedAt'>) => {
    const timestamp = Date.now();
    const newSalesman: Salesman = {
      ...salesman,
      id: `salesman-${timestamp}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    const updatedSalesmen = [...salesmen, newSalesman];
    await saveSalesmen(updatedSalesmen);
  };

  const updateSalesman = async (id: string, updates: Partial<Omit<Salesman, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const timestamp = Date.now();
    const updatedSalesmen = salesmen.map(salesman => 
      salesman.id === id 
        ? { 
            ...salesman, 
            ...updates, 
            updatedAt: timestamp 
          } 
        : salesman
    );
    
    await saveSalesmen(updatedSalesmen);
  };

  const deleteSalesman = async (id: string) => {
    const updatedSalesmen = salesmen.filter(salesman => salesman.id !== id);
    await saveSalesmen(updatedSalesmen);
  };

  return (
    <SalesmenContext.Provider 
      value={{ 
        salesmen, 
        isLoading, 
        loadSalesmen, 
        saveSalesmen,
        addSalesman,
        updateSalesman,
        deleteSalesman
      }}
    >
      {children}
    </SalesmenContext.Provider>
  );
};

export const useSalesmen = () => {
  const context = useContext(SalesmenContext);
  if (context === undefined) {
    throw new Error('useSalesmen must be used within a SalesmenProvider');
  }
  return context;
}; 