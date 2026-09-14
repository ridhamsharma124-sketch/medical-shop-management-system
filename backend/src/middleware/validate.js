import { AppError } from '../middleware/errorHandler.js';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => d.message.replace(/"/g, '')).join(', ');
      return next(new AppError(`Validation failed: ${details}`, 400));
    }

    req[source] = value;
    next();
  };
};