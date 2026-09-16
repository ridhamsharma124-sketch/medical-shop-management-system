// -----------------------------------------------------------------------------
// Purchase Service —
// Purchase order operations (admin + pharmacist roles)
// -----------------------------------------------------------------------------

import api from './api';
import { purchaseRoutes } from './authRoutes';

// Pick the route set based on the logged-in role
// admin     => purchaseRoutes.ADMIN
// pharmacist => purchaseRoutes.PHARMACIST
const getRoutes = (role) =>
  role === 'admin' ? purchaseRoutes.ADMIN : purchaseRoutes.PHARMACIST;

// GET ALL PURCHASE ORDERS (with filters / pagination)
// GET /{role}/purchase-orders?search=&page=&limit=
export const fetchPurchaseOrders = async (role, params) => {
  const response = await api.get(getRoutes(role).PURCHASE_GET_ALL, { params });
  return response;
};

// GET PURCHASE ORDER BY ID
// GET /{role}/purchase-orders/:id
export const fetchPurchaseOrderById = async (role, id) => {
  const response = await api.get(getRoutes(role).PURCHASE_DETAILS(id));
  return response;
};

// CREATE A NEW PURCHASE ORDER (also updates medicine stock)
// POST /{role}/purchase-orders
export const createPurchaseOrder = async (role, payload) => {
  const response = await api.post(getRoutes(role).PURCHASE_CREATE, payload);
  return response;
};

// GET ALL PURCHASE ORDERS OF A SPECIFIC SUPPLIER
// GET /{role}/suppliers/:supplierId/purchases
export const fetchSupplierPurchases = async (role, supplierId, params) => {
  const response = await api.get(getRoutes(role).SUPPLIER_PURCHASES(supplierId), { params });
  return response;
};

// GET ALL PURCHASE ITEMS (line-by-line report)
// GET /{role}/purchase-items?search=&page=&limit=
export const fetchPurchaseItems = async (role, params) => {
  const response = await api.get(getRoutes(role).PURCHASE_ITEMS, { params });
  return response;
};