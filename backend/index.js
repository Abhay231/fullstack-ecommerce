require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./utils/database');
const redisClient = require('./utils/redis');

// Import handlers
const authHandlers = require('./services/auth/handler');
const productHandlers = require('./services/products/handler');
const cartHandlers = require('./services/cart/handler');
const orderHandlers = require('./services/orders/handler');
const paymentHandlers = require('./services/payments/handler');
const wishlistHandlers = require('./services/wishlist/handler');

// Import order status service
const orderStatusService = require('./services/orderStatusService');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Rate limiting (disabled for development)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use(limiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Helper function to convert Lambda handler to Express middleware
const lambdaToExpress = (handler) => {
  return async (req, res) => {
    const event = {
      httpMethod: req.method,
      path: req.path,
      pathParameters: req.params,
      queryStringParameters: req.query,
      headers: req.headers,
      body: JSON.stringify(req.body)
    };

    const context = {};

    try {
      const result = await handler(event, context);
      res.status(result.statusCode);
      
      // Set headers
      if (result.headers) {
        Object.keys(result.headers).forEach(key => {
          res.set(key, result.headers[key]);
        });
      }
      
      res.send(result.body);
    } catch (error) {
      console.error('Handler error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// Auth routes
app.post('/auth/register', lambdaToExpress(authHandlers.register));
app.post('/auth/login', lambdaToExpress(authHandlers.login));
app.get('/auth/profile', lambdaToExpress(authHandlers.getProfile));
app.post('/auth/update-profile', lambdaToExpress(authHandlers.updateProfile));
app.post('/auth/change-password', lambdaToExpress(authHandlers.changePassword));
app.post('/auth/logout', lambdaToExpress(authHandlers.logout));

// Product routes
app.get('/products', lambdaToExpress(productHandlers.getProducts));
app.get('/products/categories', lambdaToExpress(productHandlers.getCategories));
app.get('/products/brands', lambdaToExpress(productHandlers.getBrands));
app.get('/products/search', lambdaToExpress(productHandlers.searchProducts));
app.get('/products/:id', lambdaToExpress(productHandlers.getProduct));
app.post('/products', lambdaToExpress(productHandlers.createProduct));
app.put('/products/:id', lambdaToExpress(productHandlers.updateProduct));
app.delete('/products/:id', lambdaToExpress(productHandlers.deleteProduct));
app.post('/products/:id/reviews', lambdaToExpress(productHandlers.addReview));

// Cart routes
app.get('/cart/:userId?', lambdaToExpress(cartHandlers.getCart));
app.post('/cart/add', lambdaToExpress(cartHandlers.addToCart));
app.put('/cart/update', lambdaToExpress(cartHandlers.updateCartItem));
app.delete('/cart/remove', lambdaToExpress(cartHandlers.removeFromCart));
app.delete('/cart/clear', lambdaToExpress(cartHandlers.clearCart));
app.get('/cart-summary', lambdaToExpress(cartHandlers.getCartSummary));
app.post('/cart/sync', lambdaToExpress(cartHandlers.syncCart));

// Wishlist routes
app.get('/wishlist', lambdaToExpress(wishlistHandlers.getWishlist));
app.post('/wishlist/add/:productId', lambdaToExpress(wishlistHandlers.addToWishlist));
app.delete('/wishlist/remove/:productId', lambdaToExpress(wishlistHandlers.removeFromWishlist));
app.post('/wishlist/move-to-cart/:productId', lambdaToExpress(wishlistHandlers.moveToCart));
app.delete('/wishlist/clear', lambdaToExpress(wishlistHandlers.clearWishlist));

// Order routes
app.post('/orders', lambdaToExpress(orderHandlers.createOrder));
app.get('/orders/:userId?', lambdaToExpress(orderHandlers.getOrders));
app.get('/orders/details/:orderId', lambdaToExpress(orderHandlers.getOrder));
app.put('/orders/:orderId/status', lambdaToExpress(orderHandlers.updateOrderStatus));
app.post('/orders/:orderId/cancel', lambdaToExpress(orderHandlers.cancelOrder));
app.get('/admin/order-stats', lambdaToExpress(orderHandlers.getOrderStats));

// Payment routes
app.post('/payments/create-intent', lambdaToExpress(paymentHandlers.createPaymentIntent));
app.post('/payments/confirm', lambdaToExpress(paymentHandlers.confirmPayment));
app.post('/payments/webhook', lambdaToExpress(paymentHandlers.handleWebhook));
app.get('/payments/methods', lambdaToExpress(paymentHandlers.getPaymentMethods));
app.post('/payments/refund', lambdaToExpress(paymentHandlers.processRefund));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected successfully');

    // Connect to Redis
    await redisClient.connect();
    console.log('✅ Redis connected successfully');

    // Start order status progression service
    orderStatusService.start(1); // Check every 1 minute
    console.log('✅ Order status progression service started');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  orderStatusService.stop();
  await redisClient.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  orderStatusService.stop();
  await redisClient.disconnect();
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

module.exports = app;
