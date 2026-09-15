import Medicine from '../models/Medicine.js';
import InventoryLog from '../models/inventoryLogs.js';
import { AppError } from '../middleware/errorHandler.js';
import catchAsync from '../utils/catchAsync.js';
import createNotification from '../utils/createNotification.js';
import Notification from "../models/Notification.js";

const LOW_STOCK_ALERT = 20;

export const adjustStock = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { type, quantity, reason, note } = req.body;

  if (!['increase', 'reduce'].includes(type)) {
    return next(new AppError('type must be "increase" or "reduce"', 400));
  }
  if (!quantity || quantity < 1) {
    return next(new AppError('Valid quantity is required', 400));
  }
  if (!reason) {
    return next(new AppError('Reason is required', 400));
  }

  const filter =
    req.user.role === 'pharmacist'
      ? { _id: id, pharmacist: req.user._id }
      : { _id: id };

  const medicine = await Medicine.findOne(filter);
  if (!medicine) {
    return next(new AppError('Medicine not found', 404));
  }

  const previousStock = medicine.stock;
  let newStock;

  if (type === 'increase') {
    newStock = previousStock + Number(quantity);
  } else {
    if (Number(quantity) > previousStock) {
      return next(new AppError('Insufficient stock available', 400));
    }
    newStock = previousStock - Number(quantity);
  }

  medicine.stock = newStock;
  await medicine.save();

  const log = await InventoryLog.create({
    medicine: medicine._id,
    type,
    quantity: Number(quantity),
    reason,
    note,
    previousStock,
    newStock,
    performedBy: req.user._id,
    pharmacist: medicine.pharmacist,
  });

    if (type === 'increase') {
    await createNotification({
      type: 'new_order',
      title: 'Stock updated',
      message: `${medicine.name} — stock increased by ${quantity} (${reason}). New quantity: ${newStock}`,
      pharmacist: medicine.pharmacist,
      relatedId: medicine._id,
    });
  } else {
    if (newStock > 0 && newStock <= medicine.lowStockThreshold) {
      const existing = await Notification.findOne({
        type: 'low_stock',
        relatedId: medicine._id,
      });

      if (existing) {
        existing.message = `${medicine.name} is running low (${newStock} left)`;
        existing.createdAt = new Date();
        await existing.save();
      } else {
        await createNotification({
          type: 'low_stock',
          title: 'Low stock alert',
          message: `${medicine.name} is running low (${newStock} left)`,
          pharmacist: medicine.pharmacist,
          relatedId: medicine._id,
        });
      }
    } else if (newStock > medicine.lowStockThreshold) {
      await Notification.deleteOne({
        type: 'low_stock',
        relatedId: medicine._id,
      });
    }

    await createNotification({
      type: newStock === 0 ? 'out_of_stock' : 'other',
      title: newStock === 0 ? 'Out of stock' : 'Stock updated',
      message: `${medicine.name} — stock reduced by ${quantity} (${reason}). New quantity: ${newStock}`,
      pharmacist: medicine.pharmacist,
      relatedId: medicine._id,
    });
  }

  res.status(200).json({ success: true, data: { medicine, log } });
});

export const getStockHistory = catchAsync(async (req, res, next) => {
  const { medicineId, startDate, endDate, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (req.user.role === 'pharmacist') {
    filter.pharmacist = req.user._id;
  }

  if (medicineId) {
    filter.medicine = medicineId;
  }

  if (startDate || endDate) {
    const from = new Date(startDate || endDate);
    from.setHours(0, 0, 0, 0);

    const to = new Date(endDate || startDate);
    to.setHours(23, 59, 59, 999);

    filter.createdAt = { $gte: from, $lte: to };
  }

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    InventoryLog.find(filter)
      .populate('medicine', 'name genericName company batch')
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    InventoryLog.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: logs.length,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data: logs,
  });
});

export const getMedicinesByStatus = catchAsync(async (req, res, next) => {
  const { status, pharmacist, page = 1, limit = 10, all } = req.query;

  if (!['low', 'nearExpiry', 'expired', 'outOfStock'].includes(status)) {
    return next(new AppError('status must be one of: low, nearExpiry, expired, outOfStock', 400));
  }

  const filter = {};
  if (req.user.role === 'pharmacist') {
    filter.pharmacist = req.user._id;
  } else if (pharmacist) {
    filter.pharmacist = pharmacist;
  }

  const today = new Date();
  const expiringDays = Number(process.env.EXPIRING_DAYS) || 30;
  const nearExpiryLimit = new Date(today.getTime() + expiringDays * 86400000);

  let sortBy = { createdAt: -1 };

  switch (status) {
    case 'low':
      filter.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
      filter.stock = { $gt: 0 };
      sortBy = { stock: 1 };
      break;
    case 'outOfStock':
      filter.stock = 0;
      break;
    case 'nearExpiry':
      filter.expiry = { $gte: today, $lte: nearExpiryLimit };
      sortBy = { expiry: 1 };
      break;
    case 'expired':
      filter.expiry = { $lt: today };
      sortBy = { expiry: 1 };
      break;
  }

  const exportAll = all === 'true';
  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);
  const skip = exportAll ? 0 : (pageNum - 1) * limitNum;

  let query = Medicine.find(filter).sort(sortBy);
  if (!exportAll) {
    query = query.skip(skip).limit(limitNum);
  }

  const [medicines, total] = await Promise.all([
    query,
    Medicine.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: medicines.length,
    limit: limitNum,
    total,
    totalPages: exportAll ? 1 : Math.ceil(total / limitNum),
    currentPage: exportAll ? 1 : pageNum,
    data: medicines,
  });
});