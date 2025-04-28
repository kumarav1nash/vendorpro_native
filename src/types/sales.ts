import { Product } from './inventory';

export interface Sale {
  id: string;
  salesmanId: string;
  shopId: string;
  productId: string;
  product?: {
    id: string;
    productName: string;
    basePrice: string;
    sellingPrice: string;
    stockQuantity: number;
    productImageUrl?: string;
    createdAt: string;
    updatedAt: string;
  };
  quantity: number;
  salePrice: string | number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  salesman?: {
    id: string;
    email: string;
    [key: string]: any;
  };
  shop?: {
    id: string;
    shopName: string;
    [key: string]: any;
  };
}

export interface CreateSaleDto extends Omit<Sale, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

export interface UpdateSaleDto extends Partial<CreateSaleDto> {} 