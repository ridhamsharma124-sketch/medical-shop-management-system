import Customer from '../models/Customer.js';
import { AppError } from '../middleware/errorHandler.js';
import catchAsync from '../utils/catchAsync.js';

export const createCustomer = catchAsync(async (req, res, next) => {
  const { name, email, phoneNumber, address, pharmacist } = req.body;

  const pharmacistId = req.user.role === 'pharmacist' ? req.user._id : pharmacist;
  if (!pharmacistId) {
    return next(new AppError('Please select a pharmacist for this customer', 400));
  }

  const exists = await Customer.findOne({
    pharmacist: pharmacistId,
    $or: [...(email ? [{ email }] : []), { phoneNumber }],
  });

  if (exists) {
    const field = exists.phoneNumber === phoneNumber ? 'phone number' : 'email';
    return next(new AppError(`Customer with this ${field} already exists for this pharmacist`, 409));
  }

  const customer = await Customer.create({
    name,
    email,
    address,
    phoneNumber,
    pharmacist: pharmacistId,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: customer });
});

export const getAllCustomers = catchAsync(async (req, res) => {
  const { name, phoneNumber, pharmacist, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (req.user.role === 'pharmacist') {
    filter.pharmacist = req.user._id;
  } else if (pharmacist) {
    filter.pharmacist = pharmacist;
  }

  if (name) filter.name = { $regex: name, $options: 'i' };
  if (phoneNumber) filter.phoneNumber = { $regex: phoneNumber, $options: 'i' };

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);
  const skip = (pageNum - 1) * limitNum;

  let query = Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
  if (req.user.role === 'admin') {
    query = query.populate('pharmacist', 'name email');
  }

  const [customers, total] = await Promise.all([query, Customer.countDocuments(filter)]);

  res.status(200).json({
    success: true,
    count: customers.length,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data: customers,
  });
});

export const getCustomerById = catchAsync(async (req, res, next) => {
  const filter =
    req.user.role === 'pharmacist'
      ? { _id: req.params.id, pharmacist: req.user._id }
      : { _id: req.params.id };

  let query = Customer.findOne(filter);
  if (req.user.role === 'admin') {
    query = query.populate('pharmacist', 'name email');
  }

  const customer = await query;
  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }

  res.status(200).json({ success: true, data: customer });
});

export const updateCustomer = catchAsync(async (req, res, next) => {
  const { name, email, phoneNumber, address } = req.body;

  const filter =
    req.user.role === 'pharmacist'
      ? { _id: req.params.id, pharmacist: req.user._id }
      : { _id: req.params.id };

  if (email || phoneNumber) {
    const conditions = [];
    if (email) conditions.push({ email });
    if (phoneNumber) conditions.push({ phoneNumber });

    const exists = await Customer.findOne({
      pharmacist: req.user.role === 'pharmacist' ? req.user._id : undefined,
      _id: { $ne: req.params.id },
      $or: conditions,
    });

    if (exists) {
      const field = exists.phoneNumber === phoneNumber ? 'phone number' : 'email';
      return next(new AppError(`Customer with this ${field} already exists`, 409));
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (address !== undefined) updateData.address = address;

  const customer = await Customer.findOneAndUpdate(filter, updateData, {
    new: true,
    runValidators: true,
  });

  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }

  res.status(200).json({ success: true, data: customer });
});

export const deleteCustomer = catchAsync(async (req, res, next) => {
  const filter =
    req.user.role === 'pharmacist'
      ? { _id: req.params.id, pharmacist: req.user._id }
      : { _id: req.params.id };

  const customer = await Customer.findOneAndDelete(filter);
  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }

  res.status(200).json({ success: true, message: 'Customer deleted successfully' });
});