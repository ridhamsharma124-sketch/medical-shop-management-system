import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  adjustStock as adjustStockService,
  fetchStockHistory as fetchStockHistoryService,
  fetchMedicinesByStatus as fetchMedicinesByStatusService,
} from '../auth/inventoryService';

export const adjustStock = createAsyncThunk(
  'inventory/adjustStock',
  async ({ role, id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await adjustStockService(role, id, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to adjust stock');
    }
  }
);

export const fetchStockHistory = createAsyncThunk(
  'inventory/stockHistory',
  async ({ role, params }, { rejectWithValue }) => {
    try {
      const { data } = await fetchStockHistoryService(role, params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load stock history');
    }
  }
);

export const fetchMedicinesByStatus = createAsyncThunk(
  'inventory/medicinesByStatus',
  async ({ role, params }, { rejectWithValue }) => {
    try {
      const { data } = await fetchMedicinesByStatusService(role, params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load medicine status');
    }
  }
);

const initialState = {
  statusItems: [],
  statusLoading: false,
  statusError: null,
  historyLogs: [],
  historyLoading: false,
  historyError: null,
  adjusting: false,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMedicinesByStatus.pending, (state) => {
        state.statusLoading = true;
        state.statusError = null;
      })
      .addCase(fetchMedicinesByStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        state.statusItems = action.payload.data || [];
      })
      .addCase(fetchMedicinesByStatus.rejected, (state, action) => {
        state.statusLoading = false;
        state.statusError = action.payload;
      })
      .addCase(fetchStockHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(fetchStockHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.historyLogs = action.payload.data || [];
      })
      .addCase(fetchStockHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload;
      })
      .addCase(adjustStock.pending, (state) => {
        state.adjusting = true;
      })
      .addCase(adjustStock.fulfilled, (state) => {
        state.adjusting = false;
      })
      .addCase(adjustStock.rejected, (state) => {
        state.adjusting = false;
      });
  },
});

export default inventorySlice.reducer;