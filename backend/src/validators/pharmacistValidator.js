import Joi from 'joi';

const passwordPattern =
  /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,50}$/;

export const createPharmacistSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).required(),
  email: Joi.string().trim().lowercase().email().required(),
  phone: Joi.string()
    .trim()
    .pattern(/^\+?\d{10,15}$/, 'valid phone number')
    .required(),
  password: Joi.string()
    .pattern(passwordPattern)
    .messages({
      'string.pattern.base':
        'Password must be 8-50 characters with 1 uppercase, 1 number and 1 special character',
    })
    .required(),
});

export const updatePharmacistSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60),
  phone: Joi.string().trim().pattern(/^\+?\d{10,15}$/, 'valid phone number'),
  password: Joi.string()
    .pattern(passwordPattern)
    .messages({
      'string.pattern.base':
        'Password must be 8-50 characters with 1 uppercase, 1 number and 1 special character',
    }),
}).min(1);