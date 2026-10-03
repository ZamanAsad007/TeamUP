import { api } from './client';

export const login = async (email: string, password: string) => {
  return api.post('/auth/login', { email, password });
};

export const register = async (data: any) => {
  return api.post('/auth/register', data);
};

export const refresh = async (refreshToken: string) => {
  return api.post('/auth/refresh', { refreshToken });
};

export const verifyOtp = async (email: string, code: string) => {
  return api.post('/auth/verify-otp', { email, code });
};

export const resendOtp = async (email: string) => {
  return api.post('/auth/resend-otp', { email });
};
