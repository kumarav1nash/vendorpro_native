import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import {
  Inventory,
  CreateInventoryDto,
  UpdateInventoryDto
} from '../types/inventory';
import {
  createInventory,
  getAllInventory,
  getInventoryById,
  updateInventory,
  deleteInventory,
  getInventoryByShopId
} from '../services/inventory.service';

interface InventoryContextType {
  inventory: Inventory | null;
  inventories: Inventory[];
  loading: boolean;
  error: string | null;
  fetchAllInventory: () => Promise<void>;
  fetchInventoryById: (id: string) => Promise<void>;
  fetchInventoryByShopId: (shopId: string) => Promise<void>;
  createInventory: (shopId: string, data: CreateInventoryDto) => Promise<void>;
  updateInventory: (id: string, data: UpdateInventoryDto) => Promise<void>;
  deleteInventory: (id: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllInventory();
      setInventories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryById = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInventoryById(id);
      setInventory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory by id');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryByShopId = async (shopId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInventoryByShopId(shopId);
      setInventories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory by shop id');
    } finally {
      setLoading(false);
    }
  };

  const createInventoryContext = async (shopId: string, data: CreateInventoryDto) => {
    setLoading(true);
    setError(null);
    try {
      const created = await createInventory(shopId, data);
      setInventory(created);
    } catch (err: any) {
      setError(err.message || 'Failed to create inventory');
    } finally {
      setLoading(false);
    }
  };

  const updateInventoryContext = async (id: string, data: UpdateInventoryDto) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await updateInventory(id, data);
      setInventory(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update inventory');
    } finally {
      setLoading(false);
    }
  };

  const deleteInventoryContext = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteInventory(id);
      setInventory(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete inventory');
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({
    inventory,
    inventories,
    loading,
    error,
    fetchAllInventory,
    fetchInventoryById,
    fetchInventoryByShopId,
    createInventory: createInventoryContext,
    updateInventory: updateInventoryContext,
    deleteInventory: deleteInventoryContext,
  }), [inventory, inventories, loading, error]);

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}; 