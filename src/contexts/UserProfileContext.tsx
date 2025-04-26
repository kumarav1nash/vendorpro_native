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

interface UserProfileContextType {
  profile: UserProfile | null;
  profiles: UserProfile[];
  loading: boolean;
  error: string | null;
  fetchMyProfile: () => Promise<void>;
  fetchProfileById: (id: string) => Promise<void>;
  fetchProfileByUserId: (userId: string) => Promise<void>;
  fetchAllProfiles: () => Promise<void>;
  createProfile: (data: CreateUserProfileDto) => Promise<void>;
  updateProfile: (id: string, data: UpdateUserProfileDto) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
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
  const [error, setError] = useState<string | null>(null);

  const fetchMyProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyUserProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch my profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileById = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserProfileById(id);
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile by id');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileByUserId = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserProfileByUserId(userId);
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile by user id');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUserProfiles();
      setProfiles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch all profiles');
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (data: CreateUserProfileDto) => {
    setLoading(true);
    setError(null);
    try {
      const created = await createUserProfile(data);
      setProfile(created);
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (id: string, data: UpdateUserProfileDto) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await updateUserProfile(id, data);
      setProfile(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const deleteProfile = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteUserProfile(id);
      setProfile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete profile');
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
  }), [profile, profiles, loading, error]);

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}; 