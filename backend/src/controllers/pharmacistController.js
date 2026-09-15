import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Medicine from '../models/Medicine.js';
import { AppError } from '../middleware/errorHandler.js';
import catchAsync from '../utils/catchAsync.js';

export const getAllPharmacists = catchAsync(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;

  const filter = { role: 'pharmacist' };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);
  const skip = (pageNum - 1) * limitNum;

  const [pharmacists, total] = await Promise.all([
    User.find(filter)
      .select('name email phone createdAt')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    results: pharmacists.length,
    total,
    limit: limitNum,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    data: pharmacists,
  });
});

export const createPharmacist = catchAsync(async (req, res, next) => {
  const { name, email, phone, password } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    const field = existing.email === email ? 'email' : 'phone';
    return next(new AppError(`An account with this ${field} already exists`, 409));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const pharmacist = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role: 'pharmacist',
  });

  res.status(201).json({
    success: true,
    message: `Pharmacist "${pharmacist.name}" created successfully`,
    data: pharmacist.toSafeJSON(),
  });
});

export const getPharmacist = catchAsync(async (req, res, next) => {
  const pharmacist = await User.findOne({ _id: req.params.id, role: 'pharmacist' }).select(
    'name email phone role createdAt'
  );

  if (!pharmacist) {
    return next(new AppError('Pharmacist not found', 404));
  }

  res.status(200).json({
    success: true,
    data: pharmacist,
  });
});

export const deletePharmacist = catchAsync(async (req, res, next) => {
  if (req.params.id === req.user.id) {
    return next(new AppError('You cannot delete your own account', 400));
  }

  const pharmacist = await User.findOne({ _id: req.params.id, role: 'pharmacist' });
  if (!pharmacist) {
    return next(new AppError('Pharmacist not found', 404));
  }

  await Medicine.updateMany(
    { pharmacist: pharmacist._id },
    { $set: { pharmacist: null } }
  );

  await pharmacist.deleteOne();

  res.status(200).json({
    success: true,
    message: `Pharmacist "${pharmacist.name}" deleted. Their medicines are now unassigned.`,
  });
});

export const updatePharmacist = catchAsync(async (req, res, next) => {
  const { name, phone, password } = req.body;

  const pharmacist = await User.findOne({ _id: req.params.id, role: 'pharmacist' });
  if (!pharmacist) {
    return next(new AppError('Pharmacist not found', 404));
  }

  if (phone && phone !== pharmacist.phone) {
    const clash = await User.findOne({ phone, _id: { $ne: pharmacist._id } });
    if (clash) {
      return next(new AppError('An account with this phone already exists', 409));
    }
  }

  pharmacist.name = name || pharmacist.name;
  pharmacist.phone = phone || pharmacist.phone;

  if (password) {
    const salt = await bcrypt.genSalt(10);
    pharmacist.password = await bcrypt.hash(password, salt);
    pharmacist.markModified('password');
  }

  await pharmacist.save();

  res.status(200).json({
    success: true,
    message: `Pharmacist "${pharmacist.name}" updated successfully`,
    data: pharmacist.toSafeJSON(),
  });
});