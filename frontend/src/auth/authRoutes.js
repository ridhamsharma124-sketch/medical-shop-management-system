export const authRoutes = {
  REGISTER: '/auth/register',
  VERIFY_OTP: '/auth/verify-otp',
  RESEND_OTP: '/auth/resend-otp',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
};

export const medicineRoutes = {
  ADMIN: {
    MEDICINE_GET_ALL: '/admin/medicines',
    MEDICINE_CREATE: '/admin/medicines',
    MEDICINE_DETAILS: (id) => `/admin/medicines/${id}`,
    MEDICINE_UPDATE: (id) => `/admin/medicines/${id}`,
    MEDICINE_DELETE: (id) => `/admin/medicines/${id}`,
    MEDICINE_SEARCH: '/admin/medicines/search',
  },
  PHARMACIST: {
    MEDICINE_GET_ALL: '/pharmacist/medicines',
    MEDICINE_CREATE: '/pharmacist/medicines',
    MEDICINE_DETAILS: (id) => `/pharmacist/medicines/${id}`,
    MEDICINE_UPDATE: (id) => `/pharmacist/medicines/${id}`,
    MEDICINE_DELETE: (id) => `/pharmacist/medicines/${id}`,
    MEDICINE_SEARCH: '/pharmacist/medicines/search',
  },
};

export const pharmacistRoutes = {
  PHARMACIST_GET_ALL: '/admin/pharmacists',
  PHARMACIST_CREATE: '/admin/pharmacists',
  PHARMACIST_DETAILS: (id) => `/admin/pharmacists/${id}`,
  PHARMACIST_UPDATE: (id) => `/admin/pharmacists/${id}`,
  PHARMACIST_DELETE: (id) => `/admin/pharmacists/${id}`,
};

export const supplierRoutes = {
  ADMIN: {
    SUPPLIER_GET_ALL: '/admin/suppliers',
    SUPPLIER_CREATE: '/admin/suppliers',
    SUPPLIER_DETAILS: (id) => `/admin/suppliers/${id}`,
    SUPPLIER_UPDATE: (id) => `/admin/suppliers/${id}`,
    SUPPLIER_DELETE: (id) => `/admin/suppliers/${id}`,
  },
  PHARMACIST: {
    SUPPLIER_GET_ALL: '/pharmacist/suppliers',
    SUPPLIER_CREATE: '/pharmacist/suppliers',
    SUPPLIER_DETAILS: (id) => `/pharmacist/suppliers/${id}`,
    SUPPLIER_UPDATE: (id) => `/pharmacist/suppliers/${id}`,
    SUPPLIER_DELETE: (id) => `/pharmacist/suppliers/${id}`,
  },
};

export const inventoryRoutes = {
  ADMIN: {
    STOCK_HISTORY: '/admin/inventory/stock-history',
    STOCK_ADJUST: (id) => `/admin/inventory/${id}/stock`,
    STOCK_STATUS: '/admin/inventory/status',
  },
  PHARMACIST: {
    STOCK_HISTORY: '/pharmacist/inventory/stock-history',
    STOCK_ADJUST: (id) => `/pharmacist/inventory/${id}/stock`,
    STOCK_STATUS: '/pharmacist/inventory/status',
  },
};

export const profileRoutes = {
  ADMIN: {
    PROFILE_GET: '/admin/profile',
    PROFILE_UPDATE: '/admin/profile',
    PROFILE_CHANGE_PASSWORD: '/admin/profile/change-password',
  },
  PHARMACIST: {
    PROFILE_GET: '/pharmacist/profile',
    PROFILE_UPDATE: '/pharmacist/profile',
    PROFILE_CHANGE_PASSWORD: '/pharmacist/profile/change-password',
  },
};

export const customerRoutes = {
  ADMIN: {
    CUSTOMER_GET_ALL: '/admin/customers',
    CUSTOMER_CREATE: '/admin/customers',
    CUSTOMER_DETAILS: (id) => `/admin/customers/${id}`,
    CUSTOMER_UPDATE: (id) => `/admin/customers/${id}`,
    CUSTOMER_DELETE: (id) => `/admin/customers/${id}`,
  },
  PHARMACIST: {
    CUSTOMER_GET_ALL: '/pharmacist/customers',
    CUSTOMER_CREATE: '/pharmacist/customers',
    CUSTOMER_DETAILS: (id) => `/pharmacist/customers/${id}`,
    CUSTOMER_UPDATE: (id) => `/pharmacist/customers/${id}`,
    CUSTOMER_DELETE: (id) => `/pharmacist/customers/${id}`,
  },
};

export const purchaseRoutes = {
  ADMIN: {
    PURCHASE_CREATE: '/admin/purchase-orders',
    PURCHASE_GET_ALL: '/admin/purchase-orders',
    PURCHASE_DETAILS: (id) => `/admin/purchase-orders/${id}`,
    SUPPLIER_PURCHASES: (supplierId) => `/admin/suppliers/${supplierId}/purchases`,
    PURCHASE_ITEMS: '/admin/purchase-items',
  },
  PHARMACIST: {
    PURCHASE_CREATE: '/pharmacist/purchase-orders',
    PURCHASE_GET_ALL: '/pharmacist/purchase-orders',
    PURCHASE_DETAILS: (id) => `/pharmacist/purchase-orders/${id}`,
    SUPPLIER_PURCHASES: (supplierId) => `/pharmacist/suppliers/${supplierId}/purchases`,
    PURCHASE_ITEMS: '/pharmacist/purchase-items',
  },
};