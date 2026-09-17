import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchNotifications } from '../auth/notificationService';

export const fetchNotificationsList = createAsyncThunk(
  'notifications/fetchAll',
  async ({ role, params, append = false }, { rejectWithValue }) => {
    try {
      const { data } = await fetchNotifications(role, params);
      return { data, append };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load notifications');
    }
  }
);

const initialState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications(state) {
      state.items = [];
      state.total = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationsList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsList.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload?.data || {};
        const list = Array.isArray(payload.data) ? payload.data : [];
        state.items = action.payload.append ? [...state.items, ...list] : list;
        state.total = payload.total ?? list.length;
      })
      .addCase(fetchNotificationsList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearNotifications } = notificationSlice.actions;

export default notificationSlice.reducer;