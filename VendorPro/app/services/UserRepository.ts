import AsyncStorageService from './AsyncStorageService';

export type User = {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  shopName?: string;
  gstin?: string;
  language?: string;
  notificationsEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
};

class UserRepository extends AsyncStorageService<User> {
  constructor() {
    super('user');
  }

  async getCurrentUserId(): Promise<string> {
    try {
      const users = await this.getAll();
      return users.length > 0 ? users[0].id : 'owner-1';
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return 'owner-1';
    }
  }

  async getCurrentUserName(): Promise<string> {
    try {
      const users = await this.getAll();
      return users.length > 0 ? users[0].name : 'Shop Owner';
    } catch (error) {
      console.error('Error getting current user name:', error);
      return 'Shop Owner';
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const users = await this.getAll();
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}

export default UserRepository; 