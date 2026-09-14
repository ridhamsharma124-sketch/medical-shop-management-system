import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import OtpToken from '../models/OtpToken.js';
import { AppError } from '../middleware/errorHandler.js';
import catchAsync from '../utils/catchAsync.js';
import { signToken } from '../middleware/auth.js';
import { sendOtpEmail } from '../utils/email.js';

const OTP_EXPIRES_MIN = Number(process.env.OTP_EXPIRES_IN) || 10;

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const sendAuthResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.cookie('token', token, cookieOptions);
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toSafeJSON(),
  });
};

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

export const register = catchAsync(async (req, res, next) => {
  const { name, email, phone, password } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    return next(new AppError('An account with this email or phone already exists', 409));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const otp = generateOtp();

  await OtpToken.deleteMany({ email });

  await OtpToken.create({
    name,
    email,
    phone,
    password: hashedPassword,
    otp,
    expiresAt: new Date(Date.now() + OTP_EXPIRES_MIN * 60 * 1000),
  });

  await sendOtpEmail(email, otp, OTP_EXPIRES_MIN);

  res.status(200).json({
    success: true,
    message: `OTP sent to ${email}. Verify it to complete your registration.`,
  });
});

export const verifyOtp = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  const record = await OtpToken.findOne({ email, otp }).select('+password');

  if (!record || record.expiresAt < new Date()) {
    if (record) await record.deleteOne();
    return next(new AppError('Invalid or expired OTP', 400));
  }

  const user = await User.create({
    name: record.name,
    email: record.email,
    phone: record.phone,
    password: record.password,
    role: 'pharmacist',
  });

  await record.deleteOne();

  sendAuthResponse(user, 201, res);
});

export const resendOtp = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const record = await OtpToken.findOne({ email });

  if (!record) {
    return next(new AppError('No pending registration found. Please register again.', 400));
  }

  const otp = generateOtp();

  record.otp = otp;
  record.expiresAt = new Date(Date.now() + OTP_EXPIRES_MIN * 60 * 1000);
  await record.save();

  await sendOtpEmail(email, otp, OTP_EXPIRES_MIN);

  res.status(200).json({ success: true, message: `A new OTP has been sent to ${email}.` });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, phone, password } = req.body;

  const user = await User.findOne({
    $or: [{ email }, { phone }],
  }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid credentials', 401));
  }

  sendAuthResponse(user, 200, res);
});

export const logout = catchAsync(async (req, res) => {
  res.cookie('token', 'none', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + 10 * 1000),
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});