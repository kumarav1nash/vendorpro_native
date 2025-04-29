import { Inventory } from './inventory';
import { User } from './user';
import { Shop } from './shop';

export interface Sale {
  id: string;
  salesmanId: string;
  shopId: string;
  productId: string;
  product: Inventory;
  quantity: number;
  soldAt: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  salesman: User;
  shop: Shop;
}

export interface CreateSaleDto extends Omit<Sale, 'id' | 'status'| 'product' | 'salesman' | 'shop' | 'createdAt' | 'updatedAt'> {}

export interface UpdateSaleDto extends Partial<CreateSaleDto> {} 