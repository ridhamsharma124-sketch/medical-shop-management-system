// -----------------------------------------------------------------------------
// Auth Service —
// Registration, OTP verification and login of users
// -----------------------------------------------------------------------------

import api from './api';
import { authRoutes } from './authRoutes';

// REGISTER A NEW USER
// POST /auth/register
export const register = async (payload) => {
  const response = await api.post(authRoutes.REGISTER, payload);
  return response;
};

// VERIFY EMAIL OTP
// POST /auth/verify-otp
export const verifyOtp = async (payload) => {
  const response = await api.post(authRoutes.VERIFY_OTP, payload);
  return response;
};

// RESEND EMAIL OTP
// POST /auth/resend-otp
export const resendOtp = async (payload) => {
  const response = await api.post(authRoutes.RESEND_OTP, payload);
  return response;
};

// LOGIN USER
// POST /auth/login
export const login = async (payload) => {
  const response = await api.post(authRoutes.LOGIN, payload);
  return response;
};

// LOGOUT USER
// POST /auth/logout
export const logout = async () => {
  const response = await api.post(authRoutes.LOGOUT);
  return response;
};