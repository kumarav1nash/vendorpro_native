export interface Inventory {
  id: string;
  productName: string;
  basePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  productImageUrl: string;
  shopId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryDto extends Omit<Inventory, 'id' | 'createdAt' | 'updatedAt'> {}

export interface UpdateInventoryDto extends Partial<CreateInventoryDto> {} 