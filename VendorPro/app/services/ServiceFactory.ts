import { ISalesRepository, IProductsRepository, IShopsRepository, ISalesmenRepository } from './DataService';
import { SalesRepository, ProductsRepository, ShopsRepository, SalesmenRepository } from './RepositoryImplementations';

// Factory for creating repository instances
export class ServiceFactory {
  private static salesRepository: ISalesRepository;
  private static productsRepository: IProductsRepository;
  private static shopsRepository: IShopsRepository;
  private static salesmenRepository: ISalesmenRepository;

  static getSalesRepository(): ISalesRepository {
    if (!this.salesRepository) {
      this.salesRepository = new SalesRepository();
    }
    return this.salesRepository;
  }

  static getProductsRepository(): IProductsRepository {
    if (!this.productsRepository) {
      this.productsRepository = new ProductsRepository();
    }
    return this.productsRepository;
  }

  static getShopsRepository(): IShopsRepository {
    if (!this.shopsRepository) {
      this.shopsRepository = new ShopsRepository();
    }
    return this.shopsRepository;
  }

  static getSalesmenRepository(): ISalesmenRepository {
    if (!this.salesmenRepository) {
      this.salesmenRepository = new SalesmenRepository();
    }
    return this.salesmenRepository;
  }
} 