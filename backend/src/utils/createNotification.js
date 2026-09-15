import Notification from '../models/Notification.js';

const createNotification = async ({ type, title, message, recipient = null, pharmacist = null, relatedId = null }) => {
  try {
    await Notification.create({
      type,
      title,
      message,
      recipient,
      pharmacist,
      relatedId,
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

export default createNotification;