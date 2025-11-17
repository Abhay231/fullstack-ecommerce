const mongoose = require('mongoose');
// bcrypt not needed - Mongoose pre-save will hash passwords
const User = require('../models/User');
require('dotenv').config();

const createTestUser = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing demo users (if exist)
    await User.deleteMany({ email: { $in: ['user@demo.com', 'admin@demo.com'] } });

    // Create demo test user (password stored plain here; Mongoose pre-save will hash it)
    const testUser = new User({
      name: 'Demo User',
      email: 'user@demo.com',
      password: 'password123',
      role: 'user',
      isVerified: true,
      profile: {
        firstName: 'Demo',
        lastName: 'User',
        phone: '+1234567890',
        address: {
          street: '123 Demo Street',
          city: 'Demo City',
          state: 'Demo State',
          zipCode: '12345',
          country: 'Demo Country'
        }
      }
    });

    await testUser.save();
    console.log('✅ Created demo user:');
    console.log('   Email: user@demo.com');
    console.log('   Password: password123');

    // Create demo admin user (password stored plain here; Mongoose pre-save will hash it)
    const adminUser = new User({
      name: 'Demo Admin',
      email: 'admin@demo.com',
      password: 'password123',
      role: 'admin',
      isVerified: true,
      profile: {
        firstName: 'Admin',
        lastName: 'Demo',
        phone: '+1234567890'
      }
    });

    await adminUser.save();
    console.log('✅ Created demo admin user:');
    console.log('   Email: admin@demo.com');
    console.log('   Password: password123');

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
