import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { User, UserRole } from '../types/user';
import {
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  getUserByEmail,
  getUserByPhone,
  getUsersByRole,
  verifyUserPhone,
  verifyUserEmail
} from '../services/user.service';
import { useAuth } from './AuthContext';

interface UserContextType {
  user: User | null;
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUser: (id: string) => Promise<void>;
  fetchAllUsers: (includeProfile?: boolean) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  fetchUserByEmail: (email: string, includeProfile?: boolean) => Promise<User | null>;
  fetchUserByPhone: (phoneNumber: string, includeProfile?: boolean) => Promise<User | null>;
  fetchUsersByRole: (role: UserRole, includeProfile?: boolean) => Promise<void>;
  verifyUserPhone: (id: string) => Promise<void>;
  verifyUserEmail: (id: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize user data from auth context
  useEffect(() => {
    if (authUser) {
      console.log("UserContext: Initializing user from AuthContext:", authUser.id);
      setUser(authUser);
    }
  }, [authUser]);

  const fetchUser = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserById(id);
      setUser(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async (includeProfile = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUsers(includeProfile);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserContext = async (id: string, data: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await updateUser(id, data);
      setUser(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const deleteUserContext = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteUser(id);
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserByEmail = async (email: string, includeProfile = false): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserByEmail(email, includeProfile);
      setUser(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user by email');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchUserByPhone = async (phoneNumber: string, includeProfile = false): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserByPhone(phoneNumber, includeProfile);
      setUser(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user by phone');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersByRole = async (role: UserRole, includeProfile = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsersByRole(role, includeProfile);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users by role');
    } finally {
      setLoading(false);
    }
  };

  const verifyUserPhoneContext = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await verifyUserPhone(id);
    } catch (err: any) {
      setError(err.message || 'Failed to verify user phone');
    } finally {
      setLoading(false);
    }
  };

  const verifyUserEmailContext = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await verifyUserEmail(id);
    } catch (err: any) {
      setError(err.message || 'Failed to verify user email');
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({
    user,
    users,
    loading,
    error,
    fetchUser,
    fetchAllUsers,
    updateUser: updateUserContext,
    deleteUser: deleteUserContext,
    fetchUserByEmail,
    fetchUserByPhone,
    fetchUsersByRole,
    verifyUserPhone: verifyUserPhoneContext,
    verifyUserEmail: verifyUserEmailContext,
  }), [user, users, loading, error]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

