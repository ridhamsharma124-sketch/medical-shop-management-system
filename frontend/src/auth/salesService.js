// -----------------------------------------------------------------------------
// Sales/Billing Service —
// Create & view sales bills (admin + pharmacist roles)
// -----------------------------------------------------------------------------

import api from './api';
import { salesRoutes } from './authRoutes';

// Pick the route set based on the logged-in role
const getRoutes = (role) =>
  role === 'admin' ? salesRoutes.ADMIN : salesRoutes.PHARMACIST;

// CREATE A SALES BILL
// POST /{role}/sales-bills
export const createSalesBill = async (role, payload) => {
  const response = await api.post(getRoutes(role).SALES_BILL_CREATE, payload);
  return response;
};

// GET ALL SALES BILLS (with filters / pagination)
// GET /{role}/sales-bills?invoiceNumber=&pharmacist=&startDate=&endDate=&page=&limit=
export const fetchSalesBills = async (role, params) => {
  const response = await api.get(getRoutes(role).SALES_BILL_GET_ALL, { params });
  return response;
};

// GET SALES BILL BY ID (with items)
// GET /{role}/sales-bills/:id
export const fetchSalesBillById = async (role, id) => {
  const response = await api.get(getRoutes(role).SALES_BILL_DETAILS(id));
  return response;
};