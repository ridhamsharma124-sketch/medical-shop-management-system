// -----------------------------------------------------------------------------
// Medicine Service —
// CRUD operations for medicines (admin + pharmacist roles)
// -----------------------------------------------------------------------------

import api from './api';
import { medicineRoutes } from './authRoutes';

// Pick the route set based on the logged-in role
// admin     => medicineRoutes.ADMIN
// pharmacist => medicineRoutes.PHARMACIST
const getRoutes = (role) =>
  role === 'admin' ? medicineRoutes.ADMIN : medicineRoutes.PHARMACIST;

// GET ALL MEDICINES (with filters / pagination)
// GET /{role}/medicines?search=&category=&page=
export const fetchMedicines = async (role, params) => {
  const response = await api.get(getRoutes(role).MEDICINE_GET_ALL, { params });
  return response;
};

// GET MEDICINE BY ID
// GET /{role}/medicines/:id
export const fetchMedicineById = async (role, id) => {
  const response = await api.get(getRoutes(role).MEDICINE_DETAILS(id));
  return response;
};

// SEARCH MEDICINES BY NAME
// GET /{role}/medicines/search?q=
export const searchMedicines = async (role, params) => {
  const response = await api.get(getRoutes(role).MEDICINE_SEARCH, { params });
  return response;
};

// CREATE A NEW MEDICINE
// POST /{role}/medicines
export const createMedicine = async (role, payload) => {
  const response = await api.post(getRoutes(role).MEDICINE_CREATE, payload);
  return response;
};

// UPDATE AN EXISTING MEDICINE
// PUT /{role}/medicines/:id
export const updateMedicine = async (role, id, payload) => {
  const response = await api.put(getRoutes(role).MEDICINE_UPDATE(id), payload);
  return response;
};

// DELETE A MEDICINE
// DELETE /{role}/medicines/:id
export const deleteMedicine = async (role, id) => {
  const response = await api.delete(getRoutes(role).MEDICINE_DELETE(id));
  return response;
};