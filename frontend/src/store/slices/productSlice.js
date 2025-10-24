import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/products?${queryString}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch products';
      return rejectWithValue(message);
    }
  }
);

export const fetchProduct = createAsyncThunk(
  'products/fetchProduct',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch product';
      return rejectWithValue(message);
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch product';
      return rejectWithValue(message);
    }
  }
);

export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (searchParams, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(searchParams).toString();
      const response = await api.get(`/products/search?${queryString}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Search failed';
      return rejectWithValue(message);
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/products/categories');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch categories';
      return rejectWithValue(message);
    }
  }
);

export const fetchBrands = createAsyncThunk(
  'products/fetchBrands',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/products/brands');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch brands';
      return rejectWithValue(message);
    }
  }
);

export const addReview = createAsyncThunk(
  'products/addReview',
  async ({ productId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/products/${productId}/reviews`, reviewData);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add review';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  products: [],
  currentProduct: null,
  categories: [],
  brands: [],
  searchResults: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12,
    hasNextPage: false,
    hasPrevPage: false,
  },
  filters: {
    category: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    sort: '-createdAt',
    featured: null,
  },
  isLoading: false,
  isProductLoading: false,
  isSearching: false,
  error: null,
  searchError: null,
};

// Product slice
const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.searchError = null;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchError = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.items || action.payload;
        
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
        
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch single product
      .addCase(fetchProduct.pending, (state) => {
        state.isProductLoading = true;
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.isProductLoading = false;
        state.currentProduct = action.payload;
        state.error = null;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.isProductLoading = false;
        state.error = action.payload;
      })
      // Fetch product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.isProductLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isProductLoading = false;
        state.currentProduct = action.payload;
        state.error = null;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isProductLoading = false;
        state.error = action.payload;
      })
      // Search products
      .addCase(searchProducts.pending, (state) => {
        state.isSearching = true;
        state.searchError = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload.items || action.payload;
        
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
        
        state.searchError = null;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.isSearching = false;
        state.searchError = action.payload;
      })
      // Fetch categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      // Fetch brands
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.brands = action.payload;
      })
      // Add review
      .addCase(addReview.fulfilled, (state, action) => {
        if (state.currentProduct) {
          state.currentProduct = action.payload;
        }
      });
  },
});

export const {
  clearError,
  clearCurrentProduct,
  clearSearchResults,
  setFilters,
  resetFilters,
  clearFilters,
  setPagination,
} = productSlice.actions;

export default productSlice.reducer;
