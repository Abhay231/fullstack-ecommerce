const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createTestUser = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing test users
    await User.deleteMany({ email: 'test@example.com' });
    console.log('🗑️ Cleared existing test users');

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'customer',
      isVerified: true,
      profile: {
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        }
      }
    });

    await testUser.save();
    console.log('✅ Created test user:');
    console.log('   Email: test@example.com');
    console.log('   Password: password123');

    // Create admin user
    const adminHashedPassword = await bcrypt.hash('admin123', 12);
    
    await User.deleteMany({ email: 'admin@example.com' });
    
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminHashedPassword,
      role: 'admin',
      isVerified: true,
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        phone: '+1234567890'
      }
    });

    await adminUser.save();
    console.log('✅ Created admin user:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');

    console.log('\n🎉 Test users created successfully!');
    console.log('📊 Total users in database:', await User.countDocuments());

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

createTestUser();
