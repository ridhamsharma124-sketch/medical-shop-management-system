import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true,
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: [0, 'Purchase price cannot be negative'],
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    pharmacist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

purchaseItemSchema.index({ pharmacist: 1 });
purchaseItemSchema.index({ order: 1 });

export default mongoose.model('PurchaseItem', purchaseItemSchema);