import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchPurchaseOrders as fetchPurchaseOrdersService,
  fetchPurchaseOrderById as fetchPurchaseOrderByIdService,
  createPurchaseOrder as createPurchaseOrderService,
  fetchSupplierPurchases as fetchSupplierPurchasesService,
  fetchPurchaseItems as fetchPurchaseItemsService,
} from '../auth/purchaseService';

export const fetchPurchaseOrdersList = createAsyncThunk(
  'purchases/fetchAll',
  async ({ role, params }, { rejectWithValue }) => {
    try {
      const { data } = await fetchPurchaseOrdersService(role, params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load purchase orders');
    }
  }
);

export const fetchPurchaseOrderDetail = createAsyncThunk(
  'purchases/fetchById',
  async ({ role, id }, { rejectWithValue }) => {
    try {
      const { data } = await fetchPurchaseOrderByIdService(role, id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load purchase order');
    }
  }
);

export const createNewPurchaseOrder = createAsyncThunk(
  'purchases/create',
  async ({ role, payload }, { rejectWithValue }) => {
    try {
      const { data } = await createPurchaseOrderService(role, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create purchase order');
    }
  }
);

export const fetchSupplierPurchasesList = createAsyncThunk(
  'purchases/supplierPurchases',
  async ({ role, supplierId, params }, { rejectWithValue }) => {
    try {
      const { data } = await fetchSupplierPurchasesService(role, supplierId, params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load supplier purchases');
    }
  }
);

export const fetchAllPurchaseItems = createAsyncThunk(
  'purchases/purchaseItems',
  async ({ role, params }, { rejectWithValue }) => {
    try {
      const { data } = await fetchPurchaseItemsService(role, params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load purchase items');
    }
  }
);

const initialState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
  detail: null,
  detailLoading: false,
  detailError: null,
  creating: false,
  supplierPurchases: [],
  supplierPurchasesLoading: false,
  supplierPurchasesError: null,
  purchaseItems: [],
  purchaseItemsLoading: false,
  purchaseItemsError: null,
};

const purchaseSlice = createSlice({
  name: 'purchases',
  initialState,
  reducers: {
    clearPurchaseDetail(state) {
      state.detail = null;
      state.detailLoading = false;
      state.detailError = null;
    },
    clearSupplierPurchases(state) {
      state.supplierPurchases = [];
      state.supplierPurchasesLoading = false;
      state.supplierPurchasesError = null;
    },
    clearPurchaseItems(state) {
      state.purchaseItems = [];
      state.purchaseItemsLoading = false;
      state.purchaseItemsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseOrdersList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseOrdersList.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.total || 0;
      })
      .addCase(fetchPurchaseOrdersList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPurchaseOrderDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchPurchaseOrderDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload.data || null;
      })
      .addCase(fetchPurchaseOrderDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      })
      .addCase(createNewPurchaseOrder.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createNewPurchaseOrder.fulfilled, (state, action) => {
        state.creating = false;
        const order = action.payload.data?.order;
        if (order) state.items.unshift(order);
        state.total = (state.total || 0) + 1;
      })
      .addCase(createNewPurchaseOrder.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      .addCase(fetchSupplierPurchasesList.pending, (state) => {
        state.supplierPurchasesLoading = true;
        state.supplierPurchasesError = null;
      })
      .addCase(fetchSupplierPurchasesList.fulfilled, (state, action) => {
        state.supplierPurchasesLoading = false;
        state.supplierPurchases = action.payload.data || [];
      })
      .addCase(fetchSupplierPurchasesList.rejected, (state, action) => {
        state.supplierPurchasesLoading = false;
        state.supplierPurchasesError = action.payload;
      })
      .addCase(fetchAllPurchaseItems.pending, (state) => {
        state.purchaseItemsLoading = true;
        state.purchaseItemsError = null;
      })
      .addCase(fetchAllPurchaseItems.fulfilled, (state, action) => {
        state.purchaseItemsLoading = false;
        state.purchaseItems = action.payload.data || [];
      })
      .addCase(fetchAllPurchaseItems.rejected, (state, action) => {
        state.purchaseItemsLoading = false;
        state.purchaseItemsError = action.payload;
      });
  },
});

export const { clearPurchaseDetail, clearSupplierPurchases, clearPurchaseItems } = purchaseSlice.actions;
export default purchaseSlice.reducer;