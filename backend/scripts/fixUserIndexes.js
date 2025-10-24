const mongoose = require('mongoose');
require('dotenv').config();

const fixUserIndexes = async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    console.log('📋 Checking existing indexes...');
    const indexes = await usersCollection.indexes();
    console.log('Current indexes:', indexes.map(index => index.name));

    // Drop the problematic username index if it exists
    try {
      await usersCollection.dropIndex('username_1');
      console.log('🗑️ Dropped username_1 index');
    } catch (error) {
      if (error.codeName === 'IndexNotFound') {
        console.log('ℹ️ username_1 index not found (already dropped)');
      } else {
        console.log('⚠️ Error dropping index:', error.message);
      }
    }

    // Ensure the email index exists and is unique
    try {
      await usersCollection.createIndex({ email: 1 }, { unique: true });
      console.log('✅ Created/ensured email unique index');
    } catch (error) {
      console.log('ℹ️ Email index already exists');
    }

    console.log('📋 Final indexes:');
    const finalIndexes = await usersCollection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n🎉 Index cleanup completed!');

  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

fixUserIndexes();
