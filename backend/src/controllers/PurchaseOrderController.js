import mongoose from 'mongoose';
import PurchaseOrder from '../models/PurchaseOrder.js';
import PurchaseItem from '../models/PurchaseItem.js';
import Medicine from '../models/Medicine.js';
import InventoryLog from '../models/inventoryLogs.js';
import { AppError } from '../middleware/errorHandler.js';
import catchAsync from '../utils/catchAsync.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import createNotification from '../utils/createNotification.js';

export const createPurchaseOrder = catchAsync(async (req, res, next) => {
  const { supplier, items, pharmacist } = req.body;

  if (!supplier || !items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError('Supplier and at least one item are required', 400));
  }

  const pharmacistId = req.user.role === 'pharmacist' ? req.user._id : pharmacist;
  if (!pharmacistId) {
    return next(new AppError('Please select a pharmacist for this purchase order', 400));
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let totalAmount = 0;
    const itemDocs = [];
    const inventoryLogs = [];
    const medicineUpdates = [];

    for (const item of items) {
      const { medicine: medicineId, quantity, purchasePrice } = item;

      if (!medicineId || !quantity || quantity < 1 || purchasePrice === undefined) {
        throw new AppError('Each item requires medicine, quantity, and purchasePrice', 400);
      }

      const medicine = await Medicine.findOne({
        _id: medicineId,
        pharmacist: pharmacistId,
      }).session(session);

      if (!medicine) {
        throw new AppError(`Medicine not found: ${medicineId}`, 404);
      }

      const previousStock = medicine.stock;
      const newStock = previousStock + Number(quantity);
      const itemTotal = Number(quantity) * Number(purchasePrice);

      totalAmount += itemTotal;

      medicineUpdates.push({ medicine, newStock });

      itemDocs.push({
        medicine: medicine._id,
        supplier,
        quantity: Number(quantity),
        purchasePrice: Number(purchasePrice),
        total: itemTotal,
        pharmacist: pharmacistId,
      });

      inventoryLogs.push({
        medicine: medicine._id,
        type: 'increase',
        quantity: Number(quantity),
        reason: 'purchase',
        note: 'Stock added via supplier purchase order',
        previousStock,
        newStock,
        performedBy: req.user._id,
        pharmacist: pharmacistId,
      });
    }

    const orderNumber = await generateOrderNumber(pharmacistId, session);

    const [order] = await PurchaseOrder.create(
      [{ orderNumber, supplier, totalAmount, performedBy: req.user._id, pharmacist: pharmacistId }],
      { session }
    );

    const itemsWithOrder = itemDocs.map((item) => ({ ...item, order: order._id }));
    await PurchaseItem.insertMany(itemsWithOrder, { session });

    for (const { medicine, newStock } of medicineUpdates) {
      medicine.stock = newStock;
      await medicine.save({ session });
    }

    await InventoryLog.insertMany(inventoryLogs, { session });

    await session.commitTransaction();
    session.endSession();

    for (const { medicine, newStock } of medicineUpdates) {
      await createNotification({
        type: 'new_order',
        title: 'Stock updated',
        message: `${medicine.name} — new stock quantity: ${newStock}`,
        pharmacist: pharmacistId,
        relatedId: medicine._id,
      });
    }

    res.status(201).json({ success: true, data: { order, items: itemsWithOrder } });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(err instanceof AppError ? err : new AppError(err.message, 500));
  }
});


export const getPurchaseHistory = catchAsync(async (req, res) => {
  const { orderNumber, pharmacist, startDate, endDate, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (req.user.role === 'pharmacist') {
    filter.pharmacist = req.user._id;
  } else if (pharmacist) {
    filter.pharmacist = pharmacist;
  }

  if (orderNumber) filter.orderNumber = { $regex: orderNumber, $options: 'i' };

  if (startDate || endDate) {
    const from = new Date(startDate || endDate);
    from.setHours(0, 0, 0, 0);

    const to = new Date(endDate || startDate);
    to.setHours(23, 59, 59, 999);

    filter.orderDate = { $gte: from, $lte: to };
  }

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);
  const skip = (pageNum - 1) * limitNum;

  let query = PurchaseOrder.find(filter)
    .populate('supplier', 'name contactNumber email')
    .populate('performedBy', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  if (req.user.role === 'admin') {
    query = query.populate('pharmacist', 'name email');
  }

  const [orders, total] = await Promise.all([
    query,
    PurchaseOrder.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: orders.length,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data: orders,
  });
});

export const getSupplierPurchases = catchAsync(async (req, res) => {
  const { supplierId } = req.params;
  const { startDate, endDate, page = 1, limit = 10 } = req.query;

  const filter = { supplier: supplierId };
  if (req.user.role === 'pharmacist') {
    filter.pharmacist = req.user._id;
  }

  if (startDate || endDate) {
    const from = new Date(startDate || endDate);
    from.setHours(0, 0, 0, 0);

    const to = new Date(endDate || startDate);
    to.setHours(23, 59, 59, 999);

    filter.orderDate = { $gte: from, $lte: to };
  }

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);
  const skip = (pageNum - 1) * limitNum;

  let query = PurchaseOrder.find(filter)
    .populate('performedBy', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  if (req.user.role === 'admin') {
    query = query.populate('pharmacist', 'name email');
  }

  const [orders, total] = await Promise.all([
    query,
    PurchaseOrder.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: orders.length,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data: orders,
  });
});

export const getPurchaseOrderById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const filter =
    req.user.role === 'pharmacist'
      ? { _id: id, pharmacist: req.user._id }
      : { _id: id };

  let query = PurchaseOrder.findOne(filter)
    .populate('supplier', 'name contactNumber email address gstNumber')
    .populate('performedBy', 'name email role');

  if (req.user.role === 'admin') {
    query = query.populate('pharmacist', 'name email');
  }

  const order = await query;

  if (!order) {
    return next(new AppError('Purchase order not found', 404));
  }

  const items = await PurchaseItem.find({ order: order._id }).populate(
    'medicine',
    'name genericName company category batch unit'
  );

  res.status(200).json({ success: true, data: { order, items } });
});

export const getAllPurchaseItems = catchAsync(async (req, res) => {
  const { search, startDate, endDate, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (req.user.role === 'pharmacist') {
    filter.pharmacist = req.user._id;
  }

  if (search) {
    const medicineFilter = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
      ],
    };
    if (req.user.role === 'pharmacist') {
      medicineFilter.pharmacist = req.user._id;
    }

    const matchingMedicines = await Medicine.find(medicineFilter).select('_id');
    filter.medicine = { $in: matchingMedicines.map((m) => m._id) };
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

  let query = PurchaseItem.find(filter)
    .populate('medicine', 'name genericName company category batch unit')
    .populate('supplier', 'name contactNumber')
    .populate('order', 'orderNumber orderDate')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  if (req.user.role === 'admin') {
    query = query.populate('pharmacist', 'name email');
  }

  const [items, total] = await Promise.all([
    query,
    PurchaseItem.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: items.length,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data: items,
  });
});