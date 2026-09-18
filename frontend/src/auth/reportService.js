// -----------------------------------------------------------------------------
// Report Service —
// Sales / Profit / Purchase / Best-selling reports (admin + pharmacist roles)
// -----------------------------------------------------------------------------

import api from './api';
import { reportRoutes } from './authRoutes';

// Pick the route set based on the logged-in role
const getRoutes = (role) =>
  role === 'admin' ? reportRoutes.ADMIN : reportRoutes.PHARMACIST;

// SALES REPORT
// GET /{role}/reports/sales?startDate=&endDate=&page=&limit=&all=true
export const fetchSalesReport = async (role, params) => {
  const response = await api.get(getRoutes(role).REPORT_SALES, { params });
  return response;
};

// PROFIT REPORT
// GET /{role}/reports/profit (pharmacist: own; admin: requires ?pharmacist=id)
export const fetchProfitReport = async (role, params) => {
  const response = await api.get(getRoutes(role).REPORT_PROFIT, { params });
  return response;
};

// PROFIT REPORT BY PHARMACIST (admin only)
// GET /admin/reports/profit/by-pharmacist?startDate=&endDate=
export const fetchProfitReportByPharmacist = async (role, params) => {
  const response = await api.get(getRoutes(role).REPORT_PROFIT_BY_PHARMACIST, { params });
  return response;
};

// PURCHASE REPORT
// GET /{role}/reports/purchase?startDate=&endDate=&page=&limit=&supplierId=
export const fetchPurchaseReport = async (role, params) => {
  const response = await api.get(getRoutes(role).REPORT_PURCHASE, { params });
  return response;
};

// BEST SELLING MEDICINES REPORT
// GET /{role}/reports/best-selling?startDate=&endDate=&limit=
export const fetchBestSellingReport = async (role, params) => {
  const response = await api.get(getRoutes(role).REPORT_BEST_SELLING, { params });
  return response;
};