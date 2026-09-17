import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchSalesReport as fetchSalesReportService,
  fetchProfitReport as fetchProfitReportService,
  fetchProfitReportByPharmacist as fetchProfitReportByPharmacistService,
  fetchPurchaseReport as fetchPurchaseReportService,
  fetchBestSellingReport as fetchBestSellingReportService,
} from '../auth/reportService';

export const fetchSalesReportData = createAsyncThunk(
  'reports/sales',
  async ({ role, params }, { rejectWithValue }) => {
    try {
      const { data } = await fetchSalesReportService(role, params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load sales report');
    }
  }
);

export const fetchProfitReportData = createAsyncThunk(
  'reports/profit',
  async ({ role, params }, { rejectWithValue }) => {
    try {
      const { data } = await fetchProfitReportService(role, params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load profit report');
    }
  }
);

export const fetchProfitReportByPharmacistData = createAsyncThunk(
  'reports/profitByPharmacist',
  async ({ role, params }, { rejectWithValue }) => {
    try {
      const { data } = await fetchProfitReportByPharmacistService(role, params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load profit report');
    }
  }
);

export const fetchPurchaseReportData = createAsyncThunk(
  'reports/purchase',
  async ({ role, params }, { rejectWithValue }) => {
    try {
      const { data } = await fetchPurchaseReportService(role, params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load purchase report');
    }
  }
);

export const fetchBestSellingReportData = createAsyncThunk(
  'reports/bestSelling',
  async ({ role, params }, { rejectWithValue }) => {
    try {
      const { data } = await fetchBestSellingReportService(role, params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load best selling report');
    }
  }
);

const initialState = {
  sales: null,
  salesLoading: false,
  salesError: null,
  profit: null,
  profitLoading: false,
  profitError: null,
  profitByPharmacist: null,
  profitByPharmacistLoading: false,
  profitByPharmacistError: null,
  purchase: null,
  purchaseLoading: false,
  purchaseError: null,
  bestSelling: null,
  bestSellingLoading: false,
  bestSellingError: null,
};

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesReportData.pending, (state) => {
        state.salesLoading = true;
        state.salesError = null;
      })
      .addCase(fetchSalesReportData.fulfilled, (state, action) => {
        state.salesLoading = false;
        state.sales = action.payload;
      })
      .addCase(fetchSalesReportData.rejected, (state, action) => {
        state.salesLoading = false;
        state.salesError = action.payload;
      })
      .addCase(fetchProfitReportData.pending, (state) => {
        state.profitLoading = true;
        state.profitError = null;
      })
      .addCase(fetchProfitReportData.fulfilled, (state, action) => {
        state.profitLoading = false;
        state.profit = action.payload;
      })
      .addCase(fetchProfitReportData.rejected, (state, action) => {
        state.profitLoading = false;
        state.profitError = action.payload;
      })
      .addCase(fetchProfitReportByPharmacistData.pending, (state) => {
        state.profitByPharmacistLoading = true;
        state.profitByPharmacistError = null;
      })
      .addCase(fetchProfitReportByPharmacistData.fulfilled, (state, action) => {
        state.profitByPharmacistLoading = false;
        state.profitByPharmacist = action.payload;
      })
      .addCase(fetchProfitReportByPharmacistData.rejected, (state, action) => {
        state.profitByPharmacistLoading = false;
        state.profitByPharmacistError = action.payload;
      })
      .addCase(fetchPurchaseReportData.pending, (state) => {
        state.purchaseLoading = true;
        state.purchaseError = null;
      })
      .addCase(fetchPurchaseReportData.fulfilled, (state, action) => {
        state.purchaseLoading = false;
        state.purchase = action.payload;
      })
      .addCase(fetchPurchaseReportData.rejected, (state, action) => {
        state.purchaseLoading = false;
        state.purchaseError = action.payload;
      })
      .addCase(fetchBestSellingReportData.pending, (state) => {
        state.bestSellingLoading = true;
        state.bestSellingError = null;
      })
      .addCase(fetchBestSellingReportData.fulfilled, (state, action) => {
        state.bestSellingLoading = false;
        state.bestSelling = action.payload;
      })
      .addCase(fetchBestSellingReportData.rejected, (state, action) => {
        state.bestSellingLoading = false;
        state.bestSellingError = action.payload;
      });
  },
});

export default reportSlice.reducer;