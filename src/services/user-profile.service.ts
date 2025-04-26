import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { UserProfile, CreateUserProfileDto, UpdateUserProfileDto } from '../types/user';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createUserProfile(data: CreateUserProfileDto): Promise<UserProfile> {
  const headers = await getAuthHeaders();
  const res = await axios.post<UserProfile>(`${API_BASE}/user-profiles`, data, { headers });
  return res.data;
}

export async function getAllUserProfiles(): Promise<UserProfile[]> {
  const headers = await getAuthHeaders();
  const res = await axios.get<UserProfile[]>(`${API_BASE}/user-profiles`, { headers });
  return res.data;
}

export async function getUserProfileById(id: string): Promise<UserProfile> {
  const headers = await getAuthHeaders();
  const res = await axios.get<UserProfile>(`${API_BASE}/user-profiles/${id}`, { headers });
  return res.data;
}

export async function updateUserProfile(id: string, data: UpdateUserProfileDto): Promise<UserProfile> {
  const headers = await getAuthHeaders();
  const res = await axios.patch<UserProfile>(`${API_BASE}/user-profiles/${id}`, data, { headers });
  return res.data;
}

export async function deleteUserProfile(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  await axios.delete(`${API_BASE}/user-profiles/${id}`, { headers });
}

export async function getMyUserProfile(): Promise<UserProfile> {
  const headers = await getAuthHeaders();
  const res = await axios.get<UserProfile>(`${API_BASE}/user-profiles/my-profile`, { headers });
  return res.data;
}

export async function getUserProfileByUserId(userId: string): Promise<UserProfile> {
  const headers = await getAuthHeaders();
  const res = await axios.get<UserProfile>(`${API_BASE}/user-profiles/user/${userId}`, { headers });
  return res.data;
} 