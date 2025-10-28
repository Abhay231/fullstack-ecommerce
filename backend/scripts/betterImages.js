console.log('Adding better product images...');

const mongoose = require('mongoose');
const Product = require('../models/Product');

const betterProductImages = [
  {
    name: 'Premium Wireless Headphones',
    images: [
      {
        url: 'https://picsum.photos/500/500?random=1',
        alt: 'Premium Wireless Headphones - Front View'
      },
      {
        url: 'https://picsum.photos/500/500?random=2',
        alt: 'Premium Wireless Headphones - Side View'
      }
    ]
  },
  {
    name: 'Smart Fitness Watch',
    images: [
      {
        url: 'https://picsum.photos/500/500?random=3',
        alt: 'Smart Fitness Watch - Front View'
      }
    ]
  },
  {
    name: 'Ergonomic Office Chair',
    images: [
      {
        url: 'https://picsum.photos/500/500?random=4',
        alt: 'Ergonomic Office Chair - Front View'
      }
    ]
  },
  {
    name: 'Bluetooth Speaker',
    images: [
      {
        url: 'https://picsum.photos/500/500?random=5',
        alt: 'Bluetooth Speaker - Front View'
      }
    ]
  },
  {
    name: 'Wireless Gaming Mouse',
    images: [
      {
        url: 'https://picsum.photos/500/500?random=6',
        alt: 'Wireless Gaming Mouse - Top View'
      }
    ]
  },
  {
    name: 'Organic Cotton T-Shirt',
    images: [
      {
        url: 'https://picsum.photos/500/500?random=7',
        alt: 'Organic Cotton T-Shirt - Front'
      }
    ]
  },
  {
    name: 'Test Headphones',
    images: [
      {
        url: 'https://picsum.photos/500/500?random=8',
        alt: 'Test Headphones'
      }
    ]
  },
  {
    name: 'Test Product 2',
    images: [
      {
        url: 'https://picsum.photos/500/500?random=9',
        alt: 'Test Product 2'
      }
    ]
  }
];

async function updateWithBetterImages() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    let updatedCount = 0;

    for (const update of betterProductImages) {
      try {
        const result = await Product.updateOne(
          { name: update.name },
          { $set: { images: update.images } }
        );
        
        if (result.matchedCount > 0) {
          console.log(`✅ Updated images for: ${update.name}`);
          updatedCount++;
        } else {
          console.log(`⚠️ Product not found: ${update.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to update ${update.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} products with better images`);
    console.log('Images now use Lorem Picsum service for better visual appeal');

  } catch (error) {
    console.error('❌ Error updating product images:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

updateWithBetterImages();
