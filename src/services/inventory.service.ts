import apiClient from './api-client';
import { Inventory, CreateInventoryDto, UpdateInventoryDto } from '../types/inventory';

export async function createInventory(shopId: string, data: CreateInventoryDto): Promise<Inventory> {
  const res = await apiClient.post<Inventory>(`inventory/${shopId}`, data);
  return res.data;
}

export async function getAllInventory(): Promise<Inventory[]> {
  const res = await apiClient.get<Inventory[]>('inventory');
  return res.data;
}

export async function getInventoryById(id: string): Promise<Inventory> {
  const res = await apiClient.get<Inventory>(`inventory/${id}`);
  return res.data;
}

export async function updateInventory(id: string, data: UpdateInventoryDto): Promise<Inventory> {
  const res = await apiClient.patch<Inventory>(`inventory/${id}`, data);
  return res.data;
}

export async function deleteInventory(id: string): Promise<void> {
  await apiClient.delete(`inventory/${id}`);
}

export async function getInventoryByShopId(shopId: string): Promise<Inventory[]> {
  try {
    console.log(`Fetching inventory for shop ID: ${shopId}`);
    const res = await apiClient.get<Inventory[]>(`inventory/shop/${shopId}`);
    console.log(`Inventory fetch successful, items count: ${res.data.length}`);
    return res.data;
  } catch (error) {
    console.error(`Error fetching inventory for shop ${shopId}:`, error);
    throw error;
  }
} 