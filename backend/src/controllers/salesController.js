import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Medicine from '../models/Medicine.js';
import SalesBill from '../models/SalesBill.js';
import SalesBillItem from '../models/SalesBillItem.js';
import InventoryLog from '../models/inventoryLogs.js';
import Notification from '../models/Notification.js';
import createNotification from '../utils/createNotification.js';
import { generateSalesBillNumber } from '../utils/generateSalesBillNumber.js';
import { AppError } from '../middleware/errorHandler.js';
import catchAsync from '../utils/catchAsync.js';

const round2 = (num) => Math.round(num * 100) / 100;

export const createSalesBill = catchAsync(async (req, res, next) => {
  const {
    customer: customerId,
    items,
    discountAmount = 0,
    paymentMethod,
    pharmacist,
  } = req.body;

  if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError('Customer and at least one item are required', 400));
  }

  if (Number(discountAmount) < 0) {
    return next(new AppError('Discount cannot be negative', 400));
  }

  if (!paymentMethod) {
    return next(new AppError('Payment method is required', 400));
  }

  const pharmacistId = req.user.role === 'pharmacist' ? req.user._id : pharmacist;
  if (!pharmacistId) {
    return next(new AppError('Please select a pharmacist for this bill', 400));
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const customer = await Customer.findOne({
      _id: customerId,
      pharmacist: pharmacistId,
    }).session(session);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    let subtotal = 0;
    let totalGst = 0;
    let totalBeforeDiscount = 0;

    const itemDocs = [];
    const inventoryLogs = [];
    const medicineUpdates = [];

    for (const item of items) {
      const { medicine: medicineId, quantity } = item;

      if (!medicineId || quantity === undefined) {
        throw new AppError('Each item requires medicine and quantity', 400);
      }

      if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
        throw new AppError('Quantity must be a positive whole number', 400);
      }

      const medicine = await Medicine.findOne({
        _id: medicineId,
        pharmacist: pharmacistId,
      }).session(session);

      if (!medicine) {
        throw new AppError(`Medicine not found: ${medicineId}`, 404);
      }

      if (medicine.stock < Number(quantity)) {
        throw new AppError(
          `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}, requested: ${quantity}`,
          400
        );
      }

      const price = Number(medicine.sellingPrice);
      const qty = Number(quantity);

      const lineSubtotal = price * qty;
      const gstAmount = (lineSubtotal * Number(medicine.gst)) / 100;
      const itemTotalBeforeDiscount = lineSubtotal + gstAmount;

      subtotal += lineSubtotal;
      totalGst += gstAmount;
      totalBeforeDiscount += itemTotalBeforeDiscount;

      const previousStock = medicine.stock;
      const newStock = previousStock - qty;

      medicineUpdates.push({ medicine, newStock });

      itemDocs.push({
        medicine: medicine._id,
        quantity: qty,
        price: round2(price),
        gstPercentage: Number(medicine.gst),
        gstAmount: round2(gstAmount),
        totalBeforeDiscount: round2(itemTotalBeforeDiscount),
        pharmacist: pharmacistId,
      });

      inventoryLogs.push({
        medicine: medicine._id,
        type: 'reduce',
        quantity: qty,
        reason: 'sale',
        note: 'Stock reduced via bill',
        previousStock,
        newStock,
        performedBy: req.user._id,
        pharmacist: pharmacistId,
      });
    }

    if (Number(discountAmount) > totalBeforeDiscount) {
      throw new AppError(`Discount cannot exceed the bill total (₹${round2(totalBeforeDiscount)})`, 400);
    }

    const discountPercentage =
      totalBeforeDiscount > 0 ? (Number(discountAmount) / totalBeforeDiscount) * 100 : 0;

    const finalItemDocs = itemDocs.map((item) => {
      const itemDiscountAmount = (item.totalBeforeDiscount * discountPercentage) / 100;
      const total = item.totalBeforeDiscount - itemDiscountAmount;

      return {
        ...item,
        discountAmount: round2(itemDiscountAmount),
        total: round2(total),
      };
    });

    const grandTotal = round2(totalBeforeDiscount - Number(discountAmount));
    const earnedRewardPoints = Math.floor(grandTotal / 100);

    customer.rewardPoints += earnedRewardPoints;
    await customer.save({ session });

    const invoiceNumber = await generateSalesBillNumber(pharmacistId, session);

    const [bill] = await SalesBill.create(
      [
        {
          invoiceNumber,
          customer: customer._id,
          customerName: customer.name,
          customerPhone: customer.phoneNumber,
          subtotal: round2(subtotal),
          discountAmount: round2(Number(discountAmount)),
          gstAmount: round2(totalGst),
          grandTotal,
          paymentMethod,
          performedBy: req.user._id,
          pharmacist: pharmacistId,
        },
      ],
      { session }
    );

    const itemsWithBill = finalItemDocs.map((item) => ({ ...item, bill: bill._id }));
    await SalesBillItem.insertMany(itemsWithBill, { session });

    for (const { medicine, newStock } of medicineUpdates) {
      medicine.stock = newStock;
      await medicine.save({ session });
    }

    await InventoryLog.insertMany(inventoryLogs, { session });

    await session.commitTransaction();
    session.endSession();

    setImmediate(async () => {
      try {
        for (const { medicine, newStock } of medicineUpdates) {
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
                pharmacist: pharmacistId,
                relatedId: medicine._id,
              });
            }
          } else if (newStock === 0) {
            await Notification.findOneAndDelete({
              type: 'low_stock',
              relatedId: medicine._id,
            });
            await createNotification({
              type: 'out_of_stock',
              title: 'Out of stock',
              message: `${medicine.name} is now out of stock`,
              pharmacist: pharmacistId,
              relatedId: medicine._id,
            });
          }
        }
      } catch (err) {
        console.error('Notification step failed:', err.message);
      }
    });

    res.status(201).json({
      success: true,
      data: {
        bill,
        items: itemsWithBill,
        discountPercentage: round2(discountPercentage),
      },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(err instanceof AppError ? err : new AppError(err.message, 500));
  }
});

export const getBillHistory = catchAsync(async (req, res) => {
  const { invoiceNumber, pharmacist, customer, startDate, endDate, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (req.user.role === 'pharmacist') {
    filter.pharmacist = req.user._id;
  } else if (pharmacist) {
    filter.pharmacist = pharmacist;
  }

  if (invoiceNumber) filter.invoiceNumber = { $regex: invoiceNumber, $options: 'i' };
  if (customer) filter.customer = customer;

  if (startDate || endDate) {
    const from = new Date(startDate || endDate);
    from.setHours(0, 0, 0, 0);

    const to = new Date(endDate || startDate);
    to.setHours(23, 59, 59, 999);

    filter.billDate = { $gte: from, $lte: to };
  }

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);
  const skip = (pageNum - 1) * limitNum;

  let query = SalesBill.find(filter)
    .populate('customer', 'name phoneNumber email')
    .populate('performedBy', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  if (req.user.role === 'admin') {
    query = query.populate('pharmacist', 'name email');
  }

  const [bills, total] = await Promise.all([query, SalesBill.countDocuments(filter)]);

  res.status(200).json({
    success: true,
    count: bills.length,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data: bills,
  });
});

export const getBillById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const filter =
    req.user.role === 'pharmacist'
      ? { _id: id, pharmacist: req.user._id }
      : { _id: id };

  let query = SalesBill.findOne(filter)
    .populate('customer', 'name phoneNumber email address rewardPoints')
    .populate('performedBy', 'name email role');

  if (req.user.role === 'admin') {
    query = query.populate('pharmacist', 'name email');
  }

  const bill = await query;

  if (!bill) {
    return next(new AppError('Bill not found', 404));
  }

  const items = await SalesBillItem.find({ bill: bill._id })
    .populate('medicine', 'name genericName company category batch unit')
    .lean();

  const cleanedItems = items.map((item) => {
    if (item.medicine) {
      delete item.medicine.isLowStock;
      delete item.medicine.status;
    }
    return item;
  });

  res.status(200).json({ success: true, data: { bill, items: cleanedItems } });
});