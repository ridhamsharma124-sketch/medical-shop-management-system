import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { AppError } from './errorHandler.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve('uploads/medicines'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `med-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (jpeg, png, webp, gif) are allowed', 400));
  }
};

export const uploadMedicineImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const NUMERIC_FIELDS = ['price', 'cost', 'gst', 'stock', 'lowStockThreshold'];

const normalizeMedicineBody = (req, res, next) => {
  if (!req.is('multipart/form-data')) {
    return next(new AppError('Medicine create/update needs form-data (multipart) with an image file', 400));
  }
  if (!req.body || typeof req.body !== 'object') {
    return next();
  }
  if (req.file) {
    req.body.image = `/uploads/medicines/${req.file.filename}`;
  }
  for (const field of NUMERIC_FIELDS) {
    if (typeof req.body[field] === 'string' && req.body[field].trim() !== '') {
      const num = Number(req.body[field]);
      if (Number.isNaN(num)) {
        return next(new AppError(`${field} must be a number`, 400));
      }
      req.body[field] = num;
    }
  }
  next();
};

export const uploadMedicineForm = [
  uploadMedicineImage.single('image'),
  normalizeMedicineBody,
];