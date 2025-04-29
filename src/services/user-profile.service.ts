import apiClient from './api-client';
import { UserProfile, CreateUserProfileDto, UpdateUserProfileDto } from '../types/user';

export async function createUserProfile(data: CreateUserProfileDto): Promise<UserProfile> {
  const res = await apiClient.post<UserProfile>('user-profiles', data);
  return res.data;
}

export async function getAllUserProfiles(): Promise<UserProfile[]> {
  const res = await apiClient.get<UserProfile[]>('user-profiles');
  return res.data;
}

export async function getUserProfileById(id: string): Promise<UserProfile> {
  const res = await apiClient.get<UserProfile>(`user-profiles/${id}`);
  return res.data;
}

export async function updateUserProfile(id: string, data: UpdateUserProfileDto): Promise<UserProfile> {
  const res = await apiClient.patch<UserProfile>(`user-profiles/${id}`, data);
  return res.data;
}

export async function deleteUserProfile(id: string): Promise<void> {
  await apiClient.delete(`user-profiles/${id}`);
}

export async function getMyUserProfile(): Promise<UserProfile> {
  console.log("Calling getMyUserProfile API");
  try {
    const res = await apiClient.get<UserProfile>('user-profiles/my-profile');
    console.log("getMyUserProfile response:", res.status);
    return res.data;
  } catch (error) {
    console.error("getMyUserProfile error:", error);
    throw error;
  }
}

export async function getUserProfileByUserId(userId: string): Promise<UserProfile> {
  console.log("Calling getUserProfileByUserId API for userId:", userId);
  try {
    const res = await apiClient.get<UserProfile>(`user-profiles/user/${userId}`);
    console.log("getUserProfileByUserId response:", res.status);
    return res.data;
  } catch (error) {
    console.error("getUserProfileByUserId error:", error);
    throw error;
  }
} 