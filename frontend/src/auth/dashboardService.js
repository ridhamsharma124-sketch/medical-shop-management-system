// -----------------------------------------------------------------------------
// Dashboard Service —
// Summary + charts for admin & pharmacist dashboards
// -----------------------------------------------------------------------------

import api from './api';
import { dashboardRoutes } from './authRoutes';

const getRoutes = (role) =>
  role === 'admin' ? dashboardRoutes.ADMIN : dashboardRoutes.PHARMACIST;

// GET /{role}/dashboard-summary
export const fetchDashboardSummary = async (role) => {
  const response = await api.get(getRoutes(role).SUMMARY);
  return response;
};

// GET /{role}/dashboard-charts
export const fetchDashboardCharts = async (role) => {
  const response = await api.get(getRoutes(role).CHARTS);
  return response;
};