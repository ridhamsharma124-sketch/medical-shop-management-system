import api from '../auth/api';
import { medicineRoutes } from './medicineRoutes';

export const fetchMedicines = (params) => api.get(medicineRoutes.LIST, { params });

export const createMedicine = (payload) => api.post(medicineRoutes.LIST, payload);

export const updateMedicine = (id, payload) => api.put(medicineRoutes.SINGLE(id), payload);

export const deleteMedicine = (id) => api.delete(medicineRoutes.SINGLE(id));