import apiClient from './api-client';
import { CreateShopDto, Shop, AssignSalesmanDto, CreateSalesmanDto, AssignSalesmanResponse, CreateSalesmanResponse, GetShopSalesmenResponse } from '../types/shop';

export const shopService = {
  createShop: async (data: CreateShopDto): Promise<Shop> => {
    console.log("Creating shop with data:", data);
    const response = await apiClient.post<Shop>('shops', data);
    return response.data;
  },

  getAllShops: async (): Promise<Shop[]> => {
    console.log("Getting all shops");
    const response = await apiClient.get<Shop[]>('shops');
    return response.data;
  },

  getMyShops: async (): Promise<Shop[]> => {
    console.log("Calling getMyShops API");
    try {
      const response = await apiClient.get<Shop[]>('shops/my-shops');
      console.log("getMyShops response status:", response.status);
      return response.data;
    } catch (error) {
      console.error("getMyShops error:", error);
      throw error;
    }
  },

  getShopById: async (shopId: string): Promise<Shop> => {
    const response = await apiClient.get<Shop>(`shops/${shopId}`);
    return response.data;
  },

  getShopBySalesmanId: async (salesmanId: string): Promise<Shop> => {
    const response = await apiClient.get<Shop>(`shops/assigned-to-salesman/${salesmanId}`);
    return response.data;
  },

  updateShop: async (shopId: string, data: Partial<CreateShopDto>): Promise<Shop> => {
    const response = await apiClient.patch<Shop>(`shops/${shopId}`, data);
    return response.data;
  },

  assignSalesman: async (shopId: string, data: AssignSalesmanDto): Promise<AssignSalesmanResponse> => {
    const response = await apiClient.post<AssignSalesmanResponse>(`shops/${shopId}/assign-salesman`, data);
    return response.data;
  },

  createSalesman: async (shopId: string, data: CreateSalesmanDto): Promise<CreateSalesmanResponse> => {
    const response = await apiClient.post<CreateSalesmanResponse>(`shops/${shopId}/create-salesman`, data);
    return response.data;
  },

  getShopSalesmen: async (shopId: string): Promise<GetShopSalesmenResponse> => {
    const response = await apiClient.get<GetShopSalesmenResponse>(`shops/${shopId}/salesmen`);
    return response.data;
  },

  removeSalesman: async (shopId: string, salesmanId: string): Promise<any> => {
    const response = await apiClient.delete(`shops/${shopId}/remove-salesman/${salesmanId}`);
    return response.data;
  },

  deleteShop: async (shopId: string): Promise<any> => {
    const response = await apiClient.delete(`shops/${shopId}`);
    return response.data;
  }
}; 