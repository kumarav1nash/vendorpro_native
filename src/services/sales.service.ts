import apiClient from './api-client';
import { Sale, CreateSaleDto, UpdateSaleDto } from '../types/sales';

export async function createSale(data: CreateSaleDto): Promise<Sale> {
  try {
    const res = await apiClient.post<Sale>('sales', data);
    console.log('Sale created successfully:', res.data.id);
    return res.data;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
}

export async function getAllSales(params?: { shopId?: string; salesmanId?: string }): Promise<Sale[]> {
  try {
    console.log('Fetching sales with params:', params);
    const res = await apiClient.get<Sale[]>('sales', { params });
    console.log(`Sales fetch successful, count: ${res.data.length}`);
    return res.data;
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
}

export async function getSaleById(id: string): Promise<Sale> {
  const res = await apiClient.get<Sale>(`sales/${id}`);
  return res.data;
}

export async function updateSale(id: string, data: UpdateSaleDto): Promise<Sale> {
  const res = await apiClient.patch<Sale>(`sales/${id}`, data);
  return res.data;
}

export async function deleteSale(id: string): Promise<void> {
  await apiClient.delete(`sales/${id}`);
}

export async function approveSale(id: string): Promise<Sale> {
  const res = await apiClient.post<Sale>(`sales/${id}/approve`, {});
  return res.data;
}

export async function rejectSale(id: string): Promise<Sale> {
  const res = await apiClient.post<Sale>(`sales/${id}/reject`, {});
  return res.data;
} 