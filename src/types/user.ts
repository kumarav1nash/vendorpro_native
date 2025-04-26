export interface User {
  id: string;
  email: string | null;
  password: string | null;
  phoneNumber: string;
  role: UserRole;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
} 

export type UserRole = 'SHOP_OWNER' | 'SALESMAN';

export interface UserProfilePreferences {
  theme: string;
  notifications: boolean;
  language: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  profilePicture: string;
  bio: string;
  preferences: UserProfilePreferences;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserProfileDto extends Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {}

export interface UpdateUserProfileDto extends Partial<CreateUserProfileDto> {}