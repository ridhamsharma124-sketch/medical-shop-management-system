import Joi from 'joi';

const units = ['strip', 'tablet', 'bottle', 'box', 'vial', 'sachet'];

const baseFields = {
  name: Joi.string().trim().min(1).max(200).required(),
  genericName: Joi.string().trim().max(200).required(),
  category: Joi.string().trim().max(50).required(),
  company: Joi.string().trim().max(150).required(),
  batch: Joi.string().trim().max(100).required(),
  unit: Joi.string()
    .valid(...units)
    .required(),
  manufacturingDate: Joi.date().required(),
  expiry: Joi.date().greater(Joi.ref('manufacturingDate')).required().messages({
    'date.greater': 'Expiry date must be after manufacturing date',
  }),
  sellingPrice: Joi.number().min(0).required(),
  purchasePrice: Joi.number().min(0).required(),
  gst: Joi.number().valid(0, 5, 12, 18, 28).default(0),
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
  genericName: Joi.string().trim().max(200),
  category: Joi.string().trim().max(50),
  company: Joi.string().trim().max(150),
  batch: Joi.string().trim().max(100),
  unit: Joi.string().valid(...units),
  manufacturingDate: Joi.date(),
  expiry: Joi.date(), 
  sellingPrice: Joi.number().min(0),
  purchasePrice: Joi.number().min(0),
  gst: Joi.number().valid(0, 5, 12, 18, 28).default(0),
  stock: Joi.number().min(0),
  lowStockThreshold: Joi.number().min(0),
  description: Joi.string().trim().allow('').max(2000),
  image: Joi.string().trim().allow('').max(500),
  pharmacist: Joi.string().allow('', null).max(40),
});