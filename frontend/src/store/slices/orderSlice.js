import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create order';
      return rejectWithValue(message);
    }
  }
);

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/orders?${queryString}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch orders';
      return rejectWithValue(message);
    }
  }
);

export const fetchOrder = createAsyncThunk(
  'orders/fetchOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/orders/details/${orderId}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch order';
      return rejectWithValue(message);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/orders/${orderId}/cancel`, { reason });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to cancel order';
      return rejectWithValue(message);
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ orderId, status, note, tracking }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/orders/${orderId}/status`, {
        status,
        note,
        tracking,
      });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update order status';
      return rejectWithValue(message);
    }
  }
);

export const fetchOrderStats = createAsyncThunk(
  'orders/fetchOrderStats',
  async (period = '30d', { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/order-stats?period=${period}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch order statistics';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  orders: [],
  currentOrder: null,
  stats: {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    statusBreakdown: {},
    period: '30d',
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  },
  filters: {
    status: '',
    sort: '-createdAt',
  },
  isLoading: false,
  isOrderLoading: false,
  isCreating: false,
  isUpdating: false,
  error: null,
  orderError: null,
};

// Order slice
const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.orderError = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
      state.orderError = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    updateOrderInList: (state, action) => {
      const updatedOrder = action.payload;
      const orderIndex = state.orders.findIndex(order => order._id === updatedOrder._id);
      if (orderIndex !== -1) {
        state.orders[orderIndex] = updatedOrder;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isCreating = false;
        state.currentOrder = action.payload;
        state.orders.unshift(action.payload); // Add to beginning of orders list
        state.error = null;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.items || action.payload;
        
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
        
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch single order
      .addCase(fetchOrder.pending, (state) => {
        state.isOrderLoading = true;
        state.orderError = null;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.isOrderLoading = false;
        state.currentOrder = action.payload;
        state.orderError = null;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.isOrderLoading = false;
        state.orderError = action.payload;
      })
      // Cancel order
      .addCase(cancelOrder.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.currentOrder = action.payload;
        
        // Update order in list
        const orderIndex = state.orders.findIndex(order => order._id === action.payload._id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = action.payload;
        }
        
        state.error = null;
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      // Update order status
      .addCase(updateOrderStatus.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.currentOrder = action.payload;
        
        // Update order in list
        const orderIndex = state.orders.findIndex(order => order._id === action.payload._id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = action.payload;
        }
        
        state.error = null;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      // Fetch order stats
      .addCase(fetchOrderStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const {
  clearError,
  clearCurrentOrder,
  setFilters,
  resetFilters,
  setPagination,
  updateOrderInList,
} = orderSlice.actions;

export default orderSlice.reducer;
