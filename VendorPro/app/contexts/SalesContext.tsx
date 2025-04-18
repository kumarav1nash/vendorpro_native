import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from './ProductContext';

export type Sale = {
  id: string;
  customerName: string;
  productId: string;
  productName: string;
  salesmanId?: string;
  salesmanName?: string;
  quantity: number;
  totalAmount: number;
  status: 'completed' | 'pending' | 'rejected';
  rejectionReason?: string;
  commission?: number;
  date: number;
};

type SalesContextType = {
  sales: Sale[];
  isLoading: boolean;
  loadSales: () => Promise<void>;
  saveSales: (updatedSales: Sale[]) => Promise<void>;
  totalRevenue: number;
  pendingSales: number;
  completedSales: number;
};

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const savedSales = await AsyncStorage.getItem('sales');
      
      if (savedSales) {
        const parsedSales = JSON.parse(savedSales) as Sale[];
        setSales(parsedSales);
      }
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSales = async (updatedSales: Sale[]) => {
    try {
      await AsyncStorage.setItem('sales', JSON.stringify(updatedSales));
      setSales(updatedSales);
    } catch (error) {
      console.error('Error saving sales:', error);
      throw error;
    }
  };

  // Calculate dashboard metrics
  const totalRevenue = sales
    .filter(sale => sale.status === 'completed')
    .reduce((sum, sale) => sum + sale.totalAmount, 0);

  const pendingSales = sales.filter(sale => sale.status === 'pending').length;
  const completedSales = sales.filter(sale => sale.status === 'completed').length;

  return (
    <SalesContext.Provider 
      value={{ 
        sales, 
        isLoading, 
        loadSales, 
        saveSales, 
        totalRevenue,
        pendingSales,
        completedSales
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const context = useContext(SalesContext);
  if (context === undefined) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
}; 