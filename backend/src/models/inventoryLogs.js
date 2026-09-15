import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    type: {
      type: String,
      enum: ['increase', 'reduce'],
      required: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    reason: {
      type: String,
      enum: ['purchase', 'sale', 'damaged', 'expired', 'correction', 'other'],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: null,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pharmacist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

inventoryLogSchema.index({ pharmacist: 1 });
inventoryLogSchema.index({ medicine: 1 });

export default mongoose.model('InventoryLog', inventoryLogSchema);