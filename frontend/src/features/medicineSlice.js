import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchMedicines as fetchMedicinesService,
  fetchMedicineById as fetchMedicineByIdService,
  searchMedicines as searchMedicinesService,
  createMedicine as createMedicineService,
  updateMedicine as updateMedicineService,
  deleteMedicine as deleteMedicineService,
} from '../auth/medicineService';

export const fetchMedicinesList = createAsyncThunk(
  'medicines/fetchAll',
  async ({ role, params }, { rejectWithValue }) => {
    try {
      const { data } = await fetchMedicinesService(role, params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load medicines');
    }
  }
);

export const searchMedicinesList = createAsyncThunk(
  'medicines/search',
  async ({ role, params }, { rejectWithValue }) => {
    try {
      const { data } = await searchMedicinesService(role, params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search medicines');
    }
  }
);

export const fetchMedicineDetail = createAsyncThunk(
  'medicines/fetchById',
  async ({ role, id }, { rejectWithValue }) => {
    try {
      const { data } = await fetchMedicineByIdService(role, id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load medicine');
    }
  }
);

export const createNewMedicine = createAsyncThunk(
  'medicines/create',
  async ({ role, payload }, { rejectWithValue }) => {
    try {
      const { data } = await createMedicineService(role, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create medicine');
    }
  }
);

export const updateExistingMedicine = createAsyncThunk(
  'medicines/update',
  async ({ role, id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await updateMedicineService(role, id, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update medicine');
    }
  }
);

export const deleteExistingMedicine = createAsyncThunk(
  'medicines/delete',
  async ({ role, id }, { rejectWithValue }) => {
    try {
      const { data } = await deleteMedicineService(role, id);
      return { ...data, deletedId: id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete medicine');
    }
  }
);

const initialState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
  viewItem: null,
  viewLoading: false,
  viewError: null,
  searchResults: [],
  searchLoading: false,
};

const medicineSlice = createSlice({
  name: 'medicines',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMedicinesList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMedicinesList.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.total || state.items.length;
      })
      .addCase(fetchMedicinesList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(searchMedicinesList.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(searchMedicinesList.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.data || [];
        state.total = action.payload.total || state.searchResults.length;
      })
      .addCase(searchMedicinesList.rejected, (state) => {
        state.searchLoading = false;
      })
      .addCase(fetchMedicineDetail.pending, (state) => {
        state.viewLoading = true;
        state.viewError = null;
      })
      .addCase(fetchMedicineDetail.fulfilled, (state, action) => {
        state.viewLoading = false;
        state.viewItem = action.payload.data;
      })
      .addCase(fetchMedicineDetail.rejected, (state, action) => {
        state.viewLoading = false;
        state.viewError = action.payload;
      })
      .addCase(createNewMedicine.fulfilled, (state, action) => {
        const newMedicine = action.payload.data;
        if (newMedicine) state.items.unshift(newMedicine);
        state.total = (state.total || 0) + 1;
      })
      .addCase(updateExistingMedicine.fulfilled, (state, action) => {
        const updated = action.payload.data;
        if (updated) {
          const idx = state.items.findIndex((m) => m._id === updated._id);
          if (idx !== -1) state.items[idx] = updated;
        }
      })
      .addCase(deleteExistingMedicine.fulfilled, (state, action) => {
        state.items = state.items.filter((m) => m._id !== action.payload.deletedId);
        state.total = Math.max((state.total || 0) - 1, 0);
      });
  },
});

export default medicineSlice.reducer;
