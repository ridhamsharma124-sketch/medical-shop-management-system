import Joi from 'joi';

const phonePattern = /^\+?[0-9]{10,15}$/;
const strongPassword = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$/;

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(3).max(50).required(),
  email: Joi.string().trim().email().required(),
  phone: Joi.string().pattern(phonePattern).required(),
  password: Joi.string().min(8).max(128).pattern(strongPassword).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().email(),
  phone: Joi.string().pattern(phonePattern),
  password: Joi.string().required(),
}).or('email', 'phone');

export const verifyOtpSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  otp: Joi.string().pattern(/^\d{6}$/).required(),
});

export const resendOtpSchema = Joi.object({
  email: Joi.string().trim().email().required(),
});