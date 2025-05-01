import { Inventory } from './inventory';
import { User } from './user';
import { Shop } from './shop';

export interface SaleItem {
  id: string;
  product: Inventory;
  quantity: number;
  soldAt: number;
}

export interface Sale {
  id: string;
  salesman: User;
  shop: Shop;
  items: SaleItem[];
  totalAmount: number
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface SaleWithCommission extends Sale {
  commissionAmount: number;
}

export interface CreateSaleItemDto {
  productId: string;
  quantity: number;
  soldAt: number;
}

export interface CreateSaleDto {
  shopId: string;
  items: CreateSaleItemDto[];
  totalAmount: number
}

export interface UpdateSaleDto extends Partial<CreateSaleDto> {} 