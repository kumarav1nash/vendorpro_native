import AsyncStorage from '@react-native-async-storage/async-storage';
import { IDataService } from './DataService';

// Base AsyncStorage service implementation
export default class AsyncStorageService<T extends { id: string }> implements IDataService<T> {
  constructor(private storageKey: string) {}

  async getAll(): Promise<T[]> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting ${this.storageKey}:`, error);
      return [];
    }
  }

  async getById(id: string): Promise<T | undefined> {
    try {
      const items = await this.getAll();
      return items.find(item => item.id === id);
    } catch (error) {
      console.error(`Error getting ${this.storageKey} by id:`, error);
      return undefined;
    }
  }

  async create(item: T): Promise<T> {
    try {
      const items = await this.getAll();
      items.push(item);
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(items));
      return item;
    } catch (error) {
      console.error(`Error creating ${this.storageKey}:`, error);
      throw error;
    }
  }

  async update(item: T): Promise<T> {
    try {
      const items = await this.getAll();
      const index = items.findIndex(i => i.id === item.id);
      if (index !== -1) {
        items[index] = item;
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(items));
      }
      return item;
    } catch (error) {
      console.error(`Error updating ${this.storageKey}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const items = await this.getAll();
      const newItems = items.filter(item => item.id !== id);
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(newItems));
      return true;
    } catch (error) {
      console.error(`Error deleting ${this.storageKey}:`, error);
      return false;
    }
  }

  async query(filter: (item: T) => boolean): Promise<T[]> {
    try {
      const items = await this.getAll();
      return items.filter(filter);
    } catch (error) {
      console.error(`Error querying ${this.storageKey}:`, error);
      return [];
    }
  }
} 