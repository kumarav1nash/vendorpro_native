export interface RequestOtpDto {
  phoneNumber: string;
}

export interface VerifyOtpDto {
  phoneNumber: string;
  otp: string;
}

export interface LoginDto {
  phoneNumber: string;
  password: string;
}

export interface User {
  id: string;
  phoneNumber: string;
  role: 'SHOP_OWNER' | 'SALESMAN';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface OtpResponse {
  message: string;
  phoneNumber: string;
} 