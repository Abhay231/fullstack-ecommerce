import { createSlice } from '@reduxjs/toolkit';

const toastSlice = createSlice({
  name: 'toast',
  initialState: {
    toasts: []
  },
  reducers: {
    addToast: (state, action) => {
      const toast = {
        id: Date.now() + Math.random(),
        type: action.payload.type || 'info',
        title: action.payload.title,
        message: action.payload.message,
        duration: action.payload.duration !== undefined ? action.payload.duration : 3000,
        timestamp: Date.now()
      };
      state.toasts.push(toast);
      
      // Limit to maximum 5 toasts
      if (state.toasts.length > 5) {
        state.toasts.shift();
      }
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    clearAllToasts: (state) => {
      state.toasts = [];
    }
  }
});

export const { addToast, removeToast, clearAllToasts } = toastSlice.actions;

// Helper functions for different toast types
export const showSuccessToast = (message, title = null, duration = 3000) => (dispatch) => {
  dispatch(addToast({ type: 'success', title, message, duration }));
};

export const showErrorToast = (message, title = null, duration = 5000) => (dispatch) => {
  dispatch(addToast({ type: 'error', title, message, duration }));
};

export const showWarningToast = (message, title = null, duration = 4000) => (dispatch) => {
  dispatch(addToast({ type: 'warning', title, message, duration }));
};

export const showInfoToast = (message, title = null, duration = 3000) => (dispatch) => {
  dispatch(addToast({ type: 'info', title, message, duration }));
};

export default toastSlice.reducer;
