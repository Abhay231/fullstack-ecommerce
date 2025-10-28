import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProducts, clearFilters } from '../store/slices/productSlice';
import { addToCart, fetchCart } from '../store/slices/cartSlice';
import { FiSearch, FiFilter, FiShoppingCart, FiStar, FiHeart } from 'react-icons/fi';
import ProductImage from '../components/ProductImage';

const Products = () => {
  const dispatch = useDispatch();
  const { products, isLoading: loading, error, pagination } = useSelector(state => state.products);
  const { items: cartItems } = useSelector(state => state.cart);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');
  const [wishlist, setWishlist] = useState(new Set());

  useEffect(() => {
    // Build parameters object, only including non-empty values
    const params = { 
      page: 1, 
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
  }, [dispatch, searchTerm, selectedCategory, priceRange, sortBy]);

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Build parameters object, only including non-empty values
    const params = { 
      page: 1, 
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
  };

  const handleAddToCart = (product) => {
    console.log('🛒 PRODUCTS - Adding to cart:', {
      product: {
        id: product._id,
        name: product.name,
        price: product.price
      }
    });
    
    dispatch(addToCart({
      productId: product._id,
      quantity: 1,
      selectedVariants: {} // Add this to match the expected format
    })).then((result) => {
      console.log('🛒 PRODUCTS - Add to cart result:', result);
      // Refetch cart to update counter
      dispatch(fetchCart());
    }).catch((error) => {
      console.error('🛒 PRODUCTS - Add to cart error:', error);
    });
  };

  const handleWishlist = (productId) => {
    const newWishlist = new Set(wishlist);
    if (newWishlist.has(productId)) {
      newWishlist.delete(productId);
    } else {
      newWishlist.add(productId);
    }
    setWishlist(newWishlist);
  };

  const isInCart = (productId) => {
    return cartItems.some(item => item.productId === productId);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FiStar
        key={i}
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
              onChange={(e) => setSearchTerm(e.target.value)}
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
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
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
                {products.map(product => (
                  <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <ProductImage
                        src={product.images?.[0]?.url || product.images?.[0]}
                        alt={product.images?.[0]?.alt || product.name}
                        className="w-full h-48 object-cover"
                      />
                      <button
                        onClick={() => handleWishlist(product._id)}
                        className={`absolute top-3 right-3 p-2 rounded-full ${
                          wishlist.has(product._id) 
                            ? 'bg-red-500 text-white' 
                            : 'bg-white text-gray-600 hover:text-red-500'
                        } shadow-md transition-colors`}
                      >
                        <FiHeart className="w-4 h-4" />
                      </button>
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-semibold">Out of Stock</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">{product.category}</span>
                        <div className="flex items-center">
                          {renderStars(product.rating)}
                          <span className="ml-1 text-sm text-gray-600">({product.numReviews})</span>
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
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gray-900">
                            ${product.price.toFixed(2)}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ${product.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0 || isInCart(product._id)}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            product.stock === 0 || isInCart(product._id)
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
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
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex space-x-2">
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => dispatch(fetchProducts({ 
                          page: i + 1, 
                          limit: 12,
                          search: searchTerm,
                          category: selectedCategory,
                          minPrice: priceRange.min,
                          maxPrice: priceRange.max,
                          sortBy 
                        }))}
                        className={`px-3 py-2 rounded-md ${
                          pagination.currentPage === i + 1
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
