import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import notificationService from "../../services/notificationService";
import { logout } from "./authSlice";

const normalizeError = (error) => {
  const details = error.response?.data?.details;

  if (Array.isArray(details) && details.length) {
    return details.map((detail) => detail.message).join(" ");
  }

  return error.response?.data?.message || error.message || "Something went wrong.";
};

export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      return await notificationService.getUnreadCount();
    } catch (error) {
      return rejectWithValue(normalizeError(error));
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (params, { rejectWithValue }) => {
    try {
      return await notificationService.getNotifications(params);
    } catch (error) {
      return rejectWithValue(normalizeError(error));
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      return await notificationService.markAsRead(notificationId);
    } catch (error) {
      return rejectWithValue(normalizeError(error));
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      return await notificationService.markAllAsRead();
    } catch (error) {
      return rejectWithValue(normalizeError(error));
    }
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    unreadCount: 0,
    notifications: [],
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    decrementUnreadCount: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    resetNotificationState: (state) => {
      state.unreadCount = 0;
      state.notifications = [];
      state.pagination = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Unread Count
      .addCase(fetchUnreadCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.loading = false;
        state.unreadCount = action.payload;
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Mark As Read
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(
          (n) => n._id === action.payload._id
        );
        if (index !== -1) {
          state.notifications[index].read = true;
        }
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      })

      // Mark All As Read
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({
          ...n,
          read: true,
        }));
        state.unreadCount = 0;
      })

      // Security Reset on Logout
      .addCase(logout, (state) => {
        state.unreadCount = 0;
        state.notifications = [];
        state.pagination = null;
        state.loading = false;
        state.error = null;
      });
  },
});

export const {
  incrementUnreadCount,
  decrementUnreadCount,
  resetNotificationState,
} = notificationSlice.actions;

export default notificationSlice.reducer;
