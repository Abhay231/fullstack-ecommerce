import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaCalendarAlt, FaBox, FaShippingFast, FaTruck, FaCheckCircle, FaTimesCircle, FaEye, FaDownload } from 'react-icons/fa';
import { fetchOrders } from '../store/slices/orderSlice';

const Orders = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { orders, isLoading, error } = useSelector(state => state.orders);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(fetchOrders());
    }
  }, [dispatch, isAuthenticated, user]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    if (!status || typeof status !== 'string') return 'text-gray-600 bg-gray-100';
    
    switch (status.toLowerCase()) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'shipped': return 'text-blue-600 bg-blue-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-purple-600 bg-purple-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    if (!status || typeof status !== 'string') return <FaBox />;
    
    switch (status.toLowerCase()) {
      case 'delivered': return <FaCheckCircle />;
      case 'shipped': return <FaTruck />;
      case 'processing': return <FaShippingFast />;
      case 'confirmed': return <FaBox />;
      case 'cancelled': return <FaTimesCircle />;
      default: return <FaBox />;
    }
  };

  const filteredOrders = orders ? orders.filter(order => {
    if (filterStatus === 'all') return true;
    const currentStatus = order.orderStatus?.current || order.status || 'processing';
    return currentStatus.toLowerCase() === filterStatus;
  }) : [];

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        <p className="text-gray-600 mb-4">Please log in to view your orders.</p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Login
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error loading orders: {error}</p>
          <button 
            onClick={() => dispatch(fetchOrders({ userId: user.id }))}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      
      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {['all', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <FaBox className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {filterStatus === 'all' ? 'No orders found' : `No ${filterStatus} orders`}
          </h3>
          <p className="text-gray-500 mb-6">
            {filterStatus === 'all' 
              ? "You haven't placed any orders yet. Start shopping to see your orders here!" 
              : `You don't have any ${filterStatus} orders.`}
          </p>
          {filterStatus === 'all' && (
            <button 
              onClick={() => window.location.href = '/products'}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Start Shopping
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            if (!order || !order._id) return null;
            
            return (
              <div key={order._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Order #{String(order._id).slice(-8)}</h3>
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus?.current || order.status || 'processing')}`}>
                        {getStatusIcon(order.orderStatus?.current || order.status || 'processing')}
                        {order.orderStatus?.current || order.status || 'Processing'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt />
                        <span>Ordered: {formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaBox />
                        <span>Items: {Array.isArray(order.items) ? order.items.length : 0}</span>
                      </div>
                    </div>
                    
                    {/* Order Items Preview */}
                    {Array.isArray(order.items) && order.items.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Items:</p>
                        <div className="flex flex-wrap gap-2">
                          {order.items.slice(0, 3).map((item, index) => (
                            <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {item.product?.name || item.productName || item.name || 'Unknown Item'} × {item.quantity || 1}
                            </span>
                          ))}
                          {order.items.length > 3 && (
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                              +{order.items.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Order Total & Actions */}
                  <div className="lg:text-right">
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-gray-900">
                        ${order.orderSummary?.total ? order.orderSummary.total.toFixed(2) : (typeof order.total === 'number' ? order.total.toFixed(2) : '0.00')}
                      </p>
                      {order.discount && order.discount > 0 && (
                        <p className="text-sm text-green-600">
                          Saved: ${order.discount.toFixed(2)}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        <FaEye />
                        View Details
                      </button>
                      <button
                        onClick={() => {/* Add download invoice functionality */}}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                      >
                        <FaDownload />
                        Download Invoice
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimesCircle size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Order Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Order ID:</strong> {selectedOrder._id}</p>
                    <p><strong>Status:</strong> {selectedOrder.orderStatus?.current || selectedOrder.status || 'Processing'}</p>
                    <p><strong>Order Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                    <p><strong>Total Amount:</strong> ${selectedOrder.orderSummary?.total ? selectedOrder.orderSummary.total.toFixed(2) : (typeof selectedOrder.total === 'number' ? selectedOrder.total.toFixed(2) : '0.00')}</p>
                  </div>
                </div>
                
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Items Ordered</h3>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg flex justify-between">
                          <div>
                            <p className="font-medium">{item.product?.name || item.productName || item.name || 'Unknown Item'}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity || 1}</p>
                          </div>
                          <p className="font-semibold">
                            ${typeof item.price === 'number' ? (item.price * (item.quantity || 1)).toFixed(2) : '0.00'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedOrder.shippingAddress && (
                  <div>
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p>{selectedOrder.shippingAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
