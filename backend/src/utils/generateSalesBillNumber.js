import SalesBillCounter from '../models/SalesBillCounter.js';

export const generateSalesBillNumber = async (pharmacistId, session) => {
  const counter = await SalesBillCounter.findOneAndUpdate(
    { pharmacist: pharmacistId },
    { $inc: { lastNumber: 1 } },
    { new: true, upsert: true, session }
  );

  const year = String(new Date().getFullYear()).slice(-2);

  return `INV-${year}-${String(counter.lastNumber).padStart(4, '0')}`;
};