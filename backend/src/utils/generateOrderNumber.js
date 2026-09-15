import PurchaseOrderCounter from '../models/PurchaseOrderCounter.js';

export const generateOrderNumber = async (pharmacistId, session) => {
  const counter = await PurchaseOrderCounter.findOneAndUpdate(
    { pharmacist: pharmacistId },
    { $inc: { lastNumber: 1 } },
    { new: true, upsert: true, session }
  );

  const year = String(new Date().getFullYear()).slice(-2);

  return `PO-${year}-${String(counter.lastNumber).padStart(4, '0')}`;
};