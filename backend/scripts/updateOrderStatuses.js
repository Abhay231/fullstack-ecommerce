require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');

const updateOrderStatuses = async () => {
  try {
    console.log('🔄 Starting order status updates...');
    
    const now = new Date();
    
    // Update pending orders to confirmed after 2 minutes
    const pendingOrders = await Order.find({
      'orderStatus.current': 'pending',
      'createdAt': { $lt: new Date(now.getTime() - 2 * 60 * 1000) } // 2 minutes ago
    });
    
    for (const order of pendingOrders) {
      order.updateStatus('confirmed', 'Order automatically confirmed');
      await order.save();
      console.log(`✅ Order ${order.orderNumber} confirmed`);
    }
    
    // Update confirmed orders to processing after 5 minutes
    const confirmedOrders = await Order.find({
      'orderStatus.current': 'confirmed',
      'createdAt': { $lt: new Date(now.getTime() - 5 * 60 * 1000) } // 5 minutes ago
    });
    
    for (const order of confirmedOrders) {
      order.updateStatus('processing', 'Order moved to processing');
      await order.save();
      console.log(`🔄 Order ${order.orderNumber} processing`);
    }
    
    // Update processing orders to shipped after 8 minutes
    const processingOrders = await Order.find({
      'orderStatus.current': 'processing',
      'createdAt': { $lt: new Date(now.getTime() - 8 * 60 * 1000) } // 8 minutes ago
    });
    
    for (const order of processingOrders) {
      order.updateStatus('shipped', 'Order shipped');
      await order.save();
      console.log(`🚚 Order ${order.orderNumber} shipped`);
    }
    
    // Update shipped orders to delivered after 12 minutes
    const shippedOrders = await Order.find({
      'orderStatus.current': 'shipped',
      'createdAt': { $lt: new Date(now.getTime() - 12 * 60 * 1000) } // 12 minutes ago
    });
    
    for (const order of shippedOrders) {
      order.updateStatus('delivered', 'Order delivered');
      await order.save();
      console.log(`📦 Order ${order.orderNumber} delivered`);
    }
    
    console.log('✅ Order status updates completed');
    
  } catch (error) {
    console.error('❌ Error updating order statuses:', error);
  }
};

// Run the update function
updateOrderStatuses().then(() => {
  console.log('🎉 Script completed');
  process.exit(0);
});
