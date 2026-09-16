import mongoose from 'mongoose';

const otpTokenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: function () {
        return this.purpose === 'register';
      },
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
      trim: true,
      required: function () {
        return this.purpose === 'register';
      },
    },
    password: {
      type: String,
      select: false,
      required: function () {
        return this.purpose === 'register';
      },
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry is required'],
    },
    purpose: {
      type: String,
      enum: ['register', 'reset'],
      default: 'register',
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

otpTokenSchema.index({ email: 1, otp: 1 });
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('OtpToken', otpTokenSchema);