import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  createSalesBill as createSalesBillService,
  fetchSalesBills as fetchSalesBillsService,
  fetchSalesBillById as fetchSalesBillByIdService,
} from '../auth/salesService';

export const createNewSalesBill = createAsyncThunk(
  'sales/create',
  async ({ role, payload }, { rejectWithValue }) => {
    try {
      const { data } = await createSalesBillService(role, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create bill');
    }
  }
);

export const fetchSalesBillsList = createAsyncThunk(
  'sales/fetchAll',
  async ({ role, params }, { rejectWithValue }) => {
    try {
      const { data } = await fetchSalesBillsService(role, params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load sales bills');
    }
  }
);

export const fetchSalesBillDetail = createAsyncThunk(
  'sales/fetchById',
  async ({ role, id }, { rejectWithValue }) => {
    try {
      const { data } = await fetchSalesBillByIdService(role, id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load bill detail');
    }
  }
);

const initialState = {
  items: [],
  total: 0,
  loading: false,
  creating: false,
  error: null,
  detail: null,
  detailLoading: false,
  detailError: null,
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    clearSalesDetail(state) {
      state.detail = null;
      state.detailError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesBillsList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesBillsList.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.total || 0;
      })
      .addCase(fetchSalesBillsList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createNewSalesBill.pending, (state) => {
        state.creating = true;
      })
      .addCase(createNewSalesBill.fulfilled, (state, action) => {
        state.creating = false;
        const newBill = action.payload.data?.bill;
        if (newBill) state.items.unshift(newBill);
        state.total = (state.total || 0) + 1;
      })
      .addCase(createNewSalesBill.rejected, (state) => {
        state.creating = false;
      })
      .addCase(fetchSalesBillDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchSalesBillDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload.data || null;
      })
      .addCase(fetchSalesBillDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      });
  },
});

export const { clearSalesDetail } = salesSlice.actions;

export default salesSlice.reducer;