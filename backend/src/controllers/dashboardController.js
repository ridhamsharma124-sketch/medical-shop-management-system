import User from '../models/User.js';
import Medicine from '../models/Medicine.js';
import Customer from '../models/Customer.js';
import SalesBill from '../models/SalesBill.js';
import SalesBillItem from '../models/SalesBillItem.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Supplier from '../models/supplier.js';
import catchAsync from '../utils/catchAsync.js';

const round2 = (num) => Math.round(num * 100) / 100;

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const getDashboardSummary = catchAsync(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  const in30Days = new Date(now.getTime() + 30 * 86400000);

  const [
    totalPharmacists,
    pharmacistsThisMonth,
    totalMedicines,
    medicinesThisMonth,
    totalCustomers,
    customersThisMonth,
    salesAgg,
    salesAggThisMonth,
    totalBills,
    billsThisMonth,
    totalPurchaseOrders,
    purchaseOrdersThisMonth,
    totalSuppliers,
    suppliersThisMonth,
    totalExpired,
    nearExpiry,
  ] = await Promise.all([
    User.countDocuments({ role: 'pharmacist' }),
    User.countDocuments({ role: 'pharmacist', createdAt: { $gte: startOfMonth, $lt: startOfNextMonth } }),

    Medicine.countDocuments({}),
    Medicine.countDocuments({ createdAt: { $gte: startOfMonth, $lt: startOfNextMonth } }),

    Customer.countDocuments({}),
    Customer.countDocuments({ createdAt: { $gte: startOfMonth, $lt: startOfNextMonth } }),

    SalesBill.aggregate([{ $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
    SalesBill.aggregate([
      { $match: { billDate: { $gte: startOfMonth, $lt: startOfNextMonth } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),

    SalesBill.countDocuments({}),
    SalesBill.countDocuments({ billDate: { $gte: startOfMonth, $lt: startOfNextMonth } }),

    PurchaseOrder.countDocuments({}),
    PurchaseOrder.countDocuments({ orderDate: { $gte: startOfMonth, $lt: startOfNextMonth } }),

    Supplier.countDocuments({}),
    Supplier.countDocuments({ createdAt: { $gte: startOfMonth, $lt: startOfNextMonth } }),

    Medicine.countDocuments({ expiry: { $lt: now } }),
    Medicine.countDocuments({ expiry: { $gte: now, $lte: in30Days } }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      pharmacists: {
        total: totalPharmacists,
        newThisMonth: pharmacistsThisMonth,
      },
      medicines: {
        total: totalMedicines,
        addedThisMonth: medicinesThisMonth,
      },
      customers: {
        total: totalCustomers,
        newThisMonth: customersThisMonth,
      },
      sales: {
        total: Math.round((salesAgg[0]?.total || 0) * 100) / 100,
        thisMonth: Math.round((salesAggThisMonth[0]?.total || 0) * 100) / 100,
      },
      bills: {
        total: totalBills,
        thisMonth: billsThisMonth,
      },
      purchaseOrders: {
        total: totalPurchaseOrders,
        thisMonth: purchaseOrdersThisMonth,
      },
      suppliers: {
        total: totalSuppliers,
        newThisMonth: suppliersThisMonth,
      },
      medicineExpiry: {
        totalExpired,
        nearExpiryWithin30Days: nearExpiry,
      },
    },
  });
});

export const getDashboardCharts = catchAsync(async (req, res) => {
  const now = new Date();

  const sixMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);

  const monthlySalesRaw = await SalesBill.aggregate([
    { $match: { billDate: { $gte: sixMonthsAgoStart } } },
    {
      $group: {
        _id: { year: { $year: '$billDate' }, month: { $month: '$billDate' } },
        saleAmount: { $sum: '$grandTotal' },
      },
    },
  ]);

  const monthlySalesMap = new Map(
    monthlySalesRaw.map((m) => [`${m._id.year}-${m._id.month}`, round2(m.saleAmount)])
  );

  const salesOverTime = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    salesOverTime.push({
      month: MONTH_NAMES[d.getMonth()],
      year: d.getFullYear(),
      saleAmount: monthlySalesMap.get(key) || 0,
    });
  }

  const topPharmacistsAgg = await SalesBill.aggregate([
    {
      $group: {
        _id: '$pharmacist',
        totalSales: { $sum: '$grandTotal' },
      },
    },
    { $sort: { totalSales: -1 } },
    { $limit: 6 },
  ]);

  const pharmacistIds = topPharmacistsAgg.map((p) => p._id);
  const pharmacistDocs = await User.find({ _id: { $in: pharmacistIds } }).select('name');
  const pharmacistNameMap = new Map(pharmacistDocs.map((p) => [String(p._id), p.name]));

  const topPharmacists = topPharmacistsAgg.map((p) => ({
    pharmacistId: p._id,
    name: pharmacistNameMap.get(String(p._id)) || 'Unknown',
    totalSales: round2(p.totalSales),
  }));

  const categoryWiseSalesAgg = await SalesBillItem.aggregate([
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
        _id: '$medicineInfo.category',
        saleAmount: {
          $sum: { $subtract: [{ $multiply: ['$price', '$quantity'] }, '$discountAmount'] },
        },
      },
    },
    { $sort: { saleAmount: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        category: '$_id',
        saleAmount: { $round: ['$saleAmount', 2] },
      },
    },
  ]);

  const topMedicinesAgg = await SalesBillItem.aggregate([
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
        _id: '$medicine',
        name: { $first: '$medicineInfo.name' },
        saleAmount: {
          $sum: { $subtract: [{ $multiply: ['$price', '$quantity'] }, '$discountAmount'] },
        },
      },
    },
    { $sort: { saleAmount: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        medicineId: '$_id',
        name: 1,
        saleAmount: { $round: ['$saleAmount', 2] },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      salesOverTime,
      topPharmacists,
      categoryWiseSales: categoryWiseSalesAgg,
      topSellingMedicines: topMedicinesAgg,
    },
  });
});

export const getPharmacistDashboardSummary = catchAsync(async (req, res) => {
  const pharmacistId = req.user._id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  const in30Days = new Date(now.getTime() + 30 * 86400000);

  const [
    totalMedicines,
    medicinesThisMonth,
    salesAgg,
    salesAggThisMonth,
    totalCustomers,
    customersThisMonth,
    totalExpired,
    nearExpiry,
    outOfStock,
    lowStock,
  ] = await Promise.all([
    Medicine.countDocuments({ pharmacist: pharmacistId }),
    Medicine.countDocuments({
      pharmacist: pharmacistId,
      createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
    }),

    SalesBill.aggregate([
      { $match: { pharmacist: pharmacistId } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    SalesBill.aggregate([
      {
        $match: {
          pharmacist: pharmacistId,
          billDate: { $gte: startOfMonth, $lt: startOfNextMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),

    Customer.countDocuments({ pharmacist: pharmacistId }),
    Customer.countDocuments({
      pharmacist: pharmacistId,
      createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
    }),

    Medicine.countDocuments({ pharmacist: pharmacistId, expiry: { $lt: now } }),
    Medicine.countDocuments({
      pharmacist: pharmacistId,
      expiry: { $gte: now, $lte: in30Days },
    }),

    Medicine.countDocuments({ pharmacist: pharmacistId, stock: 0 }),
    Medicine.countDocuments({
      pharmacist: pharmacistId,
      stock: { $gt: 0 },
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      medicines: {
        total: totalMedicines,
        addedThisMonth: medicinesThisMonth,
      },
      sales: {
        total: Math.round((salesAgg[0]?.total || 0) * 100) / 100,
        thisMonth: Math.round((salesAggThisMonth[0]?.total || 0) * 100) / 100,
      },
      customers: {
        total: totalCustomers,
        newThisMonth: customersThisMonth,
      },
      medicineExpiry: {
        totalExpired,
        nearExpiryWithin30Days: nearExpiry,
      },
      stockAlerts: {
        outOfStock,
        lowStock,
      },
    },
  });
});

export const getPharmacistDashboardCharts = catchAsync(async (req, res) => {
  const pharmacistId = req.user._id;
  const now = new Date();

  const sixMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);

  const monthlySalesRaw = await SalesBill.aggregate([
    { $match: { pharmacist: pharmacistId, billDate: { $gte: sixMonthsAgoStart } } },
    {
      $group: {
        _id: { year: { $year: '$billDate' }, month: { $month: '$billDate' } },
        saleAmount: { $sum: '$grandTotal' },
      },
    },
  ]);

  const monthlySalesMap = new Map(
    monthlySalesRaw.map((m) => [`${m._id.year}-${m._id.month}`, round2(m.saleAmount)])
  );

  const salesOverTime = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    salesOverTime.push({
      month: MONTH_NAMES[d.getMonth()],
      year: d.getFullYear(),
      saleAmount: monthlySalesMap.get(key) || 0,
    });
  }

  const categoryWiseSalesAgg = await SalesBillItem.aggregate([
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
        _id: '$medicineInfo.category',
        saleAmount: {
          $sum: { $subtract: [{ $multiply: ['$price', '$quantity'] }, '$discountAmount'] },
        },
      },
    },
    { $sort: { saleAmount: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        category: '$_id',
        saleAmount: { $round: ['$saleAmount', 2] },
      },
    },
  ]);

  const topMedicinesAgg = await SalesBillItem.aggregate([
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
        _id: '$medicine',
        name: { $first: '$medicineInfo.name' },
        saleAmount: {
          $sum: { $subtract: [{ $multiply: ['$price', '$quantity'] }, '$discountAmount'] },
        },
      },
    },
    { $sort: { saleAmount: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        medicineId: '$_id',
        name: 1,
        saleAmount: { $round: ['$saleAmount', 2] },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      salesOverTime,
      categoryWiseSales: categoryWiseSalesAgg,
      topSellingMedicines: topMedicinesAgg,
    },
  });
});