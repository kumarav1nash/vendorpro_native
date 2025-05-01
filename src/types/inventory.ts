import { Shop } from "./shop";

export interface Inventory {
  id: string;
  productName: string;
  basePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  productImageUrl?: string;
  productImageFilename?: string;
  shop: Shop | string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryDto {
  productName: string;
  basePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  productImageUrl?: string;
  productImageFilename?: string;
}

export interface UpdateInventoryDto {
  productName?: string;
  basePrice?: number;
  sellingPrice?: number;
  stockQuantity?: number;
  productImageUrl?: string;
  productImageFilename?: string;
} 