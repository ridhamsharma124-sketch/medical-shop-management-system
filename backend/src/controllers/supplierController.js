import Supplier from '../models/supplier.js';
import { AppError } from '../middleware/errorHandler.js';
import catchAsync from '../utils/catchAsync.js';

const resolveOwner = (req) => (req.user.role === 'pharmacist' ? req.user._id : req.body.pharmacist);

export const createSupplier = catchAsync(async (req, res, next) => {
  const { name, contactNumber, email, address, gstNumber } = req.body;

  const pharmacistId = resolveOwner(req);
  if (!pharmacistId) {
    return next(new AppError('Please select a pharmacist for this supplier', 400));
  }

  const exists = await Supplier.findOne({
    pharmacist: pharmacistId,
    $or: [{ email }, { gstNumber }],
  });

  if (exists) {
    const field = exists.email === email ? 'email' : 'GST number';
    return next(new AppError(`Supplier with this ${field} already exists for this pharmacist`, 409));
  }

  const supplier = await Supplier.create({
    name,
    contactNumber,
    email,
    address,
    gstNumber,
    pharmacist: pharmacistId,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: supplier });
});

export const getSuppliers = catchAsync(async (req, res) => {
  const { name, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (req.user.role === 'pharmacist') {
    filter.pharmacist = req.user._id;
  }
  if (name) filter.name = { $regex: name, $options: 'i' };

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);
  const skip = (pageNum - 1) * limitNum;

  let query = Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
  if (req.user.role === 'admin') {
    query = query.populate('pharmacist', 'name email');
  }

  const [suppliers, total] = await Promise.all([
    query,
    Supplier.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: suppliers.length,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data: suppliers,
  });
});

export const getSupplierById = catchAsync(async (req, res, next) => {
  const filter =
    req.user.role === 'pharmacist'
      ? { _id: req.params.id, pharmacist: req.user._id }
      : { _id: req.params.id };

  let query = Supplier.findOne(filter);
  if (req.user.role === 'admin') {
    query = query.populate('pharmacist', 'name email');
  }

  const supplier = await query;
  
  if (!supplier) {
    return next(new AppError('Supplier not found', 404));
  }

  res.status(200).json({ success: true, data: supplier });
});

export const updateSupplier = catchAsync(async (req, res, next) => {
  const filter =
    req.user.role === 'pharmacist'
      ? { _id: req.params.id, pharmacist: req.user._id }
      : { _id: req.params.id };

  if (req.user.role === 'pharmacist') {
    delete req.body.pharmacist;
  }

  const supplier = await Supplier.findOneAndUpdate(filter, req.body, {
    new: true,
    runValidators: true,
  });

  if (!supplier) {
    return next(new AppError('Supplier not found', 404));
  }

  res.status(200).json({ success: true, data: supplier });
});

export const deleteSupplier = catchAsync(async (req, res, next) => {
  const filter =
    req.user.role === 'pharmacist'
      ? { _id: req.params.id, pharmacist: req.user._id }
      : { _id: req.params.id };

  const supplier = await Supplier.findOneAndDelete(filter);
  if (!supplier) {
    return next(new AppError('Supplier not found', 404));
  }

  res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
});