export interface Sale {
  id: string;
  shopId: string;
  productId: string;
  salesmanId: string;
  quantity: number;
  salePrice: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleDto extends Omit<Sale, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

export interface UpdateSaleDto extends Partial<CreateSaleDto> {} 