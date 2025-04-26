import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
  Commission,
  CommissionRule,
  CreateCommissionDto,
  CreateCommissionRuleDto,
  AssignCommissionRuleDto,
  CommissionDateRangeResult
} from '../types/commission';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createCommission(data: CreateCommissionDto): Promise<Commission> {
  const headers = await getAuthHeaders();
  const res = await axios.post<Commission>(`${API_BASE}/commissions/create`, data, { headers });
  return res.data;
}

export async function getAllCommissions(): Promise<Commission[]> {
  const headers = await getAuthHeaders();
  const res = await axios.get<Commission[]>(`${API_BASE}/commissions`, { headers });
  return res.data;
}

export async function getCommissionById(id: string): Promise<Commission> {
  const headers = await getAuthHeaders();
  const res = await axios.get<Commission>(`${API_BASE}/commissions/${id}`, { headers });
  return res.data;
}

export async function createCommissionRule(data: CreateCommissionRuleDto): Promise<CommissionRule> {
  const headers = await getAuthHeaders();
  const res = await axios.post<CommissionRule>(`${API_BASE}/commissions/rules`, data, { headers });
  return res.data;
}

export async function getAllCommissionRules(): Promise<CommissionRule[]> {
  const headers = await getAuthHeaders();
  const res = await axios.get<CommissionRule[]>(`${API_BASE}/commissions/rules`, { headers });
  return res.data;
}

export async function assignCommissionRule(data: AssignCommissionRuleDto): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await axios.post(`${API_BASE}/commissions/rules/assign`, data, { headers });
  return res.data;
}

export async function getCommissionsBySalesman(salesmanId: string): Promise<Commission[]> {
  const headers = await getAuthHeaders();
  const res = await axios.get<Commission[]>(`${API_BASE}/commissions/salesman/${salesmanId}`, { headers });
  return res.data;
}

export async function getCommissionsByShop(shopId: string): Promise<Commission[]> {
  const headers = await getAuthHeaders();
  const res = await axios.get<Commission[]>(`${API_BASE}/commissions/shop/${shopId}`, { headers });
  return res.data;
}

export async function markCommissionAsPaid(commissionId: string): Promise<Commission> {
  const headers = await getAuthHeaders();
  const res = await axios.post<Commission>(`${API_BASE}/commissions/${commissionId}/mark-paid`, {}, { headers });
  return res.data;
}

export async function getCommissionsByDateRange(params: { startDate: string; endDate: string; salesmanId?: string; shopId?: string }): Promise<CommissionDateRangeResult> {
  const headers = await getAuthHeaders();
  const res = await axios.get<CommissionDateRangeResult>(`${API_BASE}/commissions/date-range`, { headers, params });
  return res.data;
} 