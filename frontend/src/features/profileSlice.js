import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchProfile as fetchProfileService,
  updateProfile as updateProfileService,
  changePassword as changePasswordService,
} from '../auth/profileService';

export const fetchProfileData = createAsyncThunk(
  'profile/fetch',
  async (role, { rejectWithValue }) => {
    try {
      const { data } = await fetchProfileService(role);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load profile');
    }
  }
);

export const updateProfileData = createAsyncThunk(
  'profile/update',
  async ({ role, payload }, { rejectWithValue }) => {
    try {
      const { data } = await updateProfileService(role, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const changeUserPassword = createAsyncThunk(
  'profile/changePassword',
  async ({ role, payload }, { rejectWithValue }) => {
    try {
      const { data } = await changePasswordService(role, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change password');
    }
  }
);

const initialState = {
  user: null,
  loading: false,
  error: null,
  saving: false,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfileData.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data || null;
      })
      .addCase(fetchProfileData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProfileData.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateProfileData.fulfilled, (state, action) => {
        state.saving = false;
        state.user = action.payload.data || state.user;
      })
      .addCase(updateProfileData.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export default profileSlice.reducer;