import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchCustomers as fetchCustomersService, createCustomer as createCustomerService, updateCustomer as updateCustomerService, deleteCustomer as deleteCustomerService } from '../auth/customerService';
import { fetchCustomerById as fetchCustomerByIdService } from '../auth/customerService';

export const fetchCustomersList = createAsyncThunk(
  'customers/fetchAll',
  async ({ role, params }, { rejectWithValue }) => {
    try {
      const { data } = await fetchCustomersService(role, params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load customers');
    }
  }
);

export const createNewCustomer = createAsyncThunk(
  'customers/create',
  async ({ role, payload }, { rejectWithValue }) => {
    try {
      const { data } = await createCustomerService(role, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create customer');
    }
  }
);

export const updateExistingCustomer = createAsyncThunk(
  'customers/update',
  async ({ role, id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await updateCustomerService(role, id, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update customer');
    }
  }
);

export const deleteExistingCustomer = createAsyncThunk(
  'customers/delete',
  async ({ role, id }, { rejectWithValue }) => {
    try {
      const { data } = await deleteCustomerService(role, id);
      return { ...data, deletedId: id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete customer');
    }
  }
);

export const fetchCustomerDetails = createAsyncThunk(
  'customers/fetchById',
  async ({ role, id }, { rejectWithValue }) => {
    try {
      const { data } = await fetchCustomerByIdService(role, id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load customer details');
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

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomersList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomersList.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.total || 0;
      })
      .addCase(fetchCustomersList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createNewCustomer.fulfilled, (state, action) => {
        const newCustomer = action.payload.data;
        if (newCustomer) state.items.unshift(newCustomer);
        state.total = (state.total || 0) + 1;
      })
      .addCase(updateExistingCustomer.fulfilled, (state, action) => {
        const updated = action.payload.data;
        if (updated) {
          const idx = state.items.findIndex((c) => c._id === updated._id);
          if (idx !== -1) state.items[idx] = updated;
        }
      })
      .addCase(deleteExistingCustomer.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c._id !== action.payload.deletedId);
        state.total = Math.max((state.total || 0) - 1, 0);
      })
      .addCase(fetchCustomerDetails.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchCustomerDetails.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload.data || null;
      })
      .addCase(fetchCustomerDetails.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      });
  },
});

export default customerSlice.reducer;