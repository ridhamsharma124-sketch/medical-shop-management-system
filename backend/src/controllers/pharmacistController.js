import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Medicine from '../models/Medicine.js';
import Customer from '../models/Customer.js';
import SalesBill from '../models/SalesBill.js';
import SalesBillItem from '../models/SalesBillItem.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import { AppError } from '../middleware/errorHandler.js';
import catchAsync from '../utils/catchAsync.js';

export const getAllPharmacists = catchAsync(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;

  const filter = { role: 'pharmacist' };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);
  const skip = (pageNum - 1) * limitNum;

  const [pharmacists, total] = await Promise.all([
    User.find(filter)
      .select('name email phone createdAt')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    results: pharmacists.length,
    total,
    limit: limitNum,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    data: pharmacists,
  });
});

export const createPharmacist = catchAsync(async (req, res, next) => {
  const { name, email, phone, password } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    const field = existing.email === email ? 'email' : 'phone';
    return next(new AppError(`An account with this ${field} already exists`, 409));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const pharmacist = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role: 'pharmacist',
  });

  res.status(201).json({
    success: true,
    message: `Pharmacist "${pharmacist.name}" created successfully`,
    data: pharmacist.toSafeJSON(),
  });
});

// export const getPharmacist = catchAsync(async (req, res, next) => {
//   const pharmacist = await User.findOne({ _id: req.params.id, role: 'pharmacist' }).select(
//     'name email phone role createdAt'
//   );

//   if (!pharmacist) {
//     return next(new AppError('Pharmacist not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     data: pharmacist,
//   });
// });


const round2 = (num) => Math.round(num * 100) / 100;

export const getPharmacist = catchAsync(async (req, res, next) => {
  const pharmacist = await User.findOne({ _id: req.params.id, role: 'pharmacist' }).select(
    'name email phone role createdAt'
  );

  if (!pharmacist) {
    return next(new AppError('Pharmacist not found', 404));
  }

  const pharmacistId = pharmacist._id;
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86400000);

  const [
    totalMedicines,
    outOfStock,
    lowStock,
    totalExpired,
    nearExpiry,
    totalCustomers,
    salesAgg,
    totalBills,
    purchaseAgg,
    profitAgg,
  ] = await Promise.all([
    Medicine.countDocuments({ pharmacist: pharmacistId }),
    Medicine.countDocuments({ pharmacist: pharmacistId, stock: 0 }),
    Medicine.countDocuments({
      pharmacist: pharmacistId,
      stock: { $gt: 0 },
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    }),
    Medicine.countDocuments({ pharmacist: pharmacistId, expiry: { $lt: now } }),
    Medicine.countDocuments({ pharmacist: pharmacistId, expiry: { $gte: now, $lte: in30Days } }),

    Customer.countDocuments({ pharmacist: pharmacistId }),

    SalesBill.aggregate([
      { $match: { pharmacist: pharmacistId } },
      { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' } } },
    ]),
    SalesBill.countDocuments({ pharmacist: pharmacistId }),

    PurchaseOrder.aggregate([
      { $match: { pharmacist: pharmacistId } },
      { $group: { _id: null, totalPurchaseAmount: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
    ]),

    SalesBillItem.aggregate([
      { $match: { pharmacist: pharmacistId } },
      {
        $lookup: {
          from: 'medicines',
          localField: 'medicine',
          foreignField: '_id',
          as: 'medicineInfo',
        },
      },
      { $unwind: '$medicineInfo' },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $subtract: [{ $multiply: ['$price', '$quantity'] }, '$discountAmount'] },
          },
          totalCost: {
            $sum: { $multiply: ['$medicineInfo.purchasePrice', '$quantity'] },
          },
        },
      },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      pharmacist,
      medicines: {
        total: totalMedicines,
        outOfStock,
        lowStock,
        expired: totalExpired,
        nearExpiryWithin30Days: nearExpiry,
      },
      customers: {
        total: totalCustomers,
      },
      sales: {
        totalRevenue: round2(salesAgg[0]?.totalRevenue || 0),
        totalBills,
      },
      purchases: {
        totalPurchaseAmount: round2(purchaseAgg[0]?.totalPurchaseAmount || 0),
        orderCount: purchaseAgg[0]?.orderCount || 0,
      },
      profit: {
        totalRevenue: round2(profitAgg[0]?.totalRevenue || 0),
        totalCost: round2(profitAgg[0]?.totalCost || 0),
        totalProfit: round2((profitAgg[0]?.totalRevenue || 0) - (profitAgg[0]?.totalCost || 0)),
      },
    },
  });
});

export const deletePharmacist = catchAsync(async (req, res, next) => {
  if (req.params.id === req.user.id) {
    return next(new AppError('You cannot delete your own account', 400));
  }

  const pharmacist = await User.findOne({ _id: req.params.id, role: 'pharmacist' });
  if (!pharmacist) {
    return next(new AppError('Pharmacist not found', 404));
  }

  await Medicine.updateMany(
    { pharmacist: pharmacist._id },
    { $set: { pharmacist: null } }
  );

  await pharmacist.deleteOne();

  res.status(200).json({
    success: true,
    message: `Pharmacist "${pharmacist.name}" deleted. Their medicines are now unassigned.`,
  });
});

export const updatePharmacist = catchAsync(async (req, res, next) => {
  const { name, phone, password } = req.body;

  const pharmacist = await User.findOne({ _id: req.params.id, role: 'pharmacist' });
  if (!pharmacist) {
    return next(new AppError('Pharmacist not found', 404));
  }

  if (phone && phone !== pharmacist.phone) {
    const clash = await User.findOne({ phone, _id: { $ne: pharmacist._id } });
    if (clash) {
      return next(new AppError('An account with this phone already exists', 409));
    }
  }

  pharmacist.name = name || pharmacist.name;
  pharmacist.phone = phone || pharmacist.phone;

  if (password) {
    const salt = await bcrypt.genSalt(10);
    pharmacist.password = await bcrypt.hash(password, salt);
    pharmacist.markModified('password');
  }

  await pharmacist.save();

  res.status(200).json({
    success: true,
    message: `Pharmacist "${pharmacist.name}" updated successfully`,
    data: pharmacist.toSafeJSON(),
  });
});