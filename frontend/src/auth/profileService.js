// -----------------------------------------------------------------------------
// Profile Service —
// View, update profile and change password (admin + pharmacist roles)
// -----------------------------------------------------------------------------

import api from './api';
import { profileRoutes } from './authRoutes';

// Pick the route set based on the logged-in role
// admin     => profileRoutes.ADMIN
// pharmacist => profileRoutes.PHARMACIST
const getRoutes = (role) =>
  role === 'admin' ? profileRoutes.ADMIN : profileRoutes.PHARMACIST;

// GET LOGGED-IN USER PROFILE
// GET /{role}/profile
export const fetchProfile = async (role) => {
  const response = await api.get(getRoutes(role).PROFILE_GET);
  return response;
};

// UPDATE LOGGED-IN USER PROFILE
// PUT /{role}/profile
export const updateProfile = async (role, payload) => {
  const response = await api.put(getRoutes(role).PROFILE_UPDATE, payload);
  return response;
};

// CHANGE LOGGED-IN USER PASSWORD
// PUT /{role}/profile/change-password
export const changePassword = async (role, payload) => {
  const response = await api.put(getRoutes(role).PROFILE_CHANGE_PASSWORD, payload);
  return response;
};