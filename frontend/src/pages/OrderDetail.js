import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrder } from '../store/slices/orderSlice';
import { clearCurrentOrder } from '../store/slices/orderSlice';
import { FiArrowLeft, FiPackage, FiTruck, FiCheckCircle, FiMapPin, FiCreditCard, FiCalendar, FiUser } from 'react-icons/fi';
import ProductImage from '../components/ProductImage';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentOrder, isOrderLoading, orderError } = useSelector(state => state.orders);

  useEffect(() => {
    if (id) {
      dispatch(fetchOrder(id));
    }
    
    // Cleanup: Clear current order when component unmounts
    return () => {
      dispatch(clearCurrentOrder());
    };
  }, [dispatch, id]);

  const getStatusIcon = (status) => {
    const statusString = typeof status === 'string' ? status : (status?.current || 'pending');
    switch (statusString) {
      case 'pending':
        return <FiPackage className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
      case 'processing':
        return <FiPackage className="w-5 h-5 text-blue-500" />;
      case 'shipped':
        return <FiTruck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
      case 'returned':
        return <FiPackage className="w-5 h-5 text-red-500" />;
      default:
        return <FiPackage className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    const statusString = typeof status === 'string' ? status : (status?.current || 'pending');
    switch (statusString) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'returned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Show loading while fetching data
  if (isOrderLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-24 h-8 bg-gray-200 rounded"></div>
              <div className="w-32 h-6 bg-gray-200 rounded"></div>
            </div>
            <div className="w-20 h-8 bg-gray-200 rounded"></div>
          </div>
          
          {/* Order Info Skeleton */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
          
          {/* Items Skeleton */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (orderError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>Error loading order: {orderError}</p>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  // Show "not found" only after loading is complete and no order exists
  if (!isOrderLoading && !currentOrder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Order not found</p>
          <button
            onClick={() => navigate('/orders')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Orders
          </button>
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
            onClick={() => navigate('/orders')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back to Orders</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600">Order #{currentOrder.orderNumber}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon(currentOrder.orderStatus)}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentOrder.orderStatus)}`}>
            {(() => {
              const status = currentOrder.orderStatus;
              const statusString = typeof status === 'string' ? status : (status?.current || 'pending');
              return statusString.charAt(0).toUpperCase() + statusString.slice(1);
            })()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {currentOrder.items?.map((item, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">
                    <ProductImage
                      src={item.productImage || item.product?.images?.[0]?.url}
                      alt={item.productName || item.product?.name || 'Product'}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      <Link 
                        to={`/products/${item.product?._id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {item.productName || item.product?.name}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-600">{item.product?.category}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                      <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Order Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Order Placed</p>
                  <p className="text-sm text-gray-600">
                    {new Date(currentOrder.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {(() => {
                const statusString = typeof currentOrder.orderStatus === 'string' ? 
                  currentOrder.orderStatus : 
                  (currentOrder.orderStatus?.current || 'pending');
                return statusString !== 'pending';
              })() && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiPackage className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Order Confirmed</p>
                    <p className="text-sm text-gray-600">Your order is being processed</p>
                  </div>
                </div>
              )}

              {(() => {
                const statusString = typeof currentOrder.orderStatus === 'string' ? 
                  currentOrder.orderStatus : 
                  (currentOrder.orderStatus?.current || 'pending');
                return (statusString === 'shipped' || statusString === 'delivered');
              })() && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <FiTruck className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Order Shipped</p>
                    <p className="text-sm text-gray-600">Your order is on the way</p>
                  </div>
                </div>
              )}

              {(() => {
                const statusString = typeof currentOrder.orderStatus === 'string' ? 
                  currentOrder.orderStatus : 
                  (currentOrder.orderStatus?.current || 'pending');
                return statusString === 'delivered';
              })() && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <FiCheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Order Delivered</p>
                    <p className="text-sm text-gray-600">Your order has been delivered</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${currentOrder.orderSummary?.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${currentOrder.orderSummary?.tax?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {currentOrder.orderSummary?.shipping === 0 ? 'Free' : `$${currentOrder.orderSummary?.shipping?.toFixed(2) || '0.00'}`}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${currentOrder.orderSummary?.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <FiMapPin className="w-5 h-5" />
              <span>Shipping Address</span>
            </h2>
            <div className="text-sm space-y-1">
              <p className="font-medium">{currentOrder.shippingAddress?.name}</p>
              <p>{currentOrder.shippingAddress?.street}</p>
              <p>{currentOrder.shippingAddress?.city}, {currentOrder.shippingAddress?.state} {currentOrder.shippingAddress?.zipCode}</p>
              <p>{currentOrder.shippingAddress?.country}</p>
              <p className="pt-2">{currentOrder.shippingAddress?.phone}</p>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <FiCreditCard className="w-5 h-5" />
              <span>Payment</span>
            </h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Method</span>
                <span className="capitalize">{currentOrder.paymentInfo?.method || 'Stripe'}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  currentOrder.paymentInfo?.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentOrder.paymentInfo?.paymentStatus || 'Pending'}
                </span>
              </div>
              {currentOrder.paymentInfo?.transactionId && (
                <div className="flex justify-between">
                  <span>Transaction ID</span>
                  <span className="text-xs font-mono">{currentOrder.paymentInfo.transactionId.slice(-8)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <FiCalendar className="w-5 h-5" />
              <span>Order Info</span>
            </h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Order Date</span>
                <span>{new Date(currentOrder.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Order Number</span>
                <span className="font-mono">{currentOrder.orderNumber}</span>
              </div>
              {currentOrder.estimatedDelivery && (
                <div className="flex justify-between">
                  <span>Est. Delivery</span>
                  <span>{new Date(currentOrder.estimatedDelivery).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
