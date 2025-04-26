import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { shopService } from '../services/shop.service';
import { Shop, CreateShopDto, AssignSalesmanDto, CreateSalesmanDto } from '../types/shop';

interface ShopContextType {
  shops: Shop[];
  isLoading: boolean;
  error: string | null;
  fetchAllShops: () => Promise<void>;
  fetchMyShops: () => Promise<void>;
  createShop: (data: CreateShopDto) => Promise<Shop>;
  updateShop: (shopId: string, data: Partial<CreateShopDto>) => Promise<Shop>;
  assignSalesman: (shopId: string, data: AssignSalesmanDto) => Promise<any>;
  createSalesman: (shopId: string, data: CreateSalesmanDto) => Promise<any>;
  getShopSalesmen: (shopId: string) => Promise<any[]>;
  removeSalesman: (shopId: string, salesmanId: string) => Promise<any>;
}

const ShopContext = createContext<ShopContextType>({} as ShopContextType);

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllShops = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await shopService.getAllShops();
      setShops(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shops');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyShops = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await shopService.getMyShops();
      setShops(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch my shops');
    } finally {
      setIsLoading(false);
    }
  };

  const createShop = async (data: CreateShopDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const shop = await shopService.createShop(data);
      setShops(prev => [...prev, shop]);
      return shop;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shop');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateShop = async (shopId: string, data: Partial<CreateShopDto>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await shopService.updateShop(shopId, data);
      setShops(prev => prev.map(s => (s.id === shopId ? updated : s)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update shop');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const assignSalesman = async (shopId: string, data: AssignSalesmanDto) => {
    setIsLoading(true);
    setError(null);
    try {
      return await shopService.assignSalesman(shopId, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign salesman');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createSalesman = async (shopId: string, data: CreateSalesmanDto) => {
    setIsLoading(true);
    setError(null);
    try {
      return await shopService.createSalesman(shopId, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create salesman');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getShopSalesmen = async (shopId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await shopService.getShopSalesmen(shopId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get salesmen');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeSalesman = async (shopId: string, salesmanId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await shopService.removeSalesman(shopId, salesmanId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove salesman');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo(() => ({
    shops,
    isLoading,
    error,
    fetchAllShops,
    fetchMyShops,
    createShop,
    updateShop,
    assignSalesman,
    createSalesman,
    getShopSalesmen,
    removeSalesman,
  }), [shops, isLoading, error]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}; 