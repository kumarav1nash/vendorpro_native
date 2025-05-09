import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import {
  Sale,
  CreateSaleDto,
  UpdateSaleDto,
  SaleWithCommission
} from '../types/sales';
import {
  createSale,
  getAllSales,
  getSaleById,
  updateSale,
  deleteSale,
  approveSale,
  rejectSale
} from '../services/sales.service';
import { CommissionRule } from '../types/commission';
import { calculateCommission } from '../utils/commissions';

interface SalesContextType {
  sale: Sale | null;
  sales: Sale[];
  salesWithCommission: SaleWithCommission[];
  loading: boolean;
  error: string | null;
  fetchAllSales: (params?: { shopId?: string; salesmanId?: string }) => Promise<void>;
  fetchAllSalesWithCommission: (activeCommissionRule: CommissionRule | null, params?: { shopId?: string; salesmanId?: string }) => Promise<void>;
  fetchSaleById: (id: string) => Promise<void>;
  createSale: (data: CreateSaleDto) => Promise<void>;
  updateSale: (id: string, data: UpdateSaleDto) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  approveSale: (id: string) => Promise<void>;
  rejectSale: (id: string) => Promise<void>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};

export const SalesProvider = ({ children }: { children: ReactNode }) => {
  const [sale, setSale] = useState<Sale | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesWithCommission, setSalesWithCommission] = useState<SaleWithCommission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllSales = async (params?: { shopId?: string; salesmanId?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSales(params);
      setSales(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSalesWithCommission = async (activeCommissionRule: CommissionRule | null, params?: { shopId?: string; salesmanId?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSales(params);
      console.log(`Fetched ${data.length} sales from API`);
      
      // If no active commission rule, just set the sales without commission calculation
      if (!activeCommissionRule) {
        console.log('No active commission rule found, setting sales without commission');
        const salesWithZeroCommission = data.map(sale => ({
          ...sale,
          commissionAmount: 0
        }));
        setSalesWithCommission(salesWithZeroCommission);
        return;
      }
      
      console.log('Calculating commission for sales with rule:', activeCommissionRule.type);
      
      const salesWithCommission = await Promise.all(data.map(async (sale) => {
        try {
          const commissionAmount = await calculateCommission(sale, activeCommissionRule);
          return {
            ...sale,
            commissionAmount
          };
        } catch (calcError) {
          console.error('Error calculating commission for sale', sale.id, calcError);
          return {
            ...sale,
            commissionAmount: 0
          };
        }
      }));
      
      console.log(`Processed ${salesWithCommission.length} sales with commission`);
      setSalesWithCommission(salesWithCommission);
    } catch (err: any) {
      console.error('Failed to fetch sales with commission:', err);
      setError(err.message || 'Failed to fetch sales with commission');
      // Still set empty array to clear any previous data
      setSalesWithCommission([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleById = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSaleById(id);
      setSale(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sale by id');
    } finally {
      setLoading(false);
    }
  };

  const createSaleContext = async (data: CreateSaleDto) => {
    setLoading(true);
    setError(null);
    try {
      const created = await createSale(data);
      setSale(created);
    } catch (err: any) {
      setError(err.message || 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  const updateSaleContext = async (id: string, data: UpdateSaleDto) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await updateSale(id, data);
      setSale(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update sale');
    } finally {
      setLoading(false);
    }
  };

  const deleteSaleContext = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteSale(id);
      setSale(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete sale');
    } finally {
      setLoading(false);
    }
  };

  const approveSaleContext = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const approved = await approveSale(id);
      setSale(approved);
    } catch (err: any) {
      setError(err.message || 'Failed to approve sale');
    } finally {
      setLoading(false);
    }
  };

  const rejectSaleContext = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const rejected = await rejectSale(id);
      setSale(rejected);
    } catch (err: any) {
      setError(err.message || 'Failed to reject sale');
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({
    sale,
    sales,
    salesWithCommission,
    loading,
    error,
    fetchAllSales,
    fetchAllSalesWithCommission,
    fetchSaleById,
    createSale: createSaleContext,
    updateSale: updateSaleContext,
    deleteSale: deleteSaleContext,
    approveSale: approveSaleContext,
    rejectSale: rejectSaleContext,
  }), [sale, sales, loading, error]);

  return (
    <SalesContext.Provider value={value}>
      {children}
    </SalesContext.Provider>
  );
}; 