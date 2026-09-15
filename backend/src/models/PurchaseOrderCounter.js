import mongoose from 'mongoose';

const purchaseOrderCounterSchema = new mongoose.Schema({
  pharmacist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  lastNumber: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model('PurchaseOrderCounter', purchaseOrderCounterSchema);