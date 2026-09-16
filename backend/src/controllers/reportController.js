import mongoose from 'mongoose';
import SalesBill from '../models/SalesBill.js';
import SalesBillItem from '../models/SalesBillItem.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import PurchaseItem from '../models/PurchaseItem.js';
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';

const round2 = (num) => Math.round(num * 100) / 100;

const toIST = (date) => {
  return new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
};

const resolvePharmacistFilter = (req) => {
  if (req.user.role === 'pharmacist') {
    return new mongoose.Types.ObjectId(req.user._id);
  }
  if (req.query.pharmacist) {
    return new mongoose.Types.ObjectId(req.query.pharmacist);
  }
  return null; // admin, no filter — overall report
};

export const getSalesReport = catchAsync(async (req, res) => {
  const pharmacistId = resolvePharmacistFilter(req);
  const { startDate, endDate, page = 1, limit = 20, all } = req.query;

  let from, to;

  if (startDate || endDate) {
    from = new Date(startDate || endDate);
    from.setHours(0, 0, 0, 0);
    to = new Date(endDate || startDate);
    to.setHours(23, 59, 59, 999);
  } else {
    from = new Date();
    from.setHours(0, 0, 0, 0);
    to = new Date();
    to.setHours(23, 59, 59, 999);
  }

  let pharmacistLabel = 'all';
  if (pharmacistId) {
    const pharmacistDoc = await User.findById(pharmacistId).select('name email');
    pharmacistLabel = pharmacistDoc
      ? { _id: pharmacistDoc._id, name: pharmacistDoc.name, email: pharmacistDoc.email }
      : 'all';
  }

  const filter = { billDate: { $gte: from, $lte: to } };
  if (pharmacistId) filter.pharmacist = pharmacistId;

  const exportAll = all === 'true';

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);
  const skip = exportAll ? 0 : (pageNum - 1) * limitNum;

  let query = SalesBill.find(filter)
    .populate('customer', 'name phoneNumber')
    .populate('performedBy', 'name email role')
    .populate('pharmacist', 'name email')
    .sort({ createdAt: -1 });

  if (!exportAll) {
    query = query.skip(skip).limit(limitNum);
  }

  const [billsRaw, total, summary] = await Promise.all([
    query.lean(),
    SalesBill.countDocuments(filter),
    SalesBill.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalGst: { $sum: '$gstAmount' },
          totalDiscount: { $sum: '$discountAmount' },
          billCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const bills = await Promise.all(
    billsRaw.map(async (bill) => {
      const items = await SalesBillItem.find({ bill: bill._id }).populate(
        'medicine',
        'name genericName company unit'
      );
      return { ...bill, items };
    })
  );

  res.status(200).json({
    success: true,
    dateRange: { from: toIST(from), to: toIST(to) },
    pharmacist: pharmacistLabel,
    summary: {
      totalRevenue: round2(summary[0]?.totalRevenue || 0),
      totalGst: round2(summary[0]?.totalGst || 0),
      totalDiscount: round2(summary[0]?.totalDiscount || 0),
      billCount: summary[0]?.billCount || 0,
    },
    count: bills.length,
    limit: limitNum,
    total,
    totalPages: exportAll ? 1 : Math.ceil(total / limitNum),
    currentPage: exportAll ? 1 : pageNum,
    data: bills,
  });
});

export const getProfitReportByPharmacist = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Only admin can access this report', 403));
  }

  const { startDate, endDate, page = 1, limit = 50, all } = req.query;

  let from, to;

  if (startDate || endDate) {
    from = new Date(startDate || endDate);
    from.setHours(0, 0, 0, 0);
    to = new Date(endDate || startDate);
    to.setHours(23, 59, 59, 999);
  } else {
    from = new Date();
    from.setHours(0, 0, 0, 0);
    to = new Date();
    to.setHours(23, 59, 59, 999);
  }

  const salesAgg = await SalesBillItem.aggregate([
    {
      $lookup: {
        from: 'salesbills',
        localField: 'bill',
        foreignField: '_id',
        as: 'billInfo',
      },
    },
    { $unwind: '$billInfo' },
    { $match: { 'billInfo.billDate': { $gte: from, $lte: to } } },
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
        _id: '$pharmacist',
        totalRevenue: {
          $sum: { $subtract: [{ $multiply: ['$price', '$quantity'] }, '$discountAmount'] },
        },
        totalCost: {
          $sum: { $multiply: ['$medicineInfo.purchasePrice', '$quantity'] },
        },
        itemsSold: { $sum: '$quantity' },
        billCount: { $addToSet: '$bill' },
      },
    },
    {
      $project: {
        totalRevenue: 1,
        totalCost: 1,
        itemsSold: 1,
        totalProfit: { $subtract: ['$totalRevenue', '$totalCost'] },
        billCount: { $size: '$billCount' },
      },
    },
  ]);

  const pharmacistIds = salesAgg.map((s) => String(s._id));

  const pharmacists = await User.find({ _id: { $in: pharmacistIds } }).select('name email');
  const pharmacistMap = new Map(pharmacists.map((p) => [String(p._id), p]));

  const merged = salesAgg.map((sales) => {
    const id = String(sales._id);
    const pharmacist = pharmacistMap.get(id);

    return {
      pharmacist: pharmacist ? { _id: pharmacist._id, name: pharmacist.name, email: pharmacist.email } : null,
      totalRevenue: round2(sales.totalRevenue || 0),
      totalCost: round2(sales.totalCost || 0),
      totalProfit: round2(sales.totalProfit || 0),
      itemsSold: sales.itemsSold || 0,
      billCount: sales.billCount || 0,
    };
  });

  merged.sort((a, b) => b.totalProfit - a.totalProfit);

  const exportAll = all === 'true';
  const total = merged.length;
  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);

  const paginated = exportAll
    ? merged
    : merged.slice((pageNum - 1) * limitNum, (pageNum - 1) * limitNum + limitNum);

  res.status(200).json({
    success: true,
    dateRange: { from: toIST(from), to: toIST(to) },
    count: paginated.length,
    total,
    totalPages: exportAll ? 1 : Math.ceil(total / limitNum),
    currentPage: exportAll ? 1 : pageNum,
    data: paginated,
  });
});

export const getProfitReport = catchAsync(async (req, res, next) => {
  const pharmacistId = resolvePharmacistFilter(req);

  if (req.user.role === 'admin' && !pharmacistId) {
    return next(new AppError('Pharmacist ID is required for admin role', 400));
  }

  const pharmacistDoc = await User.findById(pharmacistId).select('name email');
  if (!pharmacistDoc) {
    return next(new AppError('Pharmacist not found', 404));
  }

  const { startDate, endDate, medicineId, medicineName } = req.query;

  let from, to;

  if (startDate || endDate) {
    from = new Date(startDate || endDate);
    from.setHours(0, 0, 0, 0);
    to = new Date(endDate || startDate);
    to.setHours(23, 59, 59, 999);
  } else {
    from = new Date();
    from.setHours(0, 0, 0, 0);
    to = new Date();
    to.setHours(23, 59, 59, 999);
  }

  const itemMatch = { pharmacist: pharmacistId };

  const medicineMatch = {};
  if (medicineId) medicineMatch['medicineInfo._id'] = new mongoose.Types.ObjectId(medicineId);
  if (medicineName) medicineMatch['medicineInfo.name'] = { $regex: medicineName, $options: 'i' };

  const pipelineBase = [
    { $match: itemMatch },
    {
      $lookup: {
        from: 'salesbills',
        localField: 'bill',
        foreignField: '_id',
        as: 'billInfo',
      },
    },
    { $unwind: '$billInfo' },
    { $match: { 'billInfo.billDate': { $gte: from, $lte: to } } },
    {
      $lookup: {
        from: 'medicines',
        localField: 'medicine',
        foreignField: '_id',
        as: 'medicineInfo',
      },
    },
    { $unwind: '$medicineInfo' },
    ...(Object.keys(medicineMatch).length ? [{ $match: medicineMatch }] : []),
  ];

  const result = await SalesBillItem.aggregate([
    ...pipelineBase,
    {
      $project: {
        quantity: 1,
        revenue: {
          $subtract: [{ $multiply: ['$price', '$quantity'] }, '$discountAmount'],
        },
        cost: { $multiply: ['$medicineInfo.purchasePrice', '$quantity'] },
        profit: {
          $subtract: [
            { $subtract: [{ $multiply: ['$price', '$quantity'] }, '$discountAmount'] },
            { $multiply: ['$medicineInfo.purchasePrice', '$quantity'] },
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$revenue' },
        totalCost: { $sum: '$cost' },
        totalProfit: { $sum: '$profit' },
        itemsSold: { $sum: '$quantity' },
      },
    },
  ]);

  const byMedicine = await SalesBillItem.aggregate([
    ...pipelineBase,
    {
      $group: {
        _id: '$medicine',
        medicineName: { $first: '$medicineInfo.name' },
        quantitySold: { $sum: '$quantity' },
        revenue: {
          $sum: { $subtract: [{ $multiply: ['$price', '$quantity'] }, '$discountAmount'] },
        },
        cost: { $sum: { $multiply: ['$medicineInfo.purchasePrice', '$quantity'] } },
        profit: {
          $sum: {
            $subtract: [
              { $subtract: [{ $multiply: ['$price', '$quantity'] }, '$discountAmount'] },
              { $multiply: ['$medicineInfo.purchasePrice', '$quantity'] },
            ],
          },
        },
      },
    },
    { $sort: { profit: -1 } },
  ]);

  res.status(200).json({
    success: true,
    dateRange: { from: toIST(from), to: toIST(to) },
    pharmacist: { _id: pharmacistDoc._id, name: pharmacistDoc.name, email: pharmacistDoc.email },
    summary: {
      totalRevenue: round2(result[0]?.totalRevenue || 0),
      totalCost: round2(result[0]?.totalCost || 0),
      totalProfit: round2(result[0]?.totalProfit || 0),
      itemsSold: result[0]?.itemsSold || 0,
    },
    byMedicine: byMedicine.map((m) => ({
      ...m,
      revenue: round2(m.revenue),
      cost: round2(m.cost),
      profit: round2(m.profit),
    })),
  });
});

export const getPurchaseReport = catchAsync(async (req, res) => {
  const pharmacistId = resolvePharmacistFilter(req);
  const { startDate, endDate, page = 1, limit = 20, all, supplierId } = req.query;

  let from, to;

  if (startDate || endDate) {
    from = new Date(startDate || endDate);
    from.setHours(0, 0, 0, 0);
    to = new Date(endDate || startDate);
    to.setHours(23, 59, 59, 999);
  } else {
    from = new Date();
    from.setHours(0, 0, 0, 0);
    to = new Date();
    to.setHours(23, 59, 59, 999);
  }

  let pharmacistLabel = 'all';
if (pharmacistId) {
  const pharmacistDoc = await User.findById(pharmacistId).select('name email');
  pharmacistLabel = pharmacistDoc ? { _id: pharmacistDoc._id, name: pharmacistDoc.name, email: pharmacistDoc.email } : 'all';
}

  const filter = { orderDate: { $gte: from, $lte: to } };
  if (pharmacistId) filter.pharmacist = pharmacistId;
  if (supplierId) filter.supplier = supplierId;

  const exportAll = all === 'true';

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);
  const skip = exportAll ? 0 : (pageNum - 1) * limitNum;

  let query = PurchaseOrder.find(filter)
    .populate('supplier', 'name contactNumber')
    .sort({ createdAt: -1 });

  if (req.user.role === 'admin') {
    query = query.populate('pharmacist', 'name email');
  }

  if (!exportAll) {
    query = query.skip(skip).limit(limitNum);
  }

  const [ordersRaw, total, summary] = await Promise.all([
    query.lean(),
    PurchaseOrder.countDocuments(filter),
    PurchaseOrder.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalPurchaseAmount: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const orders = await Promise.all(
    ordersRaw.map(async (order) => {
      const items = await PurchaseItem.find({ order: order._id }).populate(
        'medicine',
        'name genericName company unit'
      );
      return { ...order, items };
    })
  );

  res.status(200).json({
    success: true,
    dateRange: { from: toIST(from), to: toIST(to) },
    pharmacist: pharmacistLabel,
    summary: {
      totalPurchaseAmount: round2(summary[0]?.totalPurchaseAmount || 0),
      orderCount: summary[0]?.orderCount || 0,
    },
    count: orders.length,
    total,
    totalPages: exportAll ? 1 : Math.ceil(total / limitNum),
    currentPage: exportAll ? 1 : pageNum,
    data: orders,
  });
});

export const getBestSellingMedicines = catchAsync(async (req, res) => {
  const pharmacistId = resolvePharmacistFilter(req);
  const { startDate, endDate, limit = 20 } = req.query;

  let from, to;

  if (startDate || endDate) {
    from = new Date(startDate || endDate);
    from.setHours(0, 0, 0, 0);
    to = new Date(endDate || startDate);
    to.setHours(23, 59, 59, 999);
  } else {
    from = new Date();
    from.setHours(0, 0, 0, 0);
    to = new Date();
    to.setHours(23, 59, 59, 999);
  }

  let pharmacistLabel = 'all';
  if (pharmacistId) {
    const pharmacistDoc = await User.findById(pharmacistId).select('name email');
    pharmacistLabel = pharmacistDoc
      ? { _id: pharmacistDoc._id, name: pharmacistDoc.name, email: pharmacistDoc.email }
      : 'all';
  }

  const limitNum = Math.max(Number(limit), 1);

  const itemMatch = {};
  if (pharmacistId) itemMatch.pharmacist = pharmacistId;

  const bestSelling = await SalesBillItem.aggregate([
    { $match: itemMatch },
    {
      $lookup: {
        from: 'salesbills',
        localField: 'bill',
        foreignField: '_id',
        as: 'billInfo',
      },
    },
    { $unwind: '$billInfo' },
    { $match: { 'billInfo.billDate': { $gte: from, $lte: to } } },
    {
      $group: {
        _id: '$medicine',
        totalQuantitySold: { $sum: '$quantity' },
        totalRevenue: {
          $sum: { $subtract: [{ $multiply: ['$price', '$quantity'] }, '$discountAmount'] },
        },
      },
    },
    { $sort: { totalQuantitySold: -1 } },
    { $limit: limitNum },
    {
      $lookup: {
        from: 'medicines',
        localField: '_id',
        foreignField: '_id',
        as: 'medicineInfo',
      },
    },
    { $unwind: '$medicineInfo' },
    {
      $project: {
        _id: 0,
        medicineId: '$medicineInfo._id',
        medicineName: '$medicineInfo.name',
        category: '$medicineInfo.category',
        totalQuantitySold: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    dateRange: { from: toIST(from), to: toIST(to) },
    pharmacist: pharmacistLabel,
    count: bestSelling.length,
    data: bestSelling,
  });
});