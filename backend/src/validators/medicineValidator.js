import Joi from 'joi';

const categories = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops'];
const units = ['strip', 'tablet', 'bottle', 'box', 'vial', 'sachet'];

const baseFields = {
  name: Joi.string().trim().min(1).max(200),
  genericName: Joi.string().trim().allow('').max(200),
  category: Joi.string()
    .valid(...categories)
    .required(),
  company: Joi.string().trim().allow('').max(150),
  batch: Joi.string().trim().allow('').max(100),
  unit: Joi.string()
    .valid(...units)
    .default('strip'),
  manufacturingDate: Joi.date().max('now'),
  expiry: Joi.date().min('now'),
  price: Joi.number().min(0).required(),
  cost: Joi.number().min(0).default(0),
  gst: Joi.number().min(0).max(100).default(0),
  stock: Joi.number().min(0).default(0),
  lowStockThreshold: Joi.number().min(0).default(10),
  description: Joi.string().trim().allow('').max(2000),
  image: Joi.string().trim().allow('').max(500),
  pharmacist: Joi.string().allow('', null).max(40),
};

export const createMedicineSchema = Joi.object({
  ...baseFields,
  name: Joi.string().trim().min(1).max(200).required(),
});

export const updateMedicineSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200),
  genericName: Joi.string().trim().allow('').max(200),
  category: Joi.string().valid(...categories),
  company: Joi.string().trim().allow('').max(150),
  batch: Joi.string().trim().allow('').max(100),
  unit: Joi.string().valid(...units),
  manufacturingDate: Joi.date().max('now'),
  expiry: Joi.date().min('now'),
  price: Joi.number().min(0),
  cost: Joi.number().min(0),
  gst: Joi.number().min(0).max(100),
  stock: Joi.number().min(0),
  lowStockThreshold: Joi.number().min(0),
  description: Joi.string().trim().allow('').max(2000),
  image: Joi.string().trim().allow('').max(500),
  pharmacist: Joi.string().allow('', null).max(40),
});