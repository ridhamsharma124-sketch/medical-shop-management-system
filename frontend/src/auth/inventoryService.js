// -----------------------------------------------------------------------------
// Inventory Service —
// Stock adjustments and history (admin + pharmacist roles)
// -----------------------------------------------------------------------------

import api from './api';
import { inventoryRoutes } from './authRoutes';

// Pick the route set based on the logged-in role
// admin     => inventoryRoutes.ADMIN
// pharmacist => inventoryRoutes.PHARMACIST
const getRoutes = (role) =>
  role === 'admin' ? inventoryRoutes.ADMIN : inventoryRoutes.PHARMACIST;

// ADJUST STOCK OF A MEDICINE (increase / reduce)
// PATCH /{role}/inventory/:id/stock
export const adjustStock = async (role, id, payload) => {
  const response = await api.patch(getRoutes(role).STOCK_ADJUST(id), payload);
  return response;
};

// GET STOCK HISTORY OF A MEDICINE
// GET /{role}/inventory/stock-history?medicineId=&page=
export const fetchStockHistory = async (role, params) => {
  const response = await api.get(getRoutes(role).STOCK_HISTORY, { params });
  return response;
};

// GET MEDICINES BY STOCK STATUS (low / out of stock / expiring)
// GET /{role}/inventory/status?status=low
export const fetchMedicinesByStatus = async (role, params) => {
  const response = await api.get(getRoutes(role).STOCK_STATUS, { params });
  return response;
};