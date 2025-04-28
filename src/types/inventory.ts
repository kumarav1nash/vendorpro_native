export interface Inventory {
  id: string;
  productName: string;
  basePrice: string | number;
  sellingPrice: string | number;
  stockQuantity: number;
  productImageUrl?: string;
  shopId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryDto {
  productName: string;
  basePrice: string | number;
  sellingPrice: string | number;
  stockQuantity: number;
  productImageUrl?: string;
}

export interface UpdateInventoryDto {
  productName?: string;
  basePrice?: string | number;
  sellingPrice?: string | number;
  stockQuantity?: number;
  productImageUrl?: string;
} 