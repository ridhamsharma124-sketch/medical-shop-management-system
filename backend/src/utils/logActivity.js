import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';

export const logActivity = async ({ user, action, medicine, medicineName, changes = {} }) => {
  try {
    const ownerPharmacist =
      user.role === 'pharmacist' ? user._id : medicine?.pharmacist || null;

    let pharmacistName;
    if (user.role === 'pharmacist') {
      pharmacistName = user.name;
    } else if (ownerPharmacist) {
      const owner = await User.findById(ownerPharmacist).select('name');
      pharmacistName = owner?.name;
    }

    await ActivityLog.create({
      pharmacist: ownerPharmacist,
      pharmacistName,
      actor: user._id,
      actorName: user.name,
      actorRole: user.role,
      action,
      medicine: medicine?._id || medicine || null,
      medicineName,
      changes,
    });
  } catch {
    // Activity logging should never break medicine operations
  }
};