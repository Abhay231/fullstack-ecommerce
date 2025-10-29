import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { showSuccessToast, showErrorToast } from './toastSlice';

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.user?.id && !auth.user?._id) {
        // Return empty cart for unauthenticated users instead of rejecting
        return {
          items: [],
          totalItems: 0,
          totalPrice: 0,
          lastUpdated: null
        };
      }
      
      const userId = auth.user.id || auth.user._id;
      const response = await api.get(`/cart/${userId}`);
      
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch cart';
      return rejectWithValue(message);
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity, selectedVariants }, { dispatch, getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      // Check if user exists and has an ID
      if (!auth.user?.id && !auth.user?._id) {
        console.error('❌ ADD TO CART FAILED - User not authenticated');
        dispatch(showErrorToast('Please sign in to add items to cart'));
        return rejectWithValue('User not authenticated');
      }

      console.log('🛒 ADD TO CART - Making API call...');
      const response = await api.post('/cart/add', {
        productId,
        quantity,
        selectedVariants,
      });
      
      console.log('🛒 ADD TO CART - API Response:', response.data);
      
      // Show success toast
      dispatch(showSuccessToast('Item added to cart successfully!'));
      
      return response.data.data;
    } catch (error) {
      console.error('🛒 ADD TO CART - Error:', error);
      const message = error.response?.data?.message || 'Failed to add item to cart';
      
      // Show error toast
      dispatch(showErrorToast(message));
      
      return rejectWithValue(message);
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ productId, quantity, selectedVariants }, { dispatch, getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.user?.id) {
        dispatch(showErrorToast('Please sign in to update cart'));
        return rejectWithValue('User not authenticated');
      }

      const response = await api.put('/cart/update', {
        productId,
        quantity,
        selectedVariants,
      });
      
      // Show success toast
      dispatch(showSuccessToast('Cart updated successfully!'));
      
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update cart item';
      
      // Show error toast
      dispatch(showErrorToast(message));
      
      return rejectWithValue(message);
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async ({ productId, selectedVariants }, { dispatch, getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.user?.id) {
        dispatch(showErrorToast('Please sign in to remove items from cart'));
        return rejectWithValue('User not authenticated');
      }

      const response = await api.delete('/cart/remove', {
        data: { productId, selectedVariants },
      });
      
      // Show success toast
      dispatch(showSuccessToast('Item removed from cart'));
      
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove item from cart';
      
      // Show error toast
      dispatch(showErrorToast(message));
      
      return rejectWithValue(message);
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      // DEBUG: Log auth state to CloudWatch (when API is called)
      console.log('🔍 Clear Cart Auth Check:', {
        hasAuth: !!auth,
        hasUser: !!auth.user,
        userId_id: auth.user?.id,
        userId_underscore: auth.user?._id,
        isAuthenticated: auth.isAuthenticated,
        timestamp: new Date().toISOString()
      });
      
      // Check both id and _id fields to be safe
      if (!auth.user?.id && !auth.user?._id) {
        console.error('❌ Clear Cart Failed - User not authenticated');
        dispatch(showErrorToast('Please sign in to clear cart'));
        return rejectWithValue('User not authenticated');
      }

      const response = await api.delete('/cart/clear');
      
      // Show success toast
      dispatch(showSuccessToast('Cart cleared successfully!'));
      
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to clear cart';
      
      // Show error toast
      dispatch(showErrorToast(message));
      
      return rejectWithValue(message);
    }
  }
);

export const syncCart = createAsyncThunk(
  'cart/syncCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/cart/sync');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to sync cart';
      return rejectWithValue(message);
    }
  }
);

export const fetchCartSummary = createAsyncThunk(
  'cart/fetchCartSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/cart-summary');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch cart summary';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  summary: {
    totalItems: 0,
    totalPrice: 0,
    hasItems: false,
  },
  isLoading: false,
  isUpdating: false,
  error: null,
  lastUpdated: null,
};

// Cart slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
      state.summary = initialState.summary;
      state.lastUpdated = null;
    },
    updateLocalCartItem: (state, action) => {
      const { productId, quantity, selectedVariants } = action.payload;
      const itemIndex = state.items.findIndex(
        item => 
          item.product._id === productId &&
          JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
      );
      
      if (itemIndex !== -1) {
        if (quantity <= 0) {
          state.items.splice(itemIndex, 1);
        } else {
          state.items[itemIndex].quantity = quantity;
        }
        
        // Recalculate totals
        state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
        state.totalPrice = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      }
    },
    removeLocalCartItem: (state, action) => {
      const { productId, selectedVariants } = action.payload;
      state.items = state.items.filter(
        item => !(
          item.product._id === productId &&
          JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
        )
      );
      
      // Recalculate totals
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalPrice = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        state.totalItems = action.payload.totalItems || 0;
        state.totalPrice = action.payload.totalPrice || 0;
        state.lastUpdated = action.payload.lastUpdated;
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.items = action.payload.items || [];
        state.totalItems = action.payload.totalItems || 0;
        state.totalPrice = action.payload.totalPrice || 0;
        state.lastUpdated = action.payload.lastUpdated;
        state.error = null;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      // Update cart item
      .addCase(updateCartItem.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.items = action.payload.items || [];
        state.totalItems = action.payload.totalItems || 0;
        state.totalPrice = action.payload.totalPrice || 0;
        state.lastUpdated = action.payload.lastUpdated;
        state.error = null;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      // Remove from cart
      .addCase(removeFromCart.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.items = action.payload.items || [];
        state.totalItems = action.payload.totalItems || 0;
        state.totalPrice = action.payload.totalPrice || 0;
        state.lastUpdated = action.payload.lastUpdated;
        state.error = null;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      // Clear cart
      .addCase(clearCart.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.isUpdating = false;
        state.items = [];
        state.totalItems = 0;
        state.totalPrice = 0;
        state.lastUpdated = null;
        state.error = null;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      // Sync cart
      .addCase(syncCart.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.totalItems = action.payload.totalItems || 0;
        state.totalPrice = action.payload.totalPrice || 0;
        state.lastUpdated = action.payload.lastUpdated;
      })
      // Fetch cart summary
      .addCase(fetchCartSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      });
  },
});

export const {
  clearError,
  resetCart,
  updateLocalCartItem,
  removeLocalCartItem,
} = cartSlice.actions;

export default cartSlice.reducer;
