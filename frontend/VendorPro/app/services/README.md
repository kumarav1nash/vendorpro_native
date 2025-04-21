# VendorPro Services Layer

This services layer provides an abstraction between data sources and the application logic. It follows the repository pattern to make it easier to switch between different data sources, such as AsyncStorage, Firebase, or REST APIs.

## Architecture

The services layer follows these key principles:

1. **Interface Segregation**: All data access goes through well-defined interfaces
2. **Repository Pattern**: Each data entity has its own repository
3. **Dependency Inversion**: Application code depends on abstractions, not concrete implementations
4. **Single Responsibility**: Each service has a clear and focused purpose

## Directory Structure

- `DataService.ts` - Interface definitions for all data operations
- `AsyncStorageService.ts` - Implementation of data services using AsyncStorage
- `FirebaseService.ts` - Placeholder for Firebase implementation
- `ApiService.ts` - Placeholder for REST API implementation
- `RepositoryImplementations.ts` - Concrete implementations of repositories
- `ServiceFactory.ts` - Factory for getting the correct implementation
- `index.ts` - Exports all services for easier imports

## Using the Services

To access data in your components:

1. **Context Approach** (Recommended)
   - Use the React Context Providers which have been updated to use these services
   - Example: `const { sales, addSale } = useSales();`

2. **Direct Service Usage** (More control)
   - Import the ServiceFactory
   - Get the repository instance
   - Call methods on the repository
   - Example:
     ```typescript
     import { ServiceFactory } from '../services';
     
     // In your component
     const salesRepo = ServiceFactory.getSalesRepository();
     const sales = await salesRepo.getAll();
     ```

## Migrating to Other Data Sources

To switch from AsyncStorage to Firebase or a REST API:

1. Implement the corresponding repository classes using the new data source
2. Update the ServiceFactory to return instances of the new implementation
3. No changes needed in the application code that uses these services

## Example: Switching to Firebase

```typescript
// In ServiceFactory.ts
static getSalesRepository(): ISalesRepository {
  if (!this.salesRepository) {
    // Switch from AsyncStorage to Firebase
    // this.salesRepository = new SalesRepository();
    this.salesRepository = new FirebaseSalesRepository();
  }
  return this.salesRepository;
}
```

This architecture provides a flexible foundation for future development and makes it easier to maintain and update the application as requirements change. 