import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Loading states
  isGlobalLoading: false,
  loadingMessage: '',
  
  // Modal states
  modals: {
    authModal: false,
    cartModal: false,
    productModal: false,
    confirmModal: false,
  },
  
  // Toast notifications
  notifications: [],
  
  // Mobile menu
  isMobileMenuOpen: false,
  
  // Search
  searchQuery: '',
  isSearchModalOpen: false,
  
  // Filters
  isFiltersOpen: false,
  
  // Theme
  theme: localStorage.getItem('theme') || 'light',
  
  // Pagination
  currentPage: 1,
  
  // Selected items (for bulk operations)
  selectedItems: [],
  
  // View mode (grid/list)
  viewMode: localStorage.getItem('viewMode') || 'grid',
  
  // Sidebar
  isSidebarOpen: true,
  
  // Error states
  globalError: null,
  
  // Language
  language: localStorage.getItem('language') || 'en',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Loading actions
    setGlobalLoading: (state, action) => {
      state.isGlobalLoading = action.payload.isLoading;
      state.loadingMessage = action.payload.message || '';
    },
    
    // Modal actions
    openModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = true;
      }
    },
    
    closeModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = false;
      }
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key] = false;
      });
    },
    
    // Notification actions
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Mobile menu actions
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false;
    },
    
    // Search actions
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    
    toggleSearchModal: (state) => {
      state.isSearchModalOpen = !state.isSearchModalOpen;
    },
    
    closeSearchModal: (state) => {
      state.isSearchModalOpen = false;
    },
    
    // Filter actions
    toggleFilters: (state) => {
      state.isFiltersOpen = !state.isFiltersOpen;
    },
    
    closeFilters: (state) => {
      state.isFiltersOpen = false;
    },
    
    // Theme actions
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
    },
    
    // Pagination actions
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    
    // Selection actions
    selectItem: (state, action) => {
      const itemId = action.payload;
      if (!state.selectedItems.includes(itemId)) {
        state.selectedItems.push(itemId);
      }
    },
    
    deselectItem: (state, action) => {
      const itemId = action.payload;
      state.selectedItems = state.selectedItems.filter(id => id !== itemId);
    },
    
    selectAllItems: (state, action) => {
      state.selectedItems = action.payload;
    },
    
    clearSelection: (state) => {
      state.selectedItems = [];
    },
    
    toggleItemSelection: (state, action) => {
      const itemId = action.payload;
      const index = state.selectedItems.indexOf(itemId);
      
      if (index > -1) {
        state.selectedItems.splice(index, 1);
      } else {
        state.selectedItems.push(itemId);
      }
    },
    
    // View mode actions
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
      localStorage.setItem('viewMode', action.payload);
    },
    
    toggleViewMode: (state) => {
      state.viewMode = state.viewMode === 'grid' ? 'list' : 'grid';
      localStorage.setItem('viewMode', state.viewMode);
    },
    
    // Sidebar actions
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    
    setSidebarOpen: (state, action) => {
      state.isSidebarOpen = action.payload;
    },
    
    // Error actions
    setGlobalError: (state, action) => {
      state.globalError = action.payload;
    },
    
    clearGlobalError: (state) => {
      state.globalError = null;
    },
    
    // Language actions
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
    
    // Reset UI state
    resetUI: (state) => {
      state.isGlobalLoading = false;
      state.loadingMessage = '';
      state.modals = initialState.modals;
      state.notifications = [];
      state.isMobileMenuOpen = false;
      state.isSearchModalOpen = false;
      state.isFiltersOpen = false;
      state.selectedItems = [];
      state.globalError = null;
    },
  },
});

export const {
  // Loading
  setGlobalLoading,
  
  // Modals
  openModal,
  closeModal,
  closeAllModals,
  
  // Notifications
  addNotification,
  removeNotification,
  clearNotifications,
  
  // Mobile menu
  toggleMobileMenu,
  closeMobileMenu,
  
  // Search
  setSearchQuery,
  toggleSearchModal,
  closeSearchModal,
  
  // Filters
  toggleFilters,
  closeFilters,
  
  // Theme
  setTheme,
  toggleTheme,
  
  // Pagination
  setCurrentPage,
  
  // Selection
  selectItem,
  deselectItem,
  selectAllItems,
  clearSelection,
  toggleItemSelection,
  
  // View mode
  setViewMode,
  toggleViewMode,
  
  // Sidebar
  toggleSidebar,
  setSidebarOpen,
  
  // Error
  setGlobalError,
  clearGlobalError,
  
  // Language
  setLanguage,
  
  // Reset
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;
