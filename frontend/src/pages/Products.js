import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchProducts, clearFilters } from '../store/slices/productSlice';
import { addToCart, fetchCart } from '../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../store/slices/wishlistSlice';
import { addToast } from '../store/slices/toastSlice';
import { FiSearch, FiFilter, FiShoppingCart, FiStar, FiHeart } from 'react-icons/fi';
import ProductImage from '../components/ProductImage';

const Products = () => {
  const dispatch = useDispatch();
  const { products, isLoading: loading, error, pagination } = useSelector(state => state.products);
  const { items: cartItems } = useSelector(state => state.cart);
  const { items: wishlistItems, loading: wishlistLoading } = useSelector(state => state.wishlist);
  const { isAuthenticated } = useSelector(state => state.auth);
  
  // Get URL search parameters
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize search term from URL if present
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);

  // Create a Set of wishlist product IDs for quick lookup
  const wishlistProductIds = new Set(wishlistItems.map(item => item.product._id));

  // Track if it's the first render
  const isFirstRender = useRef(true);

  // Sync search term with URL parameters when URL changes
  useEffect(() => {
    const urlSearchTerm = searchParams.get('search') || '';
    if (urlSearchTerm !== searchTerm) {
      setSearchTerm(urlSearchTerm);
    }
  }, [searchParams]);

  // Fetch wishlist when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated]);

  // Reset to page 1 when filters change (but not on first render or when only page changes)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, priceRange.min, priceRange.max, sortBy]);

  // Fetch products when page or filters change
  useEffect(() => {
    // Build parameters object, only including non-empty values
    const params = { 
      page: currentPage, 
      limit: 12
    };

    if (searchTerm) params.search = searchTerm;
    if (selectedCategory) params.category = selectedCategory;
    if (priceRange.min) params.minPrice = priceRange.min;
    if (priceRange.max) params.maxPrice = priceRange.max;

    // Convert sortBy to backend format
    if (sortBy) {
      switch (sortBy) {
        case 'price_asc':
          params.sort = 'price';
          break;
        case 'price_desc':
          params.sort = '-price';
          break;
        case 'rating':
          params.sort = '-rating';
          break;
        case 'newest':
          params.sort = '-createdAt';
          break;
        case 'name':
          params.sort = 'name';
          break;
        default:
          params.sort = 'name';
      }
    }

    dispatch(fetchProducts(params));
  }, [dispatch, currentPage, searchTerm, selectedCategory, priceRange.min, priceRange.max, sortBy]);

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Update URL with search term (this will trigger the useEffect to fetch)
    if (searchTerm.trim()) {
      setSearchParams({ search: searchTerm.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Update URL immediately (this will trigger search via useEffect)
    if (value.trim()) {
      setSearchParams({ search: value.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart({
      productId: product._id,
      quantity: 1,
      selectedVariants: {}
    })).then(() => {
      dispatch(fetchCart());
    });
  };

  const handleWishlist = async (productId) => {
    if (!isAuthenticated) {
      dispatch(addToast({ message: 'Please login to add items to wishlist', type: 'error' }));
      return;
    }

    try {
      if (wishlistProductIds.has(productId)) {
        await dispatch(removeFromWishlist(productId)).unwrap();
        dispatch(addToast({ message: 'Removed from wishlist', type: 'success' }));
      } else {
        await dispatch(addToWishlist(productId)).unwrap();
        dispatch(addToast({ message: 'Added to wishlist', type: 'success' }));
      }
    } catch (error) {
      dispatch(addToast({ 
        message: 'Failed to update wishlist', 
        type: 'error' 
      }));
    }
  };

  const isInCart = (productId) => {
    return cartItems.some(item => item.productId === productId);
  };

  const renderStars = (rating) => {
    return [...new Array(5)].map((_, i) => (
      <FiStar
        key={`star-${i}-${rating}`}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty'];

  if (loading && products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  // compute counts for categories from the currently loaded products (best-effort)
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = products.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase()).length;
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Products</h1>
          <p className="text-gray-600">Discover our amazing collection</p>
        </div>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex w-full md:w-auto mt-4 md:mt-0">
          <div className="relative flex-1 md:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-r-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden text-gray-500"
              >
                <FiFilter className="w-5 h-5" />
              </button>
            </div>

            <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              {/* Category Chips */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Categories</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-3 py-1 rounded-full text-sm ${!selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    All ({products.length})
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      <span className="font-medium">{cat}</span>
                      <span className="text-xs text-gray-500">{categoryCounts[cat] || 0}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label htmlFor="price-range" className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex space-x-2">
                  <input
                    id="price-min"
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Minimum price"
                  />
                  <input
                    id="price-max"
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Maximum price"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label htmlFor="sort-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Rating</option>
                  <option value="newest">Newest</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setPriceRange({ min: '', max: '' });
                  setSortBy('name');
                  setSearchTerm('');
                  dispatch(clearFilters());
                }}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="lg:w-3/4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {products.length === 0 && !loading ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map(product => {
                  const stock = product.stock ?? product.inventory?.quantity ?? 0;
                  const isOnSale = product.originalPrice && product.originalPrice > product.price;
                  const isNew = product.createdAt ? (new Date() - new Date(product.createdAt)) < (1000 * 60 * 60 * 24 * 30) : false;

                  return (
                    <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transform hover:-translate-y-1 transition-all">
                      <div className="relative">
                        <ProductImage
                          src={product.images?.[0]?.url || product.images?.[0]}
                          alt={product.images?.[0]?.alt || product.name}
                          className="w-full h-48 object-cover"
                        />

                        {/* Badges */}
                        {isOnSale && (
                          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">Sale</span>
                        )}
                        {isNew && !isOnSale && (
                          <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded">New</span>
                        )}

                        <button
                          onClick={() => handleWishlist(product._id)}
                          disabled={wishlistLoading}
                          className={`absolute top-3 right-3 p-2 rounded-full ${
                            wishlistProductIds.has(product._id)
                              ? 'bg-red-500 text-white'
                              : 'bg-white text-gray-600 hover:text-red-500'
                          } shadow-md transition-colors ${wishlistLoading ? 'cursor-wait' : ''}`}
                        >
                          <FiHeart className="w-4 h-4" />
                        </button>

                        {stock === 0 && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="text-white font-semibold">Out of Stock</span>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-500">{product.category}</span>
                          <div className="flex items-center">
                            {renderStars(product.ratings?.average || 0)}
                            <span className="ml-1 text-sm text-gray-600">({product.ratings?.count || 0})</span>
                          </div>
                        </div>

                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          <Link 
                            to={`/products/${product._id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {product.name}
                          </Link>
                        </h3>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline space-x-3">
                            <span className="text-lg font-bold text-gray-900">
                              ${((product.discountedPrice ?? product.price) || 0).toFixed(2)}
                            </span>
                            {isOnSale && (
                              <span className="text-sm text-gray-500 line-through">
                                ${product.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={stock === 0 || isInCart(product._id)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                              stock === 0 || isInCart(product._id)
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105'
                            }`}
                          >
                            <FiShoppingCart className="w-4 h-4" />
                            <span>
                              {isInCart(product._id) ? 'In Cart' : 'Add to Cart'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex space-x-2">
                    {[...new Array(pagination.totalPages)].map((_, i) => (
                      <button
                        key={`page-${i + 1}`}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-3 py-2 rounded-md ${
                          currentPage === i + 1
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
