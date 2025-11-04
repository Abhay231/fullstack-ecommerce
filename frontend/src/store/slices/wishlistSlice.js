import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { showSuccessToast, showErrorToast } from './toastSlice';

// Async thunks
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.user?.id && !auth.user?._id) {
        return {
          items: [],
          totalItems: 0
        };
      }
      
      const response = await api.get('/wishlist');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch wishlist';
      return rejectWithValue(message);
    }
  }
);

export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async (productId, { dispatch, getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.user?.id && !auth.user?._id) {
        dispatch(showErrorToast('Please sign in to add items to wishlist'));
        return rejectWithValue('User not authenticated');
      }

      const response = await api.post(`/wishlist/add/${productId}`);
      
      dispatch(showSuccessToast('Item added to wishlist!'));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add item to wishlist';
      dispatch(showErrorToast(message));
      return rejectWithValue(message);
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId, { dispatch, getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.user?.id && !auth.user?._id) {
        dispatch(showErrorToast('Please sign in to manage wishlist'));
        return rejectWithValue('User not authenticated');
      }

      const response = await api.delete(`/wishlist/remove/${productId}`);
      
      dispatch(showSuccessToast('Item removed from wishlist'));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove item from wishlist';
      dispatch(showErrorToast(message));
      return rejectWithValue(message);
    }
  }
);

export const moveToCart = createAsyncThunk(
  'wishlist/moveToCart',
  async (productId, { dispatch, getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.user?.id && !auth.user?._id) {
        dispatch(showErrorToast('Please sign in to move items to cart'));
        return rejectWithValue('User not authenticated');
      }

      const response = await api.post(`/wishlist/move-to-cart/${productId}`, { quantity: 1 });
      
      dispatch(showSuccessToast('Item moved to cart successfully!'));
      
      // Return the productId to remove it from wishlist state
      return { productId, response: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to move item to cart';
      dispatch(showErrorToast(message));
      return rejectWithValue(message);
    }
  }
);

export const clearWishlist = createAsyncThunk(
  'wishlist/clearWishlist',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.user?.id && !auth.user?._id) {
        dispatch(showErrorToast('Please sign in to clear wishlist'));
        return rejectWithValue('User not authenticated');
      }

      const response = await api.delete('/wishlist/clear');
      
      dispatch(showSuccessToast('Wishlist cleared'));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to clear wishlist';
      dispatch(showErrorToast(message));
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  items: [],
  totalItems: 0,
  isLoading: false,
  error: null
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearWishlistState: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        state.totalItems = action.payload.totalItems || 0;
        state.error = null;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Add to wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        state.totalItems = action.payload.totalItems || 0;
        state.error = null;
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Remove from wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        state.totalItems = action.payload.totalItems || 0;
        state.error = null;
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Move to cart
      .addCase(moveToCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(moveToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove the item from wishlist after successful move
        // The productId is returned in the payload
        const productId = action.payload.productId;
        if (productId) {
          state.items = state.items.filter(item => 
            item.product._id !== productId
          );
          state.totalItems = state.items.length;
        }
        state.error = null;
      })
      .addCase(moveToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Clear wishlist
      .addCase(clearWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = [];
        state.totalItems = 0;
        state.error = null;
      })
      .addCase(clearWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearWishlistState } = wishlistSlice.actions;
export default wishlistSlice.reducer;
