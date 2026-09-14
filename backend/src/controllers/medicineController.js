import Medicine from '../models/Medicine.js';
import { AppError } from '../middleware/errorHandler.js';
import catchAsync from '../utils/catchAsync.js';
import { logActivity } from '../utils/logActivity.js';

const FORCE_OWNER_FILTER = (query, req) => {
  if (req.user.role === 'pharmacist') {
    query.pharmacist = req.user._id;
  }
};

export const createMedicine = catchAsync(async (req, res, next) => {
  if (req.user.role === 'pharmacist') {
    req.body.pharmacist = req.user._id;
  } else {
    if (!req.body.pharmacist) {
      return next(new AppError('Please select a pharmacist for this medicine', 400));
    }
  }

  const medicine = await Medicine.create(req.body);

  await logActivity({
    user: req.user,
    action: 'create',
    medicine,
    medicineName: medicine.name,
  });

  res.status(201).json({ success: true, data: medicine });
});

export const getAllMedicines = catchAsync(async (req, res) => {
  const {
    search,
    category,
    company,
    expiry = 'all',
    low,
    sort,
    page = 1,
    limit = 50,
  } = req.query;

  const query = {};

  FORCE_OWNER_FILTER(query, req);

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [
      { name: regex },
      { genericName: regex },
      { company: regex },
      { batch: regex },
      { category: regex },
    ];
  }

  if (category) {
    query.category = category;
  }

  if (company) {
    query.company = company;
  }

  const now = Date.now();
  const expiringDays = Number(process.env.EXPIRING_DAYS) || 30;

  switch (expiry) {
    case 'valid':
      query.expiry = { $gte: now };
      break;
    case 'expiring':
      query.expiry = { $gte: now, $lte: new Date(now + expiringDays * 86400000) };
      break;
    case 'expired':
      query.expiry = { $lt: now };
      break;
    default:
      break;
  }

  if (low === 'true') {
    query.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
  }

  const sortFields = {
    newest: '-createdAt',
    oldest: 'createdAt',
    stock: 'stock',
    price: 'price',
    expiry: 'expiry',
    name: 'name',
  };
  const sortBy = sortFields[sort] || sortFields.newest;

  const p = Math.max(Number(page) || 1, 1);
  const l = Math.min(Math.max(Number(limit) || 50, 1), 200);

  const [data, total] = await Promise.all([
    Medicine.find(query).sort(sortBy).skip((p - 1) * l).limit(l),
    Medicine.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    results: data.length,
    total,
    page: p,
    totalPages: Math.ceil(total / l),
    data,
  });
});

export const getMedicineById = catchAsync(async (req, res, next) => {
  const filter =
    req.user.role === 'pharmacist'
      ? { _id: req.params.id, pharmacist: req.user._id }
      : { _id: req.params.id };

  const medicine = await Medicine.findOne(filter);
  if (!medicine) {
    return next(new AppError('Medicine not found', 404));
  }
  res.status(200).json({ success: true, data: medicine });
});

export const searchMedicines = catchAsync(async (req, res, next) => {
  const { q, category, expiry = 'all', sort, page = 1, limit = 50 } = req.query;

  if (!q || !q.trim()) {
    return next(new AppError('Search query q is required, e.g. ?q=paracetamol', 400));
  }

  const query = {
    $or: [
      { name: new RegExp(q.trim(), 'i') },
      { genericName: new RegExp(q.trim(), 'i') },
      { company: new RegExp(q.trim(), 'i') },
      { batch: new RegExp(q.trim(), 'i') },
      { category: new RegExp(q.trim(), 'i') },
    ],
  };

  FORCE_OWNER_FILTER(query, req);

  if (category) {
    query.category = category;
  }

  const now = Date.now();
  const expiringDays = Number(process.env.EXPIRING_DAYS) || 30;

  switch (expiry) {
    case 'valid':
      query.expiry = { $gte: now };
      break;
    case 'expiring':
      query.expiry = { $gte: now, $lte: new Date(now + expiringDays * 86400000) };
      break;
    case 'expired':
      query.expiry = { $lt: now };
      break;
    default:
      break;
  }

  const sortFields = {
    newest: '-createdAt',
    oldest: 'createdAt',
    stock: 'stock',
    price: 'price',
    expiry: 'expiry',
    name: 'name',
  };
  const sortBy = sortFields[sort] || sortFields.newest;

  const p = Math.max(Number(page) || 1, 1);
  const l = Math.min(Math.max(Number(limit) || 50, 1), 200);

  const [data, total] = await Promise.all([
    Medicine.find(query).sort(sortBy).skip((p - 1) * l).limit(l),
    Medicine.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    results: data.length,
    total,
    page: p,
    totalPages: Math.ceil(total / l),
    data,
  });
});

export const updateMedicine = catchAsync(async (req, res, next) => {
  const filter =
    req.user.role === 'pharmacist'
      ? { _id: req.params.id, pharmacist: req.user._id }
      : { _id: req.params.id };

  const oldMedicine = await Medicine.findOne(filter);
  if (!oldMedicine) {
    return next(new AppError('Medicine not found', 404));
  }

  if (req.user.role === 'pharmacist') {
    delete req.body.pharmacist;
  }

  const medicine = await Medicine.findByIdAndUpdate(oldMedicine._id, req.body, {
    new: true,
    runValidators: true,
  });

  const changes = {};
  for (const key of Object.keys(req.body || {})) {
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(key)) continue;
    if (String(oldMedicine[key]) !== String(medicine[key])) {
      changes[key] = { from: oldMedicine[key], to: medicine[key] };
    }
  }

  await logActivity({
    user: req.user,
    action: 'update',
    medicine,
    medicineName: medicine.name,
    changes,
  });

  res.status(200).json({ success: true, data: medicine });
});

export const deleteMedicine = catchAsync(async (req, res, next) => {
  const filter =
    req.user.role === 'pharmacist'
      ? { _id: req.params.id, pharmacist: req.user._id }
      : { _id: req.params.id };

  const medicine = await Medicine.findOne(filter);
  if (!medicine) {
    return next(new AppError('Medicine not found', 404));
  }

  await Medicine.findByIdAndDelete(medicine._id);

  await logActivity({
    user: req.user,
    action: 'delete',
    medicine: medicine._id,
    medicineName: medicine.name,
  });

  res.status(200).json({ success: true, message: 'Medicine deleted successfully' });
});