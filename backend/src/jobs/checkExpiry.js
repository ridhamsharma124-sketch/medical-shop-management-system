import cron from 'node-cron';
import Medicine from '../models/Medicine.js';
import Notification from '../models/Notification.js';
import createNotification from '../utils/createNotification.js';

const checkExpiry = async () => {
  try {
    const today = new Date();
    const in30Days = new Date(today.getTime() + 30 * 86400000);

    const nearExpiryMedicines = await Medicine.find({
      expiry: { $gte: today, $lte: in30Days },
    });

    for (const medicine of nearExpiryMedicines) {
      const daysLeft = Math.ceil((medicine.expiry - today) / (1000 * 60 * 60 * 24));

      const existing = await Notification.findOne({
        type: 'near_expiry',
        relatedId: medicine._id,
      });

      if (existing) {
        existing.message = `${medicine.name} expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
        existing.createdAt = new Date();
        await existing.save();
      } else {
        await createNotification({
          type: 'near_expiry',
          title: 'Medicine nearing expiry',
          message: `${medicine.name} expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
          pharmacist: medicine.pharmacist,
          relatedId: medicine._id,
        });
      }
    }

    const expiredMedicines = await Medicine.find({
      expiry: { $lt: today },
    });

    for (const medicine of expiredMedicines) {
      const existing = await Notification.findOne({
        type: 'expired',
        relatedId: medicine._id,
      });

      if (!existing) {
        await Notification.findOneAndDelete({
          type: 'near_expiry',
          relatedId: medicine._id,
        });

        await createNotification({
          type: 'expired',
          title: 'Medicine expired',
          message: `${medicine.name} has expired`,
          pharmacist: medicine.pharmacist,
          relatedId: medicine._id,
        });
      }
    }

    console.log(
      `Expiry check complete: ${nearExpiryMedicines.length} near expiry, ${expiredMedicines.length} expired`
    );
  } catch (err) {
    console.error('Expiry check job failed:', err.message);
  }
};

// runs once every day at midnight
cron.schedule('0 0 * * *', checkExpiry);

export default checkExpiry;