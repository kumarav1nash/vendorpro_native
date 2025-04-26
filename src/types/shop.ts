import { User } from "./user";

export interface CreateShopDto {
  shopName: string;
  ownerName: string;
  email: string;
  gstinNumber: string;
}



export interface Shop {
  id: string;
  shopName: string;
  ownerName: string;
  email: string;
  gstinNumber: string;
  owner: User;
  createdAt: string;
  updatedAt: string;
}

export interface AssignSalesmanDto {
  salesmanId: string;
}

export interface CreateSalesmanDto {
  phoneNumber: string;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}


export interface AssignSalesmanResponse {
  shop: Shop;
  salesman: User;
}

export type CreateSalesmanResponse = User;

export type GetShopSalesmenResponse = User[]; 