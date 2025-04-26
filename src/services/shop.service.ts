import axios from 'axios';
import { CreateShopDto, Shop, AssignSalesmanDto, CreateSalesmanDto, AssignSalesmanResponse, CreateSalesmanResponse, GetShopSalesmenResponse } from '../types/shop';

const API_BASE_URL = 'http://localhost:3000';

export const shopService = {
  createShop: async (data: CreateShopDto): Promise<Shop> => {
    const response = await axios.post<Shop>(`${API_BASE_URL}/shops`, data);
    return response.data;
  },

  getAllShops: async (): Promise<Shop[]> => {
    const response = await axios.get<Shop[]>(`${API_BASE_URL}/shops`);
    return response.data;
  },

  getMyShops: async (): Promise<Shop[]> => {
    const response = await axios.get<Shop[]>(`${API_BASE_URL}/shops/my-shops`);
    return response.data;
  },

  getShopById: async (shopId: string): Promise<Shop> => {
    const response = await axios.get<Shop>(`${API_BASE_URL}/shops/${shopId}`);
    return response.data;
  },

  updateShop: async (shopId: string, data: Partial<CreateShopDto>): Promise<Shop> => {
    const response = await axios.patch<Shop>(`${API_BASE_URL}/shops/${shopId}`, data);
    return response.data;
  },

  assignSalesman: async (shopId: string, data: AssignSalesmanDto): Promise<AssignSalesmanResponse> => {
    const response = await axios.post<AssignSalesmanResponse>(`${API_BASE_URL}/shops/${shopId}/assign-salesman`, data);
    return response.data;
  },

  createSalesman: async (shopId: string, data: CreateSalesmanDto): Promise<CreateSalesmanResponse> => {
    const response = await axios.post<CreateSalesmanResponse>(`${API_BASE_URL}/shops/${shopId}/create-salesman`, data);
    return response.data;
  },

  getShopSalesmen: async (shopId: string): Promise<GetShopSalesmenResponse> => {
    const response = await axios.get<GetShopSalesmenResponse>(`${API_BASE_URL}/shops/${shopId}/salesmen`);
    return response.data;
  },

  removeSalesman: async (shopId: string, salesmanId: string): Promise<any> => {
    const response = await axios.delete(`${API_BASE_URL}/shops/${shopId}/remove-salesman/${salesmanId}`);
    return response.data;
  },
}; 