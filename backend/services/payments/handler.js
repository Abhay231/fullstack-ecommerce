require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const connectDB = require('../../utils/database');
const redisClient = require('../../utils/redis');
const Order = require('../../models/Order');
const { authenticate } = require('../../utils/auth');
const {
  lambdaWrapper,
  successResponse,
  errorResponse,
  notFoundResponse,
  parseBody,
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

// Create payment intent for Stripe
const createPaymentIntent = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const body = parseBody(event);
  
  validateRequiredFields(body, ['orderId']);

  const { orderId } = body;

  // Get order
  const order = await Order.findById(orderId);
  if (!order) {
    return notFoundResponse('Order');
  }

  // Verify user owns this order
  if (order.user.toString() !== user._id.toString()) {
    return errorResponse('Access denied', 403);
  }

  // Check if order is already paid
  if (order.paymentInfo.paymentStatus === 'completed') {
    return errorResponse('Order is already paid', 400);
  }

  try {
    // Create payment intent without payment method (will be added during confirmation)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.orderSummary.total * 100), // Stripe uses cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: orderId,
        userId: user._id.toString(),
        orderNumber: order.orderNumber
      },
      description: `Payment for order ${order.orderNumber}`,
      receipt_email: user.email
    });

    // Update order with payment intent ID
    order.paymentInfo.transactionId = paymentIntent.id;
    await order.save();

    // Cache payment intent for future reference
    await redisClient.set(`payment:${paymentIntent.id}`, {
      orderId,
      userId: user._id,
      amount: order.orderSummary.total
    }, 3600); // Cache for 1 hour

    return successResponse({
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status
      },
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        total: order.orderSummary.total
      }
    }, 'Payment intent created successfully');

  } catch (error) {
    console.error('Stripe payment intent error:', error);
    return errorResponse(`Payment processing failed: ${error.message}`, 400);
  }
});

// Confirm payment
const confirmPayment = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const body = parseBody(event);
  
  validateRequiredFields(body, ['paymentIntentId']);

  const { paymentIntentId } = body;
  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log(`2. Stripe payment intent retrieved - Status: ${paymentIntent.status}, Amount: ${paymentIntent.amount}`);

    if (!paymentIntent) {
      return errorResponse('Payment intent not found', 404);
    }

    // Find order by transaction ID first
    let order = await Order.findOne({ 'paymentInfo.transactionId': paymentIntentId });
    
    if (!order) {
      // Find the most recent pending order for this user
      order = await Order.findOne({ 
        user: user._id,
        'paymentInfo.paymentStatus': { $in: ['pending', 'processing'] }
      }).sort({ createdAt: -1 });
      
      if (!order) {
        return errorResponse('No pending orders found. Please create a new order.', 404);
      }
      
      // Update this order with the transaction ID
      order.paymentInfo.transactionId = paymentIntentId;
      await order.save();
    }
    
    // Verify user owns this order
    if (order.user.toString() !== user._id.toString()) {
      return errorResponse('Access denied', 403);
    }

    // Check payment status
    if (paymentIntent.status === 'succeeded') {
      
      // Update order payment status
      order.paymentInfo.paymentStatus = 'completed';
      order.paymentInfo.paidAt = new Date();
      order.paymentInfo.transactionId = paymentIntentId;
      
      console.log(`13. Saving order with payment info...`);
      // Save order first
      await order.save();
      console.log(`14. Order saved successfully`);
      
      // Update order status to confirmed
      console.log(`15. Updating order status to confirmed...`);
      await order.updateStatus('confirmed', 'Payment completed successfully');
      console.log(`16. Order status updated to confirmed successfully`);

      // Clear payment cache (if Redis is available)
      try {
        await redisClient.del(`payment:${paymentIntentId}`);
      } catch (error) {
        console.log('Redis cache clear failed (non-critical):', error.message);
      }

      return successResponse({
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.orderStatus.current,
          paymentStatus: order.paymentInfo.paymentStatus,
          total: order.orderSummary.total
        }
      }, 'Payment confirmed successfully');

    } else if (paymentIntent.status === 'requires_action') {
      return successResponse({
        requires_action: true,
        payment_intent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret
        }
      }, 'Payment requires additional action');

    } else {
      // Payment failed
      order.paymentInfo.paymentStatus = 'failed';
      await order.save();

      return errorResponse('Payment failed', 400);
    }

  } catch (error) {
    console.error('Payment confirmation error:', error);
    console.error('Error stack:', error.stack);
    return errorResponse(`Payment confirmation failed: ${error.message}`, 500);
  }
});

// Test endpoint to check user orders
const testUserOrders = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  
  console.log(`Testing user orders for user: ${user._id}`);
  
  const allOrders = await Order.find({ user: user._id }).sort({ createdAt: -1 });
  const pendingOrders = await Order.find({ 
    user: user._id,
    'paymentInfo.paymentStatus': { $in: ['pending', 'processing'] }
  }).sort({ createdAt: -1 });
  
  console.log(`Found ${allOrders.length} total orders, ${pendingOrders.length} pending orders`);
  
  return successResponse({
    totalOrders: allOrders.length,
    pendingOrders: pendingOrders.length,
    orders: allOrders.map(order => ({
      id: order._id,
      status: order.orderStatus.current,
      paymentStatus: order.paymentInfo.paymentStatus,
      transactionId: order.paymentInfo.transactionId,
      total: order.orderSummary.total,
      createdAt: order.createdAt
    }))
  }, 'User orders retrieved');
});

// Handle Stripe webhook
const handleWebhook = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return errorResponse('Webhook signature verification failed', 400);
  }

  try {
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = stripeEvent.data.object;
        const orderId = paymentIntent.metadata.orderId;
        
        if (orderId) {
          const order = await Order.findById(orderId);
          if (order && order.paymentInfo.paymentStatus !== 'completed') {
            order.paymentInfo.paymentStatus = 'completed';
            order.paymentInfo.paidAt = new Date();
            await order.updateStatus('confirmed', 'Payment completed via webhook');
            
            // Clear caches
            await redisClient.del(`order:${orderId}`);
            await redisClient.del(`orders:${order.user}:*`);
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = stripeEvent.data.object;
        const failedOrderId = failedPayment.metadata.orderId;
        
        if (failedOrderId) {
          const order = await Order.findById(failedOrderId);
          if (order) {
            order.paymentInfo.paymentStatus = 'failed';
            await order.save();
          }
        }
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return successResponse(null, 'Webhook processed successfully');

  } catch (error) {
    console.error('Webhook processing error:', error);
    return errorResponse('Webhook processing failed', 500);
  }
});

// Get payment methods for user
const getPaymentMethods = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);

  try {
    // In a real application, you would store customer ID and retrieve their payment methods
    // For this example, we'll return a simple structure
    const paymentMethods = [
      {
        id: 'card',
        type: 'card',
        name: 'Credit/Debit Card',
        description: 'Pay with your credit or debit card',
        enabled: true
      },
      {
        id: 'paypal',
        type: 'paypal',
        name: 'PayPal',
        description: 'Pay with your PayPal account',
        enabled: false // Would be enabled based on configuration
      },
      {
        id: 'cash_on_delivery',
        type: 'cash_on_delivery',
        name: 'Cash on Delivery',
        description: 'Pay when your order is delivered',
        enabled: true
      }
    ];

    return successResponse(paymentMethods, 'Payment methods retrieved successfully');

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return errorResponse('Failed to fetch payment methods', 500);
  }
});

// Process refund
const processRefund = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const body = parseBody(event);
  
  validateRequiredFields(body, ['orderId']);

  const { orderId, amount, reason } = body;

  // Get order
  const order = await Order.findById(orderId);
  if (!order) {
    return notFoundResponse('Order');
  }

  // Check permissions
  if (order.user.toString() !== user._id.toString() && user.role !== 'admin') {
    return errorResponse('Access denied', 403);
  }

  // Check if order is paid
  if (order.paymentInfo.paymentStatus !== 'completed') {
    return errorResponse('Order is not paid yet', 400);
  }

  // Check if already refunded
  if (order.refund.status === 'completed') {
    return errorResponse('Order is already refunded', 400);
  }

  try {
    const refundAmount = amount || order.orderSummary.total;
    
    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentInfo.transactionId,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: 'requested_by_customer',
      metadata: {
        orderId: orderId,
        reason: reason || 'Customer request'
      }
    });

    // Update order refund status
    order.refund = {
      status: 'completed',
      amount: refundAmount,
      reason: reason || 'Customer request',
      processedAt: new Date()
    };

    // Update order status
    await order.updateStatus('returned', 'Refund processed');

    // Clear caches
    await redisClient.del(`order:${orderId}`);
    await redisClient.del(`orders:${order.user}:*`);

    return successResponse({
      refund: {
        id: refund.id,
        amount: refundAmount,
        status: refund.status
      },
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        refundStatus: order.refund.status
      }
    }, 'Refund processed successfully');

  } catch (error) {
    console.error('Refund processing error:', error);
    
    // Update order with failed refund status
    order.refund.status = 'rejected';
    await order.save();
    
    return errorResponse(`Refund processing failed: ${error.message}`, 400);
  }
});

module.exports = {
  createPaymentIntent,
  confirmPayment,
  testUserOrders,
  handleWebhook,
  getPaymentMethods,
  processRefund
};
