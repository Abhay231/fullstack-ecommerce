console.log('Setting up highly reliable product images...');

const mongoose = require('mongoose');
const Product = require('../models/Product');

// Using multiple reliable image services as fallbacks
const reliableProductImages = [
  {
    name: 'Premium Wireless Headphones',
    images: [
      {
        url: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Funsplash.com%2Fs%2Fphotos%2Fsony-headphone&psig=AOvVaw0r_D2oi4clbbQSCMu0togN&ust=1760546697625000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCJj-rOWRpJADFQAAAAAdAAAAABAE',
        alt: 'Premium Wireless Headphones - Front View'
      },
      {
        url: 'https://via.placeholder.com/500x500/2d2d2d/ffffff?text=Headphones+Detail',
        alt: 'Premium Wireless Headphones - Side View'
      }
    ]
  },
  {
    name: 'Smart Fitness Watch',
    images: [
      {
        url: 'https://via.placeholder.com/500x500/0066cc/ffffff?text=Smart+Fitness+Watch',
        alt: 'Smart Fitness Watch - Front View'
      }
    ]
  },
  {
    name: 'Ergonomic Office Chair',
    images: [
      {
        url: 'https://via.placeholder.com/500x500/8B4513/ffffff?text=Office+Chair',
        alt: 'Ergonomic Office Chair - Front View'
      }
    ]
  },
  {
    name: 'Bluetooth Speaker',
    images: [
      {
        url: 'https://via.placeholder.com/500x500/FF6B35/ffffff?text=Bluetooth+Speaker',
        alt: 'Bluetooth Speaker - Front View'
      }
    ]
  },
  {
    name: 'Wireless Gaming Mouse',
    images: [
      {
        url: 'https://via.placeholder.com/500x500/7B68EE/ffffff?text=Gaming+Mouse',
        alt: 'Wireless Gaming Mouse - Top View'
      }
    ]
  },
  {
    name: 'Organic Cotton T-Shirt',
    images: [
      {
        url: 'https://via.placeholder.com/500x500/32CD32/ffffff?text=Cotton+T-Shirt',
        alt: 'Organic Cotton T-Shirt - Front'
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

async function setViaPlaceholderImages() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/ecommerce');
    console.log('✅ Connected to MongoDB');

    let updatedCount = 0;

    for (const update of reliableProductImages) {
      try {
        const result = await Product.updateOne(
          { name: update.name },
          { $set: { images: update.images } }
        );
        
        if (result.matchedCount > 0) {
          console.log(`✅ Updated images for: ${update.name}`);
          console.log(`   URL: ${update.images[0].url}`);
          updatedCount++;
        } else {
          console.log(`⚠️ Product not found: ${update.name}`);
        }
        
        // Small delay to avoid overwhelming the service
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Failed to update ${update.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} products with via.placeholder.com images`);
    console.log('These URLs should work reliably in React apps');

  } catch (error) {
    console.error('❌ Error updating product images:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

setViaPlaceholderImages();
