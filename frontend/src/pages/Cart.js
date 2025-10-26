import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCart, updateCartItem, removeFromCart, clearCart } from '../store/slices/cartSlice';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiArrowLeft, FiTruck, FiTag } from 'react-icons/fi';
import ProductImage from '../components/ProductImage';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, isLoading, error } = useSelector(state => state.cart);
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  // Refetch cart when authentication state changes
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch, isAuthenticated, user]);

  const handleQuantityChange = (productId, newQuantity, selectedVariants) => {
    if (newQuantity <= 0) {
      dispatch(removeFromCart({ productId, selectedVariants: selectedVariants || {} }))
        .then(() => dispatch(fetchCart()));
    } else {
      dispatch(updateCartItem({ productId, quantity: newQuantity, selectedVariants: selectedVariants || {} }))
        .then(() => dispatch(fetchCart()));
    }
  };

  const handleRemoveItem = (productId, selectedVariants) => {
    dispatch(removeFromCart({ productId, selectedVariants: selectedVariants || {} }))
      .then(() => dispatch(fetchCart()));
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart())
        .then(() => dispatch(fetchCart()));
    }
  };

  const handleApplyPromo = () => {
    // Simulate promo code application
    const validCodes = {
      'SAVE10': 0.1,
      'SAVE20': 0.2,
      'WELCOME15': 0.15
    };

    if (validCodes[promoCode.toUpperCase()]) {
      setDiscount(totalPrice * validCodes[promoCode.toUpperCase()]);
      setPromoApplied(true);
    } else {
      alert('Invalid promo code');
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  // Calculate totals
  const subtotal = totalPrice || 0;
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal >= 50 ? 0 : 9.99; // Free shipping over $50
  const finalTotal = subtotal - discount + tax + shipping;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center max-w-md mx-auto">
          <FiShoppingBag className="mx-auto text-gray-400 w-24 h-24 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        
        <button
          onClick={handleClearCart}
          className="text-red-600 hover:text-red-700 font-medium"
        >
          Clear Cart
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            {items.map((item, index) => (
              <div key={item.id || index} className="p-6 border-b border-gray-200 last:border-b-0">
                <div className="flex items-start space-x-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <ProductImage
                      src={item.product?.images?.[0]?.url}
                      alt={item.product?.name || 'Product'}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          <Link 
                            to={`/products/${item.product._id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {item.product?.name || 'Product Name'}
                          </Link>
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.product?.category}
                        </p>
                        {item.variant && (
                          <p className="text-sm text-gray-600 mb-2">
                            Variant: {item.variant}
                          </p>
                        )}
                        <div className="flex items-center space-x-4">
                          <span className="font-semibold text-lg">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500">
                            ${item.price.toFixed(2)} each
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.product._id, item.selectedVariants)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleQuantityChange(item.product._id, item.quantity - 1, item.selectedVariants)}
                          className="p-1 rounded-md border border-gray-300 hover:bg-gray-50"
                        >
                          <FiMinus className="w-4 h-4" />
                        </button>
                        <span className="font-medium text-lg w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.product._id, item.quantity + 1, item.selectedVariants)}
                          disabled={item.quantity >= (item.product?.inventory?.quantity || 99)}
                          className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiPlus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Stock Status */}
                      <div className="text-sm">
                        {item.product?.inventory?.quantity <= 5 && item.product?.inventory?.quantity > 0 && (
                          <span className="text-orange-600">
                            Only {item.product.inventory.quantity} left in stock
                          </span>
                        )}
                        {item.product?.inventory?.quantity === 0 && (
                          <span className="text-red-600">Out of stock</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Continue Shopping */}
          <div className="mt-6">
            <Link
              to="/products"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

            {/* Promo Code */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promo Code
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                    disabled={promoApplied}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                {!promoApplied ? (
                  <button
                    onClick={handleApplyPromo}
                    disabled={!promoCode.trim()}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setPromoApplied(false);
                      setPromoCode('');
                      setDiscount(0);
                    }}
                    className="bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200"
                  >
                    Remove
                  </button>
                )}
              </div>
              {promoApplied && (
                <p className="text-green-600 text-sm mt-2">
                  ✓ Promo code applied successfully!
                </p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1">
                  <FiTruck className="w-4 h-4 text-gray-500" />
                  <span>Shipping</span>
                </div>
                <span>
                  {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Free Shipping Banner */}
            {subtotal < 50 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 text-blue-700">
                  <FiTruck className="w-4 h-4" />
                  <span className="text-sm">
                    Add ${(50 - subtotal).toFixed(2)} more for free shipping!
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((subtotal / 50) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Proceed to Checkout
            </button>

            {/* Security Badge */}
            <div className="flex items-center justify-center space-x-2 mt-4 text-sm text-gray-600">
              <span>🔒</span>
              <span>Secure checkout with SSL encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
