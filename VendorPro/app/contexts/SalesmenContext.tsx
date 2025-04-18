import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Salesman = {
  id: string;
  shopId: string;
  name: string;
  mobile: string;
  username?: string;
  commissionRate: number;
  createdAt: string;
  updatedAt: string;
};

type SalesmenContextType = {
  salesmen: Salesman[];
  addSalesman: (salesman: Salesman) => Promise<void>;
  updateSalesman: (salesman: Salesman) => Promise<void>;
  deleteSalesman: (salesmanId: string) => Promise<void>;
  getShopSalesmen: (shopId: string) => Salesman[];
  getSalesmanById: (salesmanId: string) => Salesman | undefined;
  loadSalesmen: () => Promise<void>;
};

const SalesmenContext = createContext<SalesmenContextType | undefined>(undefined);

export const useSalesmen = () => {
  const context = useContext(SalesmenContext);
  if (!context) {
    throw new Error('useSalesmen must be used within a SalesmenProvider');
  }
  return context;
};

export const SalesmenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);

  useEffect(() => {
    loadSalesmen();
  }, []);

  const loadSalesmen = async () => {
    try {
      const salesmenData = await AsyncStorage.getItem('salesmen');
      if (salesmenData) {
        setSalesmen(JSON.parse(salesmenData));
      } else {
        // Initialize with empty array if no data
        await AsyncStorage.setItem('salesmen', JSON.stringify([]));
        setSalesmen([]);
      }
    } catch (error) {
      console.error('Error loading salesmen:', error);
    }
  };

  const saveSalesmen = async (updatedSalesmen: Salesman[]) => {
    try {
      await AsyncStorage.setItem('salesmen', JSON.stringify(updatedSalesmen));
      setSalesmen(updatedSalesmen);
    } catch (error) {
      console.error('Error saving salesmen:', error);
    }
  };

  const addSalesman = async (salesman: Salesman) => {
    try {
      const updatedSalesmen = [...salesmen, salesman];
      await saveSalesmen(updatedSalesmen);
    } catch (error) {
      console.error('Error adding salesman:', error);
    }
  };

  const updateSalesman = async (updatedSalesman: Salesman) => {
    try {
      const updatedSalesmen = salesmen.map(salesman => 
        salesman.id === updatedSalesman.id ? updatedSalesman : salesman
      );
      await saveSalesmen(updatedSalesmen);
    } catch (error) {
      console.error('Error updating salesman:', error);
    }
  };

  const deleteSalesman = async (salesmanId: string) => {
    try {
      const updatedSalesmen = salesmen.filter(salesman => salesman.id !== salesmanId);
      await saveSalesmen(updatedSalesmen);
    } catch (error) {
      console.error('Error deleting salesman:', error);
    }
  };

  const getShopSalesmen = (shopId: string) => {
    return salesmen.filter(salesman => salesman.shopId === shopId);
  };

  const getSalesmanById = (salesmanId: string) => {
    return salesmen.find(salesman => salesman.id === salesmanId);
  };

  const value = {
    salesmen,
    addSalesman,
    updateSalesman,
    deleteSalesman,
    getShopSalesmen,
    getSalesmanById,
    loadSalesmen,
  };

  return <SalesmenContext.Provider value={value}>{children}</SalesmenContext.Provider>;
}; 