import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    pharmacist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    pharmacistName: String,
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorName: String,
    actorRole: {
      type: String,
      enum: ['admin', 'pharmacist'],
    },
    action: {
      type: String,
      enum: ['create', 'update', 'delete'],
      required: true,
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      default: null,
    },
    medicineName: String,
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ pharmacist: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;