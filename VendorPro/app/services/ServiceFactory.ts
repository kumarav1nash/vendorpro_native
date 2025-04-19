import { ISalesRepository, IProductsRepository, IShopsRepository, ISalesmenRepository, IUserRepository } from './DataService';
import { SalesRepository, ProductsRepository, ShopsRepository, SalesmenRepository, UserRepository } from './RepositoryImplementations';

// Factory for creating repository instances
export default class ServiceFactory {
  private static salesRepository: ISalesRepository;
  private static productsRepository: IProductsRepository;
  private static shopsRepository: IShopsRepository;
  private static salesmenRepository: ISalesmenRepository;
  private static userRepository: IUserRepository;

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
  
  static getUserRepository(): IUserRepository {
    if (!this.userRepository) {
      this.userRepository = new UserRepository();
    }
    return this.userRepository;
  }
} 