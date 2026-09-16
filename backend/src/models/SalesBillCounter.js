import mongoose from 'mongoose';

const salesBillCounterSchema = new mongoose.Schema({
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

export default mongoose.model('SalesBillCounter', salesBillCounterSchema);