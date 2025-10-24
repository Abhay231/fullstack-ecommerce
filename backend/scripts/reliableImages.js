console.log('Setting up reliable product images...');

const mongoose = require('mongoose');
const Product = require('../models/Product');

// Using reliable placeholder services and fallback options
const reliableProductImages = [
  {
    name: 'Premium Wireless Headphones',
    images: [
      {
        url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeZ4ir9_3fx7L8Ew2TUx3WanTGMfm2kUkPAA&s',
        alt: 'Premium Wireless Headphones - Front View'
      },
      {
        url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeZ4ir9_3fx7L8Ew2TUx3WanTGMfm2kUkPAA&s',
        alt: 'Premium Wireless Headphones - Side View'
      }
    ]
  },
  {
    name: 'Smart Fitness Watch',
    images: [
      {
        url: 'https://placehold.co/500x500/0066cc/ffffff/png?text=Smart+Fitness+Watch',
        alt: 'Smart Fitness Watch - Front View'
      }
    ]
  },
  {
    name: 'Ergonomic Office Chair',
    images: [
      {
        url: 'https://placehold.co/500x500/8B4513/ffffff/png?text=Office+Chair',
        alt: 'Ergonomic Office Chair - Front View'
      }
    ]
  },
  {
    name: 'Bluetooth Speaker',
    images: [
      {
        url: 'https://placehold.co/500x500/FF6B35/ffffff/png?text=Bluetooth+Speaker',
        alt: 'Bluetooth Speaker - Front View'
      }
    ]
  },
  {
    name: 'Wireless Gaming Mouse',
    images: [
      {
        url: 'https://placehold.co/500x500/7B68EE/ffffff/png?text=Gaming+Mouse',
        alt: 'Wireless Gaming Mouse - Top View'
      }
    ]
  },
  {
    name: 'Organic Cotton T-Shirt',
    images: [
      {
        url: 'https://placehold.co/500x500/32CD32/ffffff/png?text=Cotton+T-Shirt',
        alt: 'Organic Cotton T-Shirt - Front'
      }
    ]
  },
  {
    name: 'Test Headphones',
    images: [
      {
        url: 'https://placehold.co/500x500/DC143C/ffffff/png?text=Test+Headphones',
        alt: 'Test Headphones'
      }
    ]
  },
  {
    name: 'Test Product 2',
    images: [
      {
        url: 'https://placehold.co/500x500/FF1493/ffffff/png?text=Test+Product+2',
        alt: 'Test Product 2'
      }
    ]
  }
];

async function setReliableImages() {
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

    console.log(`\n🎉 Successfully updated ${updatedCount} products with reliable images`);
    console.log('Using placehold.co service which should be more stable');

  } catch (error) {
    console.error('❌ Error updating product images:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

setReliableImages();
