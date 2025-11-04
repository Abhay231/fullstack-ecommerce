import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
  fetchWishlist, 
  removeFromWishlist as removeFromWishlistAction, 
  clearWishlist as clearWishlistAction 
} from '../store/slices/wishlistSlice';
import { addToCart, fetchCart } from '../store/slices/cartSlice';
import { addToast } from '../store/slices/toastSlice';
import ProductImage from '../components/ProductImage';

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading, error } = useSelector(state => state.wishlist);
  const { isAuthenticated } = useSelector(state => state.auth);
  const [itemsBeingMoved, setItemsBeingMoved] = useState(new Set());

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated]);

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await dispatch(removeFromWishlistAction(productId)).unwrap();
      dispatch(addToast({ message: 'Item removed from wishlist', type: 'success' }));
    } catch (error) {
      dispatch(addToast({ message: 'Failed to remove item from wishlist', type: 'error' }));
    }
  };

  const handleMoveToCart = async (productId) => {
    setItemsBeingMoved(prev => new Set(prev).add(productId));
    try {
      // Add to cart first
      await dispatch(addToCart({ productId, quantity: 1 })).unwrap();
      // Fetch updated cart to ensure cart count is updated
      await dispatch(fetchCart());
      // Then remove from wishlist
      await dispatch(removeFromWishlistAction(productId)).unwrap();
      dispatch(addToast({ message: 'Item moved to cart successfully!', type: 'success' }));
      
      // Navigate to cart page immediately after successful move
      navigate('/cart');
    } catch (error) {
      dispatch(addToast({ message: 'Failed to move item to cart', type: 'error' }));
    } finally {
      setItemsBeingMoved(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleClearWishlist = async () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      try {
        await dispatch(clearWishlistAction()).unwrap();
        dispatch(addToast({ message: 'Wishlist cleared', type: 'success' }));
      } catch (error) {
        dispatch(addToast({ message: 'Failed to clear wishlist', type: 'error' }));
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">My Wishlist</h1>
          <p className="mb-4">Please login to view your wishlist</p>
          <Link 
            to="/login" 
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading wishlist...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          Error loading wishlist: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Wishlist</h1>
        {items.length > 0 && (
          <button
            onClick={handleClearWishlist}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="mb-4">
            <svg 
              className="mx-auto h-16 w-16 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 mb-4">Save items you love to your wishlist</p>
          <Link 
            to="/products" 
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <Link to={`/products/${item.product._id}`}>
                <ProductImage 
                  src={item.product.image} 
                  alt={item.product.name}
                  className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                />
              </Link>
              
              <div className="p-4">
                <Link to={`/products/${item.product._id}`}>
                  <h3 className="font-semibold text-lg mb-2 hover:text-blue-600 transition-colors">
                    {item.product.name}
                  </h3>
                </Link>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {item.product.description}
                </p>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-green-600">
                    ${item.product.price}
                  </span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    item.product.inventory?.quantity > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.product.inventory?.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMoveToCart(item.product._id)}
                    disabled={item.product.inventory?.quantity === 0 || itemsBeingMoved.has(item.product._id)}
                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                      item.product.inventory?.quantity === 0 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : itemsBeingMoved.has(item.product._id)
                        ? 'bg-blue-300 text-blue-700 cursor-wait'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {itemsBeingMoved.has(item.product._id) ? 'Moving...' : 'Move to Cart'}
                  </button>
                  
                  <button
                    onClick={() => handleRemoveFromWishlist(item.product._id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Remove from wishlist"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path 
                        fillRule="evenodd" 
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
