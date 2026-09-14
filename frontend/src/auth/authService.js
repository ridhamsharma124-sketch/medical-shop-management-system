import api from './api';
import { authRoutes } from './authRoutes';

export const register = (payload) => api.post(authRoutes.REGISTER, payload);

export const verifyOtp = (payload) => api.post(authRoutes.VERIFY_OTP, payload);

export const resendOtp = (payload) => api.post(authRoutes.RESEND_OTP, payload);

export const login = (payload) => api.post(authRoutes.LOGIN, payload);

export const logout = () => api.post(authRoutes.LOGOUT);