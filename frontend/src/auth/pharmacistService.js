// -----------------------------------------------------------------------------
// Pharmacist Service —
// CRUD operations for pharmacist accounts (admin only)
// -----------------------------------------------------------------------------

import api from './api';
import { pharmacistRoutes } from './authRoutes';

// GET ALL PHARMACISTS (with filters / pagination)
// GET /admin/pharmacists?search=&page=&limit=
export const fetchPharmacists = async (params) => {
  const response = await api.get(pharmacistRoutes.PHARMACIST_GET_ALL, { params });
  return response;
};

// GET PHARMACIST DETAILS WITH LIVE STATS (medicines, sales, profit, etc.)
// GET /admin/pharmacists/:id
export const fetchPharmacistById = async (id) => {
  const response = await api.get(pharmacistRoutes.PHARMACIST_DETAILS(id));
  return response;
};

// CREATE A NEW PHARMACIST ACCOUNT
// POST /admin/pharmacists
export const createPharmacist = async (payload) => {
  const response = await api.post(pharmacistRoutes.PHARMACIST_CREATE, payload);
  return response;
};

// UPDATE AN EXISTING PHARMACIST ACCOUNT
// PUT /admin/pharmacists/:id
export const updatePharmacist = async (id, payload) => {
  const response = await api.put(pharmacistRoutes.PHARMACIST_UPDATE(id), payload);
  return response;
};

// DELETE A PHARMACIST ACCOUNT
// DELETE /admin/pharmacists/:id
export const deletePharmacist = async (id) => {
  const response = await api.delete(pharmacistRoutes.PHARMACIST_DELETE(id));
  return response;
};