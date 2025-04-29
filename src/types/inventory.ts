export interface Inventory {
  id: string;
  productName: string;
  basePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  productImageUrl?: string;
  shopId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryDto {
  productName: string;
  basePrice:  number;
  sellingPrice: number;
  stockQuantity: number;
  productImageUrl?: string;
}

export interface UpdateInventoryDto {
  productName?: string;
  basePrice?: number;
  sellingPrice?: number;
  stockQuantity?: number;
  productImageUrl?: string;
} 