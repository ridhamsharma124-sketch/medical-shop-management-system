import Notification from '../models/Notification.js';
import catchAsync from '../utils/catchAsync.js';


export const getNotifications = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const filter =
    req.user.role === 'pharmacist'
      ? { pharmacist: req.user._id, $or: [{ recipient: req.user._id }, { recipient: null }] }
      : { $or: [{ recipient: req.user._id }, { recipient: null }] };

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Notification.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data: notifications,
  });
});