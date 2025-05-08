import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import {
  UserProfile,
  CreateUserProfileDto,
  UpdateUserProfileDto
} from '../types/user';
import {
  createUserProfile,
  getAllUserProfiles,
  getUserProfileById,
  updateUserProfile,
  deleteUserProfile,
  getMyUserProfile,
  getUserProfileByUserId
} from '../services/user-profile.service';
import useErrorHandler from '../hooks/useErrorHandler';

interface UserProfileContextType {
  profile: UserProfile | null;
  profiles: UserProfile[];
  loading: boolean;
  error: {
    message: string;
    status?: number;
    isError: boolean;
  } | null;
  fetchMyProfile: () => Promise<void>;
  fetchProfileById: (id: string) => Promise<void>;
  fetchProfileByUserId: (userId: string) => Promise<UserProfile | null>;
  fetchAllProfiles: () => Promise<void>;
  createProfile: (data: CreateUserProfileDto) => Promise<void>;
  updateProfile: (id: string, data: UpdateUserProfileDto) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  clearError: () => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();

  const fetchMyProfile = async () => {
    setLoading(true);
    clearError();
    try {
      const data = await getMyUserProfile();
      setProfile(data);
    } catch (err) {
      handleError(err, 'Failed to fetch your profile');
      // Still keep previous profile data if it exists
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileById = async (id: string) => {
    setLoading(true);
    clearError();
    try {
      const data = await getUserProfileById(id);
      setProfile(data);
    } catch (err) {
      handleError(err, 'Failed to fetch profile');
      // Keep previous profile data if this fails
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileByUserId = async (userId: string): Promise<UserProfile | null> => {
    setLoading(true);
    clearError();
    try {
      const data = await getUserProfileByUserId(userId);
      return data;
    } catch (err) {
      // For 404 errors, don't disrupt the UI
      handleError(err, 'Profile not found');
      
      // Return null for 404 errors so the UI can handle gracefully
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProfiles = async () => {
    setLoading(true);
    clearError();
    try {
      const data = await getAllUserProfiles();
      setProfiles(data);
    } catch (err) {
      handleError(err, 'Failed to fetch profiles');
      // Keep previous profiles data if this fails
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (data: CreateUserProfileDto) => {
    setLoading(true);
    clearError();
    try {
      const created = await createUserProfile(data);
      setProfile(created);
    } catch (err) {
      handleError(err, 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (id: string, data: UpdateUserProfileDto) => {
    setLoading(true);
    clearError();
    try {
      const updated = await updateUserProfile(id, data);
      setProfile(updated);
    } catch (err) {
      handleError(err, 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const deleteProfile = async (id: string) => {
    setLoading(true);
    clearError();
    try {
      await deleteUserProfile(id);
      setProfile(null);
    } catch (err) {
      handleError(err, 'Failed to delete profile');
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({
    profile,
    profiles,
    loading,
    error,
    fetchMyProfile,
    fetchProfileById,
    fetchProfileByUserId,
    fetchAllProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    clearError
  }), [profile, profiles, loading, error, clearError]);

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}; 