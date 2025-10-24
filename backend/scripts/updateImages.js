console.log('Updating product images with reliable URLs...');

const mongoose = require('mongoose');
const Product = require('../models/Product');

const productUpdates = [
  {
    name: 'Premium Wireless Headphones',
    images: [
      {
        url: 'https://via.placeholder.com/500x500/1a1a1a/ffffff?text=Premium+Headphones',
        alt: 'Premium Wireless Headphones'
      },
      {
        url: 'https://via.placeholder.com/500x500/2d2d2d/ffffff?text=Headphones+Detail',
        alt: 'Headphones Detail View'
      }
    ]
  },
  {
    name: 'Smart Fitness Watch',
    images: [
      {
        url: 'https://via.placeholder.com/500x500/0066cc/ffffff?text=Smart+Watch',
        alt: 'Smart Fitness Watch'
      }
    ]
  },
  {
    name: 'Ergonomic Office Chair',
    images: [
      {
        url: 'https://via.placeholder.com/500x500/8B4513/ffffff?text=Office+Chair',
        alt: 'Ergonomic Office Chair'
      }
    ]
  },
  {
    name: 'Bluetooth Speaker',
    images: [
      {
        url: 'https://via.placeholder.com/500x500/FF6B35/ffffff?text=Bluetooth+Speaker',
        alt: 'Bluetooth Speaker'
      }
    ]
  },
  {
    name: 'Wireless Gaming Mouse',
    images: [
      {
        url: 'https://via.placeholder.com/500x500/7B68EE/ffffff?text=Gaming+Mouse',
        alt: 'Wireless Gaming Mouse'
      }
    ]
  },
  {
    name: 'Organic Cotton T-Shirt',
    images: [
      {
        url: 'https://via.placeholder.com/500x500/32CD32/ffffff?text=Cotton+T-Shirt',
        alt: 'Organic Cotton T-Shirt'
      }
    ]
  },
  {
    name: 'Test Headphones',
    images: [
      {
        url: 'https://via.placeholder.com/500x500/DC143C/ffffff?text=Test+Headphones',
        alt: 'Test Headphones'
      }
    ]
  },
  {
    name: 'Test Product 2',
    images: [
      {
        url: 'https://via.placeholder.com/500x500/FF1493/ffffff?text=Test+Product+2',
        alt: 'Test Product 2'
      }
    ]
  }
];

async function updateProductImages() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/ecommerce');
    console.log('✅ Connected to MongoDB');

    let updatedCount = 0;

    for (const update of productUpdates) {
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

    console.log(`\n🎉 Successfully updated ${updatedCount} products with new images`);

  } catch (error) {
    console.error('❌ Error updating product images:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

updateProductImages();
