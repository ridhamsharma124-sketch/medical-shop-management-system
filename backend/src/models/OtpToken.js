import mongoose from 'mongoose';

const otpTokenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry is required'],
    },
  },
  { timestamps: true }
);

otpTokenSchema.index({ email: 1, otp: 1 });

export default mongoose.model('OtpToken', otpTokenSchema);