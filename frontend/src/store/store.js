import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import medicineReducer from '../features/medicineSlice';
import pharmacistReducer from '../features/pharmacistSlice';
import supplierReducer from '../features/supplierSlice';
import inventoryReducer from '../features/inventorySlice';
import profileReducer from '../features/profileSlice';
import customerReducer from '../features/customerSlice';
import purchaseReducer from '../features/purchaseSlice';
import salesReducer from '../features/salesSlice';
import reportReducer from '../features/reportSlice';
import dashboardReducer from '../features/dashboardSlice';
import notificationReducer from '../features/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    medicines: medicineReducer,
    pharmacists: pharmacistReducer,
    suppliers: supplierReducer,
    inventory: inventoryReducer,
    profile: profileReducer,
    customers: customerReducer,
    purchases: purchaseReducer,
    sales: salesReducer,
    reports: reportReducer,
    dashboard: dashboardReducer,
    notifications: notificationReducer,
  },
});