import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { User, UserRole } from '../types/user';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}


export async function getAllUsers(includeProfile = false): Promise<User[]> {
  const headers = await getAuthHeaders();
  const res = await axios.get<User[]>(`${API_BASE}/users?includeProfile=${includeProfile}`, { headers });
  return res.data;
}

export async function getUserById(id: string): Promise<User> {
  const headers = await getAuthHeaders();
  const res = await axios.get<User>(`${API_BASE}/users/${id}?includeProfile=false`, { headers });
  return res.data;
}


export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const headers = await getAuthHeaders();
  const res = await axios.patch<User>(`${API_BASE}/users/${id}`, data, { headers });
  return res.data;
}

export async function deleteUser(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  await axios.delete(`${API_BASE}/users/${id}`, { headers });
}

export async function getUserByEmail(email: string, includeProfile = false): Promise<User> {
  const headers = await getAuthHeaders();
  const res = await axios.get<User>(`${API_BASE}/users/email/${encodeURIComponent(email)}?includeProfile=${includeProfile}`, { headers });
  return res.data;
}

export async function getUserByPhone(phoneNumber: string, includeProfile = false): Promise<User> {
  const headers = await getAuthHeaders();
  const res = await axios.get<User>(`${API_BASE}/users/phone/${encodeURIComponent(phoneNumber)}?includeProfile=${includeProfile}`, { headers });
  return res.data;
}

export async function getUsersByRole(role: UserRole, includeProfile = false): Promise<User[]> {
  const headers = await getAuthHeaders();
  const res = await axios.get<User[]>(`${API_BASE}/users/role/${role}?includeProfile=${includeProfile}`, { headers });
  return res.data;
}

export async function verifyUserPhone(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  await axios.post(`${API_BASE}/users/${id}/verify-phone`, {}, { headers });
}

export async function verifyUserEmail(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  await axios.post(`${API_BASE}/users/${id}/verify-email`, {}, { headers });
} 

