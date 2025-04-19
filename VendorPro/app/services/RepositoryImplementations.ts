import { ISalesRepository, IProductsRepository, IShopsRepository, ISalesmenRepository, IUserRepository } from './DataService';
import AsyncStorageService from './AsyncStorageService';
import { Sale } from '../contexts/SalesContext';
import { Product } from '../contexts/ProductContext';
import { Shop } from '../contexts/ShopContext';
import { Salesman } from '../contexts/SalesmenContext';
import UserRepository, { User } from './UserRepository';

// Sales Repository Implementation
export class SalesRepository extends AsyncStorageService<Sale> implements ISalesRepository {
  constructor() {
    super('sales');
  }

  async getShopSales(shopId: string): Promise<Sale[]> {
    return this.query(sale => sale.shopId === shopId);
  }

  async getSalesmanSales(salesmanId: string): Promise<Sale[]> {
    return this.query(sale => sale.salesmanId === salesmanId);
  }

  async getPendingSales(shopId?: string): Promise<Sale[]> {
    if (shopId) {
      return this.query(sale => sale.shopId === shopId && sale.status === 'pending');
    }
    return this.query(sale => sale.status === 'pending');
  }

  async getCompletedSales(shopId?: string): Promise<Sale[]> {
    if (shopId) {
      return this.query(sale => sale.shopId === shopId && sale.status === 'completed');
    }
    return this.query(sale => sale.status === 'completed');
  }

  async getRejectedSales(shopId?: string): Promise<Sale[]> {
    if (shopId) {
      return this.query(sale => sale.shopId === shopId && sale.status === 'rejected');
    }
    return this.query(sale => sale.status === 'rejected');
  }
}

// Products Repository Implementation
export class ProductsRepository extends AsyncStorageService<Product> implements IProductsRepository {
  constructor() {
    super('products');
  }

  async getShopProducts(shopId: string): Promise<Product[]> {
    return this.query(product => product.shopId === shopId);
  }
}

// Shops Repository Implementation
export class ShopsRepository extends AsyncStorageService<Shop> implements IShopsRepository {
  constructor() {
    super('shops');
  }
}

// Salesmen Repository Implementation
export class SalesmenRepository extends AsyncStorageService<Salesman> implements ISalesmenRepository {
  constructor() {
    super('salesmen');
  }

  async getShopSalesmen(shopId: string): Promise<Salesman[]> {
    return this.query(salesman => salesman.shopId === shopId);
  }
}

// User Repository Implementation
export { UserRepository }; 