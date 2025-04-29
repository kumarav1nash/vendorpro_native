import apiClient from './api-client';
import {
  Commission,
  CommissionRule,
  CreateCommissionDto,
  CreateCommissionRuleDto,
  AssignCommissionRuleDto,
  CommissionDateRangeResult,
  SalesCommissionResponse
} from '../types/commission';

export async function createCommission(data: CreateCommissionDto): Promise<Commission> {
  const res = await apiClient.post<Commission>('commissions/create', data);
  return res.data;
}

export async function getAllCommissions(): Promise<Commission[]> {
  const res = await apiClient.get<Commission[]>('commissions');
  return res.data;
}

export async function getCommissionById(id: string): Promise<Commission> {
  const res = await apiClient.get<Commission>(`commissions/${id}`);
  return res.data;
}

export async function createCommissionRule(data: CreateCommissionRuleDto): Promise<CommissionRule> {
  const res = await apiClient.post<CommissionRule>('commissions/rules', data);
  return res.data;
}

export async function getAllCommissionRules(): Promise<CommissionRule[]> {
  const res = await apiClient.get<CommissionRule[]>('commissions/rules');
  return res.data;
}

export async function assignCommissionRule(data: AssignCommissionRuleDto): Promise<any> {
  const res = await apiClient.post('commissions/rules/assign', data);
  return res.data;
}

export async function getCommissionsBySalesman(salesmanId: string): Promise<SalesCommissionResponse> {
  try {
    console.log(`Fetching commissions for salesman ID: ${salesmanId}`);
    const res = await apiClient.get<SalesCommissionResponse>(`commissions/salesman/${salesmanId}`);
    console.log(`Commission data fetched: ${res.data.sales?.length || 0} sales with commission rules`);
    return res.data;
  } catch (error) {
    console.error(`Error fetching commissions for salesman ${salesmanId}:`, error);
    throw error;
  }
}

export async function getCommissionsByShop(shopId: string): Promise<Commission[]> {
  try {
    console.log(`Fetching commissions for shop ID: ${shopId}`);
    const res = await apiClient.get<Commission[]>(`commissions/shop/${shopId}`);
    console.log(`Commissions fetch successful, count: ${res.data.length}`);
    return res.data;
  } catch (error) {
    console.error(`Error fetching commissions for shop ${shopId}:`, error);
    throw error;
  }
}

export async function markCommissionAsPaid(commissionId: string): Promise<Commission> {
  const res = await apiClient.post<Commission>(`commissions/${commissionId}/mark-paid`, {});
  return res.data;
}

export async function getCommissionsByDateRange(params: { startDate: string; endDate: string; salesmanId?: string; shopId?: string }): Promise<CommissionDateRangeResult> {
  try {
    console.log('Fetching commissions by date range with params:', params);
    const res = await apiClient.get<CommissionDateRangeResult>('commissions/date-range', { params });
    console.log('Commissions by date range fetch successful');
    return res.data;
  } catch (error) {
    console.error('Error fetching commissions by date range:', error);
    throw error;
  }
} 