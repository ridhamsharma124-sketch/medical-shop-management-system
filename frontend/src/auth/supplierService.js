// -----------------------------------------------------------------------------
// Supplier Service —
// CRUD operations for suppliers (admin + pharmacist roles)
// -----------------------------------------------------------------------------

import api from './api';
import { supplierRoutes } from './authRoutes';

// Pick the route set based on the logged-in role
// admin     => supplierRoutes.ADMIN
// pharmacist => supplierRoutes.PHARMACIST
const getRoutes = (role) =>
  role === 'admin' ? supplierRoutes.ADMIN : supplierRoutes.PHARMACIST;

// GET ALL SUPPLIERS (with filters / pagination)
// GET /{role}/suppliers?search=&page=&limit=
export const fetchSuppliers = async (role, params) => {
  const response = await api.get(getRoutes(role).SUPPLIER_GET_ALL, { params });
  return response;
};

// GET SUPPLIER BY ID
// GET /{role}/suppliers/:id
export const fetchSupplierById = async (role, id) => {
  const response = await api.get(getRoutes(role).SUPPLIER_DETAILS(id));
  return response;
};

// CREATE A NEW SUPPLIER
// POST /{role}/suppliers
export const createSupplier = async (role, payload) => {
  const response = await api.post(getRoutes(role).SUPPLIER_CREATE, payload);
  return response;
};

// UPDATE AN EXISTING SUPPLIER
// PUT /{role}/suppliers/:id
export const updateSupplier = async (role, id, payload) => {
  const response = await api.put(getRoutes(role).SUPPLIER_UPDATE(id), payload);
  return response;
};

// DELETE A SUPPLIER
// DELETE /{role}/suppliers/:id
export const deleteSupplier = async (role, id) => {
  const response = await api.delete(getRoutes(role).SUPPLIER_DELETE(id));
  return response;
};