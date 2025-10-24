require('dotenv').config();
const connectDB = require('../../utils/database');
const redisClient = require('../../utils/redis');
const Order = require('../../models/Order');
const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const { authenticate, requireAdmin } = require('../../utils/auth');
const {
  lambdaWrapper,
  successResponse,
  errorResponse,
  notFoundResponse,
  paginatedResponse,
  parseBody,
  getQueryParams,
  getPathParams,
  validateRequiredFields
} = require('../../utils/response');

// Initialize database connection
let dbConnection = null;
const initDB = async () => {
  if (!dbConnection) {
    dbConnection = await connectDB();
    await redisClient.connect();
  }
};

// Create new order
const createOrder = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const body = parseBody(event);
  
  validateRequiredFields(body, ['shippingAddress']);

  const { shippingAddress, billingAddress, paymentMethod = 'stripe', notes } = body;

  // Get user's cart
  const cart = await Cart.findOne({ user: user._id })
    .populate('items.product', 'name price images inventory status discountedPrice');

  if (!cart || cart.items.length === 0) {
    return errorResponse('Cart is empty', 400);
  }

  // Validate cart items and check inventory
  const orderItems = [];
  let subtotal = 0;

  for (const cartItem of cart.items) {
    const product = cartItem.product;
    
    if (!product || product.status !== 'active') {
      return errorResponse(`Product ${product ? product.name : 'Unknown'} is no longer available`, 400);
    }

    if (product.inventory.quantity < cartItem.quantity) {
      return errorResponse(`Insufficient stock for ${product.name}. Available: ${product.inventory.quantity}`, 400);
    }

    const itemPrice = product.discountedPrice || product.price;
    const itemTotal = itemPrice * cartItem.quantity;

    orderItems.push({
      product: product._id,
      productName: product.name,
      productImage: product.images[0]?.url || '',
      quantity: cartItem.quantity,
      price: itemPrice,
      selectedVariants: cartItem.selectedVariants
    });

    subtotal += itemTotal;
  }

  // Calculate order totals
  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const total = subtotal + tax + shipping;

  // Create order
  const order = await Order.create({
    user: user._id,
    items: orderItems,
    orderSummary: {
      subtotal,
      tax,
      shipping,
      discount: 0,
      total
    },
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    paymentInfo: {
      method: paymentMethod,
      paymentStatus: 'pending'
    },
    notes: notes || {}
  });

  // Update product inventory
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { 'inventory.quantity': -item.quantity } }
    );
  }

  // Clear user's cart
  await cart.clearCart();

  // Clear cart cache
  await redisClient.del(`cart:${user._id}`);

  // Populate order with user details
  await order.populate('user', 'name email phone');

  return successResponse(order, 'Order created successfully', 201);
});

// Get user's orders
const getOrders = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const { userId } = getPathParams(event);
  const query = getQueryParams(event);
  
  // Admin can view any user's orders, regular users can only view their own
  let targetUserId = user._id;
  if (userId && user.role === 'admin') {
    targetUserId = userId;
  } else if (userId && userId !== user._id.toString()) {
    return errorResponse('Access denied', 403);
  }

  const {
    page = 1,
    limit = 10,
    status,
    sort = '-createdAt'
  } = query;

  const cacheKey = `orders:${targetUserId}:${JSON.stringify(query)}`;
  let result = await redisClient.get(cacheKey);

  if (!result) {
    // Build filter
    const filter = { user: targetUserId };
    if (status) {
      filter['orderStatus.current'] = status;
    }

    // Build sort
    let sortObject = {};
    if (sort.startsWith('-')) {
      sortObject[sort.substring(1)] = -1;
    } else {
      sortObject[sort] = 1;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'name email')
        .populate('items.product', 'name category price images')
        .lean(),
      Order.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalOrders / limitNum);

    result = {
      items: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages,
        totalItems: totalOrders
      }
    };

    // Cache for 2 minutes
    await redisClient.set(cacheKey, result, 120);
  }

  return paginatedResponse(result.items, result.pagination, 'Orders retrieved successfully');
});

// Get single order details
const getOrder = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const { orderId } = getPathParams(event);

  if (!orderId) {
    return errorResponse('Order ID is required', 400);
  }

  const cacheKey = `order:${orderId}`;
  let order = await redisClient.get(cacheKey);

  if (!order) {
    order = await Order.findById(orderId)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images')
      .lean();

    if (!order) {
      return notFoundResponse('Order');
    }

    // Cache for 5 minutes
    await redisClient.set(cacheKey, order, 300);
  }

  // Check if user can access this order
  if (user.role !== 'admin' && order.user._id.toString() !== user._id.toString()) {
    return errorResponse('Access denied', 403);
  }

  return successResponse(order, 'Order retrieved successfully');
});

// Update order status (Admin only)
const updateOrderStatus = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await requireAdmin(event);
  const { orderId } = getPathParams(event);
  const body = parseBody(event);

  validateRequiredFields(body, ['status']);

  const { status, note, tracking } = body;

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (!validStatuses.includes(status)) {
    return errorResponse('Invalid order status', 400);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return notFoundResponse('Order');
  }

  // Update status
  await order.updateStatus(status, note);

  // Update tracking info if provided
  if (tracking) {
    Object.assign(order.tracking, tracking);
    await order.save();
  }

  // If order is cancelled, restore inventory
  if (status === 'cancelled' && order.orderStatus.current !== 'cancelled') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { 'inventory.quantity': item.quantity } }
      );
    }
  }

  // Clear cache
  await redisClient.del(`order:${orderId}`);
  await redisClient.del(`orders:${order.user}:*`);

  await order.populate('user', 'name email phone');

  return successResponse(order, 'Order status updated successfully');
});

// Cancel order (User can cancel their own pending orders)
const cancelOrder = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const { orderId } = getPathParams(event);
  const body = parseBody(event);

  const { reason } = body;

  const order = await Order.findById(orderId);
  if (!order) {
    return notFoundResponse('Order');
  }

  // Check if user can cancel this order
  if (order.user.toString() !== user._id.toString() && user.role !== 'admin') {
    return errorResponse('Access denied', 403);
  }

  // Check if order can be cancelled
  const cancellableStatuses = ['pending', 'confirmed'];
  if (!cancellableStatuses.includes(order.orderStatus.current)) {
    return errorResponse('Order cannot be cancelled at this stage', 400);
  }

  // Update order status
  await order.updateStatus('cancelled', `Cancelled by ${user.role === 'admin' ? 'admin' : 'customer'}`);
  
  order.cancellation = {
    reason: reason || 'Cancelled by customer',
    cancelledAt: new Date(),
    cancelledBy: user._id
  };
  await order.save();

  // Restore inventory
  for (const item of order.items) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { 'inventory.quantity': item.quantity } }
    );
  }

  // Clear cache
  await redisClient.del(`order:${orderId}`);
  await redisClient.del(`orders:${order.user}:*`);

  return successResponse(order, 'Order cancelled successfully');
});

// Get order statistics (Admin only)
const getOrderStats = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await requireAdmin(event);
  const query = getQueryParams(event);
  const { period = '30d' } = query;

  const cacheKey = `order:stats:${period}`;
  let stats = await redisClient.get(cacheKey);

  if (!stats) {
    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } };
        break;
      case '1y':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } };
        break;
    }

    const [
      totalOrders,
      totalRevenue,
      statusCounts,
      averageOrderValue
    ] = await Promise.all([
      Order.countDocuments(dateFilter),
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$orderSummary.total' } } }
      ]),
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$orderStatus.current', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, avg: { $avg: '$orderSummary.total' } } }
      ])
    ]);

    stats = {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      averageOrderValue: averageOrderValue[0]?.avg || 0,
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      period
    };

    // Cache for 10 minutes
    await redisClient.set(cacheKey, stats, 600);
  }

  return successResponse(stats, 'Order statistics retrieved successfully');
});

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats
};
