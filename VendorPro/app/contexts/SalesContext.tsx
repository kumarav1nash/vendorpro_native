import React, { createContext, useContext, useState, useEffect } from 'react';
import { ServiceFactory } from '../services/ServiceFactory';

export type Sale = {
  id: string;
  shopId: string;
  customerName: string;
  productId: string;
  salesmanId: string;
  quantity: number;
  totalAmount: number;
  commission: number;
  status: 'pending' | 'completed' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
};

type SalesContextType = {
  sales: Sale[];
  addSale: (sale: Sale) => Promise<void>;
  updateSale: (sale: Sale) => Promise<void>;
  deleteSale: (saleId: string) => Promise<void>;
  getShopSales: (shopId: string) => Sale[];
  getSalesmanSales: (salesmanId: string) => Sale[];
  getSaleById: (saleId: string) => Sale | undefined;
  getTotalRevenue: (shopId?: string) => number;
  getPendingSales: (shopId?: string) => Sale[];
  getCompletedSales: (shopId?: string) => Sale[];
  loadSales: () => Promise<void>;
};

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  // Get repository instance
  const salesRepository = ServiceFactory.getSalesRepository();

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const loadedSales = await salesRepository.getAll();
      setSales(loadedSales);
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  const addSale = async (sale: Sale) => {
    try {
      await salesRepository.create(sale);
      await loadSales(); // Reload sales after adding
    } catch (error) {
      console.error('Error adding sale:', error);
    }
  };

  const updateSale = async (updatedSale: Sale) => {
    try {
      await salesRepository.update(updatedSale);
      await loadSales(); // Reload sales after updating
    } catch (error) {
      console.error('Error updating sale:', error);
    }
  };

  const deleteSale = async (saleId: string) => {
    try {
      await salesRepository.delete(saleId);
      await loadSales(); // Reload sales after deleting
    } catch (error) {
      console.error('Error deleting sale:', error);
    }
  };

  const getShopSales = (shopId: string) => {
    return sales.filter(sale => sale.shopId === shopId);
  };

  const getSalesmanSales = (salesmanId: string) => {
    return sales.filter(sale => sale.salesmanId === salesmanId);
  };

  const getSaleById = (saleId: string) => {
    return sales.find(sale => sale.id === saleId);
  };

  const getTotalRevenue = (shopId?: string) => {
    if (shopId) {
      return getShopSales(shopId).reduce((sum, sale) => sum + sale.totalAmount, 0);
    }
    return sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  };

  const getPendingSales = (shopId?: string) => {
    if (shopId) {
      return getShopSales(shopId).filter(sale => sale.status === 'pending');
    }
    return sales.filter(sale => sale.status === 'pending');
  };

  const getCompletedSales = (shopId?: string) => {
    if (shopId) {
      return getShopSales(shopId).filter(sale => sale.status === 'completed');
    }
    return sales.filter(sale => sale.status === 'completed');
  };

  const value = {
    sales,
    addSale,
    updateSale,
    deleteSale,
    getShopSales,
    getSalesmanSales,
    getSaleById,
    getTotalRevenue,
    getPendingSales,
    getCompletedSales,
    loadSales,
  };

  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
};

// Add default export for the component to fix the routing error
export default function SalesContextScreen() {
  return null;
} 