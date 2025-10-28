const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
require('dotenv').config();

const createIndexes = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    console.log('📊 Creating database indexes for better performance...');

    // Create indexes for all models
    await Promise.all([
      Product.ensureIndexes(),
      User.ensureIndexes(),
      Order.ensureIndexes(),
      Cart.ensureIndexes(),
    ]);

    console.log('✅ Successfully created all database indexes');
    console.log('🚀 Database performance optimized!');

  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

createIndexes();
