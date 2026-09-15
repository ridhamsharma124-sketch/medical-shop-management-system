import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = visible to all admins
    },
    pharmacist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // which pharmacist this notification relates to
    },
    type: {
      type: String,
      enum: ['low_stock', 'out_of_stock', 'near_expiry', 'expired', 'new_order', 'new_bill', 'other'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    }
  },
  { timestamps: true, versionKey: false }
);

notificationSchema.index({ recipient: 1 });
notificationSchema.index({ pharmacist: 1 });

export default mongoose.model('Notification', notificationSchema);