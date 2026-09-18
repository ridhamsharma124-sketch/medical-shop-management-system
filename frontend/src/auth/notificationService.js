// -----------------------------------------------------------------------------
// Notification Service
// -----------------------------------------------------------------------------

import api from './api';
import { notificationRoutes } from './authRoutes';

const getRoute = (role) => (role === 'admin' ? notificationRoutes.ADMIN.NOTIFICATIONS : notificationRoutes.PHARMACIST.NOTIFICATIONS);

// GET /{role}/notifications?page=&limit=
export const fetchNotifications = async (role, params = {}) => {
  const response = await api.get(getRoute(role), { params });
  return response;
};