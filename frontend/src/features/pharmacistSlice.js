import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchPharmacists as fetchPharmacistsService,
  fetchPharmacistById as fetchPharmacistByIdService,
  createPharmacist as createPharmacistService,
  updatePharmacist as updatePharmacistService,
  deletePharmacist as deletePharmacistService,
} from '../auth/pharmacistService';

export const fetchAllPharmacists = createAsyncThunk(
  'pharmacists/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await fetchPharmacistsService(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load pharmacists');
    }
  }
);

export const fetchPharmacistDetail = createAsyncThunk(
  'pharmacists/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await fetchPharmacistByIdService(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load pharmacist details');
    }
  }
);

export const createNewPharmacist = createAsyncThunk(
  'pharmacists/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await createPharmacistService(payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create pharmacist');
    }
  }
);

export const updateExistingPharmacist = createAsyncThunk(
  'pharmacists/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await updatePharmacistService(id, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update pharmacist');
    }
  }
);

export const deleteExistingPharmacist = createAsyncThunk(
  'pharmacists/delete',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await deletePharmacistService(id);
      return { ...data, deletedId: id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete pharmacist');
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

const pharmacistSlice = createSlice({
  name: 'pharmacists',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllPharmacists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPharmacists.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.total || 0;
      })
      .addCase(fetchAllPharmacists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createNewPharmacist.fulfilled, (state, action) => {
        const newPharmacist = action.payload.data;
        if (newPharmacist) {
          state.items.unshift({ ...newPharmacist, _id: newPharmacist._id || newPharmacist.id });
          state.total = (state.total || 0) + 1;
        }
      })
      .addCase(updateExistingPharmacist.fulfilled, (state, action) => {
        const updated = action.payload.data;
        if (updated) {
          const id = updated._id || updated.id;
          const idx = state.items.findIndex((p) => p._id === id);
          if (idx !== -1) state.items[idx] = { ...updated, _id: id };
        }
      })
      .addCase(deleteExistingPharmacist.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p._id !== action.payload.deletedId);
        state.total = Math.max((state.total || 0) - 1, 0);
      })
      .addCase(fetchPharmacistDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchPharmacistDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload.data || null;
      })
      .addCase(fetchPharmacistDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      });
  },
});

export default pharmacistSlice.reducer;
