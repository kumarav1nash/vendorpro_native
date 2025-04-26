import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Inventory, CreateInventoryDto, UpdateInventoryDto } from '../types/inventory';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createInventory(shopId: string, data: CreateInventoryDto): Promise<Inventory> {
  const headers = await getAuthHeaders();
  const res = await axios.post<Inventory>(`${API_BASE}/inventory/${shopId}`, data, { headers });
  return res.data;
}

export async function getAllInventory(): Promise<Inventory[]> {
  const headers = await getAuthHeaders();
  const res = await axios.get<Inventory[]>(`${API_BASE}/inventory`, { headers });
  return res.data;
}

export async function getInventoryById(id: string): Promise<Inventory> {
  const headers = await getAuthHeaders();
  const res = await axios.get<Inventory>(`${API_BASE}/inventory/${id}`, { headers });
  return res.data;
}

export async function updateInventory(id: string, data: UpdateInventoryDto): Promise<Inventory> {
  const headers = await getAuthHeaders();
  const res = await axios.patch<Inventory>(`${API_BASE}/inventory/${id}`, data, { headers });
  return res.data;
}

export async function deleteInventory(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  await axios.delete(`${API_BASE}/inventory/${id}`, { headers });
}

export async function getInventoryByShopId(shopId: string): Promise<Inventory[]> {
  const headers = await getAuthHeaders();
  const res = await axios.get<Inventory[]>(`${API_BASE}/inventory/shop/${shopId}`, { headers });
  return res.data;
} 