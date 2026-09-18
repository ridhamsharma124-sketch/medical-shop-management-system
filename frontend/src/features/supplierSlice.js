import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchSuppliers as fetchSuppliersService,
  fetchSupplierById as fetchSupplierByIdService,
  createSupplier as createSupplierService,
  updateSupplier as updateSupplierService,
  deleteSupplier as deleteSupplierService,
} from '../auth/supplierService';

export const fetchSuppliersList = createAsyncThunk(
  'suppliers/fetchAll',
  async ({ role, params }, { rejectWithValue }) => {
    try {
      const { data } = await fetchSuppliersService(role, params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load suppliers');
    }
  }
);

export const fetchSupplierDetail = createAsyncThunk(
  'suppliers/fetchById',
  async ({ role, id }, { rejectWithValue }) => {
    try {
      const { data } = await fetchSupplierByIdService(role, id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load supplier');
    }
  }
);

export const createNewSupplier = createAsyncThunk(
  'suppliers/create',
  async ({ role, payload }, { rejectWithValue }) => {
    try {
      const { data } = await createSupplierService(role, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create supplier');
    }
  }
);

export const updateExistingSupplier = createAsyncThunk(
  'suppliers/update',
  async ({ role, id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await updateSupplierService(role, id, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update supplier');
    }
  }
);

export const deleteExistingSupplier = createAsyncThunk(
  'suppliers/delete',
  async ({ role, id }, { rejectWithValue }) => {
    try {
      const { data } = await deleteSupplierService(role, id);
      return { ...data, deletedId: id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete supplier');
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
};

const supplierSlice = createSlice({
  name: 'suppliers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliersList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliersList.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.total || 0;
      })
      .addCase(fetchSuppliersList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createNewSupplier.fulfilled, (state, action) => {
        const newSupplier = action.payload.data;
        if (newSupplier) state.items.unshift(newSupplier);
        state.total = (state.total || 0) + 1;
      })
      .addCase(updateExistingSupplier.fulfilled, (state, action) => {
        const updated = action.payload.data;
        if (updated) {
          const idx = state.items.findIndex((s) => s._id === updated._id);
          if (idx !== -1) state.items[idx] = updated;
        }
      })
      .addCase(deleteExistingSupplier.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s._id !== action.payload.deletedId);
        state.total = Math.max((state.total || 0) - 1, 0);
      })
      .addCase(fetchSupplierDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchSupplierDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload.data || null;
      })
      .addCase(fetchSupplierDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      });
  },
});

export default supplierSlice.reducer;