// Define interfaces for data operations and models
export interface IDataService<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  create(item: T): Promise<T>;
  update(item: T): Promise<T>;
  delete(id: string): Promise<boolean>;
  query(filter: (item: T) => boolean): Promise<T[]>;
}

// Repository interface for specific entity operations
export interface ISalesRepository extends IDataService<any> {
  getShopSales(shopId: string): Promise<any[]>;
  getSalesmanSales(salesmanId: string): Promise<any[]>;
  getPendingSales(shopId?: string): Promise<any[]>;
  getCompletedSales(shopId?: string): Promise<any[]>;
  getRejectedSales(shopId?: string): Promise<any[]>;
}

export interface IProductsRepository extends IDataService<any> {
  getShopProducts(shopId: string): Promise<any[]>;
}

export interface IShopsRepository extends IDataService<any> {}

export interface ISalesmenRepository extends IDataService<any> {
  getShopSalesmen(shopId: string): Promise<any[]>;
}

export interface IUserRepository extends IDataService<any> {
  getCurrentUserId(): Promise<string>;
  getCurrentUserName(): Promise<string>;
  getCurrentUser(): Promise<any | null>;
} 