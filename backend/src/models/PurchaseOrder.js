import mongoose from 'mongoose';

const purchaseOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    orderDate: {
      type: Date,
      default: Date.now,
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

purchaseOrderSchema.index({ pharmacist: 1 });

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);