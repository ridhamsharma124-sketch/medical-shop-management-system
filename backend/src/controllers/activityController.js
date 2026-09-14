import ActivityLog from '../models/ActivityLog.js';
import { AppError } from '../middleware/errorHandler.js';
import catchAsync from '../utils/catchAsync.js';

export const getActivities = catchAsync(async (req, res, next) => {
  const {
    pharmacist,
    action,
    from,
    to,
    search,
    sort = 'newest',
    page = 1,
    limit = 50,
  } = req.query;

  const query = {};

  if (pharmacist) {
    if (!/^[0-9a-fA-F]{24}$/.test(pharmacist)) {
      return next(new AppError('Invalid pharmacist id', 400));
    }
    query.pharmacist = pharmacist;
  }

  if (action) {
    query.action = action;
  }

  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [
      { pharmacistName: regex },
      { actorName: regex },
      { medicineName: regex },
    ];
  }

  const sortBy = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

  const p = Math.max(Number(page) || 1, 1);
  const l = Math.min(Math.max(Number(limit) || 50, 1), 200);

  const [data, total] = await Promise.all([
    ActivityLog.find(query).sort(sortBy).skip((p - 1) * l).limit(l),
    ActivityLog.countDocuments(query),
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