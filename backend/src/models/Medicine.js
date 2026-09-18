import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      maxlength: [200, 'Medicine name must be at most 200 characters'],
    },
    genericName: {
      type: String,
      required: [true, 'Generic name is required'],
      trim: true,
      maxlength: [200, 'Generic name must be at most 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [50, 'Category must be at most 50 characters'],
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [150, 'Company name must be at most 150 characters'],
    },
    batch: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
      maxlength: [100, 'Batch number must be at most 100 characters'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: ['strip', 'tablet', 'bottle', 'box', 'vial', 'sachet'],
    },
    manufacturingDate: {
      type: Date,
      required: [true, 'Manufacturing date is required'],
      validate: {
        validator: (v) => !v || v <= Date.now() + 86400000,
        message: 'Manufacturing date cannot be in the future',
      },
    },
    expiry: {
      type: Date,
      required: [true, 'Expiry date is required'],
      validate: {
        validator: function (v) {
          return !v || !this.manufacturingDate || v > this.manufacturingDate;
        },
        message: 'Expiry date must be after manufacturing date',
      },
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
    },
    gst: {
      type: Number,
      enum: {
        values: [0, 5, 12, 18, 28],
        message: 'GST must be one of: 0, 5, 12, 18, 28',
      },
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      min: [0, 'Threshold cannot be negative'],
      default: 10,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    image: {
      type: String,
      trim: true,
      maxlength: [500, 'Image URL must be at most 500 characters'],
    },
    pharmacist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

medicineSchema.index({ category: 1 });
medicineSchema.index({ company: 1 });
medicineSchema.index({ name: 1 });
medicineSchema.index({ genericName: 1 });
medicineSchema.index({ pharmacist: 1 });

medicineSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.lowStockThreshold;
});

medicineSchema.virtual('status').get(function () {
  if (this.stock === 0) return 'Out of Stock';
  if (this.stock <= this.lowStockThreshold) return 'Low Stock';
  return 'In Stock';
});

medicineSchema.set('toJSON', { virtuals: true });

const Medicine = mongoose.model('Medicine', medicineSchema);

export default Medicine;