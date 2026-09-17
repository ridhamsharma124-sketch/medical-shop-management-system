import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchDashboardSummary as fetchDashboardSummaryService,
  fetchDashboardCharts as fetchDashboardChartsService,
} from '../auth/dashboardService';

export const fetchDashboardSummaryData = createAsyncThunk(
  'dashboard/summary',
  async ({ role }, { rejectWithValue }) => {
    try {
      const { data } = await fetchDashboardSummaryService(role);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load dashboard summary');
    }
  }
);

export const fetchDashboardChartsData = createAsyncThunk(
  'dashboard/charts',
  async ({ role }, { rejectWithValue }) => {
    try {
      const { data } = await fetchDashboardChartsService(role);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load dashboard charts');
    }
  }
);

const initialState = {
  summary: null,
  summaryLoading: false,
  summaryError: null,
  charts: null,
  chartsLoading: false,
  chartsError: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboard(state) {
      state.summary = null;
      state.summaryLoading = false;
      state.summaryError = null;
      state.charts = null;
      state.chartsLoading = false;
      state.chartsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummaryData.pending, (state) => {
        state.summaryLoading = true;
        state.summaryError = null;
      })
      .addCase(fetchDashboardSummaryData.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchDashboardSummaryData.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summary = null;
        state.summaryError = action.payload;
      })
      .addCase(fetchDashboardChartsData.pending, (state) => {
        state.chartsLoading = true;
        state.chartsError = null;
      })
      .addCase(fetchDashboardChartsData.fulfilled, (state, action) => {
        state.chartsLoading = false;
        state.charts = action.payload;
      })
      .addCase(fetchDashboardChartsData.rejected, (state, action) => {
        state.chartsLoading = false;
        state.charts = null;
        state.chartsError = action.payload;
      });
  },
});

export const { clearDashboard } = dashboardSlice.actions;

export default dashboardSlice.reducer;