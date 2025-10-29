const Order = require('../models/Order');

class OrderStatusService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
  }

  // Start the automatic order status progression service
  start(intervalMinutes = 1) {
    if (this.isRunning) {
      console.log('Order status service is already running');
      return;
    }

    console.log(`Starting order status progression service (checking every ${intervalMinutes} minute(s))`);
    this.isRunning = true;

    // Run immediately on start
    this.updateOrderStatuses();

    // Then run at specified interval
    this.intervalId = setInterval(() => {
      this.updateOrderStatuses();
    }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds
  }

  // Stop the service
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Order status progression service stopped');
  }

  // Update order statuses based on time elapsed
  async updateOrderStatuses() {
    try {
    //   console.log('Running order status progression check...');
      
      const now = new Date();
      
      // Find orders that need status updates
      const orders = await Order.find({
        'orderStatus.current': { $in: ['pending', 'confirmed', 'processing', 'shipped'] }
      });

      let updatedCount = 0;

      for (const order of orders) {
        const createdAt = new Date(order.createdAt);
        const minutesElapsed = Math.floor((now - createdAt) / (1000 * 60));
        
        let newStatus = null;

        // Status progression rules based on time elapsed
        if (order.orderStatus.current === 'pending' && minutesElapsed >= 2) {
          newStatus = 'confirmed';
        } else if (order.orderStatus.current === 'confirmed' && minutesElapsed >= 5) {
          newStatus = 'processing';
        } else if (order.orderStatus.current === 'processing' && minutesElapsed >= 8) {
          newStatus = 'shipped';
        } else if (order.orderStatus.current === 'shipped' && minutesElapsed >= 12) {
          newStatus = 'delivered';
        }

        if (newStatus) {
          try {
            await order.updateStatus(newStatus, 'Automatic status progression');
            updatedCount++;
            console.log(`Updated order ${order._id} to ${newStatus} (${minutesElapsed} minutes elapsed)`);
          } catch (error) {
            console.error(`Error updating order ${order._id}:`, error.message);
          }
        }
      }
    //   if (updatedCount > 0) {
    //     console.log(`Updated ${updatedCount} order(s) status`);
    //   } else {
    //     console.log('No orders required status updates');
    //   }

    } catch (error) {
      console.error('Error in order status progression:', error);
    }
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId
    };
  }
}

// Create singleton instance
const orderStatusService = new OrderStatusService();

module.exports = orderStatusService;
