import { IDataService } from './DataService';

// This is a placeholder for REST API implementation
// When integrating with an API, you would replace the implementation
// with actual API calls, but the interface stays the same

export default class ApiService<T extends { id: string }> implements IDataService<T> {
  constructor(private baseUrl: string, private endpoint: string) {}

  // Helper method for handling API responses
  private async handleResponse<R>(response: Response): Promise<R> {
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return await response.json() as R;
  }

  // Placeholder methods to be implemented with actual API integration
  async getAll(): Promise<T[]> {
    // Example of future implementation:
    // const response = await fetch(`${this.baseUrl}/${this.endpoint}`);
    // return this.handleResponse<T[]>(response);
    console.log(`ApiService.getAll() for ${this.endpoint}`);
    throw new Error('API integration not implemented yet');
  }

  async getById(id: string): Promise<T | undefined> {
    // Example of future implementation:
    // const response = await fetch(`${this.baseUrl}/${this.endpoint}/${id}`);
    // if (response.status === 404) return undefined;
    // return this.handleResponse<T>(response);
    console.log(`ApiService.getById() for ${this.endpoint}`);
    throw new Error('API integration not implemented yet');
  }

  async create(item: T): Promise<T> {
    // Example of future implementation:
    // const response = await fetch(`${this.baseUrl}/${this.endpoint}`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(item)
    // });
    // return this.handleResponse<T>(response);
    console.log(`ApiService.create() for ${this.endpoint}`);
    throw new Error('API integration not implemented yet');
  }

  async update(item: T): Promise<T> {
    // Example of future implementation:
    // const response = await fetch(`${this.baseUrl}/${this.endpoint}/${item.id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(item)
    // });
    // return this.handleResponse<T>(response);
    console.log(`ApiService.update() for ${this.endpoint}`);
    throw new Error('API integration not implemented yet');
  }

  async delete(id: string): Promise<boolean> {
    // Example of future implementation:
    // const response = await fetch(`${this.baseUrl}/${this.endpoint}/${id}`, {
    //   method: 'DELETE'
    // });
    // return response.ok;
    console.log(`ApiService.delete() for ${this.endpoint}`);
    throw new Error('API integration not implemented yet');
  }

  async query(filter: (item: T) => boolean): Promise<T[]> {
    // Note: In a real API implementation, you'd use query parameters
    // instead of fetching everything and filtering in memory
    console.log(`ApiService.query() for ${this.endpoint}`);
    throw new Error('API integration not implemented yet');
  }
} 