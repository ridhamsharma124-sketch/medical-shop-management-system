import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  register as registerRequest,
  verifyOtp as verifyOtpRequest,
  resendOtp as resendOtpRequest,
  login as loginRequest,
  logout as logoutRequest,
} from '../auth/authService';

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

const clearAuthStorage = () => {
  localStorage.removeItem('user');
};

export const register = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await registerRequest(payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await loginRequest(payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await verifyOtpRequest(payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'OTP verification failed');
    }
  }
);

export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await resendOtpRequest(payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resend OTP');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await logoutRequest();
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Logout failed');
  } finally {
    clearAuthStorage();
  }
});

const initialState = {
  user: getStoredUser(),
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.status = 'idle';
        state.error = null;
      });
  },
});

export const { clearError } = authSlice.actions;

export default authSlice.reducer;