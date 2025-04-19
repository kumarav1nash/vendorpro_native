import React, { createContext, useContext, useState, useEffect } from 'react';
import ServiceFactory from '../services/ServiceFactory';
import { User } from '../services/UserRepository';

type UserContextType = {
  currentUser: User | null;
  isLoading: boolean;
  updateUser: (userData: Partial<User>) => Promise<void>;
  loadUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Get repository instance
  const userRepository = ServiceFactory.getUserRepository();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      const user = await userRepository.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!currentUser) {
        throw new Error('No current user to update');
      }
      
      const updatedUser: User = {
        ...currentUser,
        ...userData,
        updatedAt: new Date().toISOString()
      };
      
      await userRepository.update(updatedUser);
      await loadUser(); // Reload user after updating
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    isLoading,
    updateUser,
    loadUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Add default export for the component to fix the routing error
export default function UserContextScreen() {
  return null;
} 