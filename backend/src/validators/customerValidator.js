import Joi from "joi";

export const customerSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Customer name is required",
    "any.required": "Customer name is required",
  }),

  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.pattern.base": "Phone number must be 10 digits",
      "any.required": "Phone number is required",
    }),

  email: Joi.string().email().optional().messages({
    "string.email": "Please provide a valid email",
  }),

  address: Joi.string().trim().optional(),

  pharmacist: Joi.string().allow('', null).max(40),

  rewardPoints: Joi.number().min(0).optional().messages({
    "number.min": "Reward points cannot be negative",
    "number.base": "Reward points must be a number",
  }),
});

export const updateCustomerSchema = customerSchema.fork(
  ["name", "phoneNumber", "email", "address", "rewardPoints"],
  (field) => field.optional()
);