import Joi from "joi";

export const supplierSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Supplier name is required",
    "any.required": "Supplier name is required",
  }),
  contactNumber: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    "string.pattern.base": "Contact number must be 10 digits",
    "any.required": "Contact number is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  address: Joi.string().trim().required().messages({
    "string.empty": "Address is required",
    "any.required": "Address is required",
  }),
  gstNumber: Joi.string()
    .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .required()
    .messages({
      "string.pattern.base": "Please provide a valid GST number",
      "any.required": "GST number is required",
    }),
    pharmacist: Joi.string().allow('', null).max(40),
});

export const updateSupplierSchema = supplierSchema.fork(
  ["name", "contactNumber", "email", "address", "gstNumber"],
  (field) => field.optional()
);