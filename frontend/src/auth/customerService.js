// -----------------------------------------------------------------------------
// Customer Service —
// CRUD operations for customers (admin + pharmacist roles)
// -----------------------------------------------------------------------------

import api from './api';
import { customerRoutes } from './authRoutes';

// Pick the route set based on the logged-in role
// admin     => customerRoutes.ADMIN
// pharmacist => customerRoutes.PHARMACIST
const getRoutes = (role) =>
  role === 'admin' ? customerRoutes.ADMIN : customerRoutes.PHARMACIST;

// GET ALL CUSTOMERS (with filters / pagination)
// GET /{role}/customers?search=&page=&limit=
export const fetchCustomers = async (role, params) => {
  const response = await api.get(getRoutes(role).CUSTOMER_GET_ALL, { params });
  return response;
};

// GET CUSTOMER BY ID
// GET /{role}/customers/:id
export const fetchCustomerById = async (role, id) => {
  const response = await api.get(getRoutes(role).CUSTOMER_DETAILS(id));
  return response;
};

// CREATE A NEW CUSTOMER
// POST /{role}/customers
export const createCustomer = async (role, payload) => {
  const response = await api.post(getRoutes(role).CUSTOMER_CREATE, payload);
  return response;
};

// UPDATE AN EXISTING CUSTOMER
// PUT /{role}/customers/:id
export const updateCustomer = async (role, id, payload) => {
  const response = await api.put(getRoutes(role).CUSTOMER_UPDATE(id), payload);
  return response;
};

// DELETE A CUSTOMER
// DELETE /{role}/customers/:id
export const deleteCustomer = async (role, id) => {
  const response = await api.delete(getRoutes(role).CUSTOMER_DELETE(id));
  return response;
};