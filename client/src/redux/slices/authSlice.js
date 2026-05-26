import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import authService from "../../services/authService";
import { clearStoredAuth, getStoredAuth, setStoredAuth } from "../../utils/storage";

const storedAuth = getStoredAuth();

const normalizeAuthError = (error) => {
  const details = error.response?.data?.details;

  if (Array.isArray(details) && details.length) {
    return details.map((detail) => detail.message).join(" ");
  }

  return error.response?.data?.message || error.message || "Something went wrong.";
};

export const registerUser = createAsyncThunk("auth/registerUser", async (payload, { rejectWithValue }) => {
  try {
    const response = await authService.register(payload);
    setStoredAuth(response);
    return response;
  } catch (error) {
    return rejectWithValue(normalizeAuthError(error));
  }
});

export const loginUser = createAsyncThunk("auth/loginUser", async (payload, { rejectWithValue }) => {
  try {
    const response = await authService.login(payload);
    setStoredAuth(response);
    return response;
  } catch (error) {
    return rejectWithValue(normalizeAuthError(error));
  }
});

export const loadCurrentUser = createAsyncThunk("auth/loadCurrentUser", async (_, { rejectWithValue }) => {
  try {
    const response = await authService.getProfile();
    return response.user;
  } catch (error) {
    clearStoredAuth();
    return rejectWithValue(normalizeAuthError(error));
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: storedAuth.user,
    token: storedAuth.token,
    loading: false,
    error: "",
  },
  reducers: {
    logout: (state) => {
      clearStoredAuth();
      state.user = null;
      state.token = "";
      state.error = "";
      state.loading = false;
    },
    clearAuthError: (state) => {
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(loadCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(loadCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;

        if (state.token) {
          setStoredAuth({
            token: state.token,
            user: action.payload,
          });
        }
      })
      .addCase(loadCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = "";
        state.error = action.payload;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
