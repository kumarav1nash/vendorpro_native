import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Sale, CreateSaleDto, UpdateSaleDto } from '../types/sales';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createSale(data: CreateSaleDto): Promise<Sale> {
  const headers = await getAuthHeaders();
  const res = await axios.post<Sale>(`${API_BASE}/sales`, data, { headers });
  return res.data;
}

export async function getAllSales(params?: { shopId?: string; salesmanId?: string }): Promise<Sale[]> {
  const headers = await getAuthHeaders();
  const res = await axios.get<Sale[]>(`${API_BASE}/sales`, { headers, params });
  return res.data;
}

export async function getSaleById(id: string): Promise<Sale> {
  const headers = await getAuthHeaders();
  const res = await axios.get<Sale>(`${API_BASE}/sales/${id}`, { headers });
  return res.data;
}

export async function updateSale(id: string, data: UpdateSaleDto): Promise<Sale> {
  const headers = await getAuthHeaders();
  const res = await axios.patch<Sale>(`${API_BASE}/sales/${id}`, data, { headers });
  return res.data;
}

export async function deleteSale(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  await axios.delete(`${API_BASE}/sales/${id}`, { headers });
}

export async function approveSale(id: string): Promise<Sale> {
  const headers = await getAuthHeaders();
  const res = await axios.post<Sale>(`${API_BASE}/sales/${id}/approve`, {}, { headers });
  return res.data;
}

export async function rejectSale(id: string): Promise<Sale> {
  const headers = await getAuthHeaders();
  const res = await axios.post<Sale>(`${API_BASE}/sales/${id}/reject`, {}, { headers });
  return res.data;
} 