import React, { createContext, useContext, useState, useEffect } from 'react';
import ServiceFactory from '../services/ServiceFactory';

export type Salesman = {
  id: string;
  shopId: string;
  name: string;
  mobile: string;
  username?: string;
  password?: string;
  commissionRate: number;
  isActive: boolean;
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
  // Get repository instance
  const salesmenRepository = ServiceFactory.getSalesmenRepository();

  useEffect(() => {
    loadSalesmen();
  }, []);

  const loadSalesmen = async () => {
    try {
      const loadedSalesmen = await salesmenRepository.getAll();
      setSalesmen(loadedSalesmen);
    } catch (error) {
      console.error('Error loading salesmen:', error);
    }
  };

  const addSalesman = async (salesman: Salesman) => {
    try {
      await salesmenRepository.create(salesman);
      await loadSalesmen(); // Reload salesmen after adding
    } catch (error) {
      console.error('Error adding salesman:', error);
    }
  };

  const updateSalesman = async (updatedSalesman: Salesman) => {
    try {
      await salesmenRepository.update(updatedSalesman);
      await loadSalesmen(); // Reload salesmen after updating
    } catch (error) {
      console.error('Error updating salesman:', error);
    }
  };

  const deleteSalesman = async (salesmanId: string) => {
    try {
      await salesmenRepository.delete(salesmanId);
      await loadSalesmen(); // Reload salesmen after deleting
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

// Add default export for the component to fix the routing error
export default function SalesmenContextScreen() {
  return null;
} 