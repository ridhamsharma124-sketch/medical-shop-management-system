import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import catchAsync from '../utils/catchAsync.js';

export const getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({ success: true, data: user });
});

export const updateProfile = catchAsync(async (req, res, next) => {
  const { name, email, phone } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;

  if (email) {
    const exists = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (exists) {
      return next(new AppError('Email already in use', 409));
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true,
  }).select('-password');

  res.status(200).json({ success: true, data: user });
});

export const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Current and new password are required', 400));
  }

  if (newPassword.length < 8) {
    return next(new AppError('New password must be at least 8 characters', 400));
  }

  const user = await User.findById(req.user._id).select('+password');

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    return next(new AppError('Current password is incorrect', 401));
  }

  const isSame = await bcrypt.compare(newPassword, user.password);
  if (isSame) {
    return next(new AppError('New password must be different from current password', 400));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Password changed successfully' });
});