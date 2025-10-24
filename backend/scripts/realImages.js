console.log('Setting up REAL product images from Unsplash...');

const mongoose = require('mongoose');
const Product = require('../models/Product');

// Real product images from Unsplash - these are direct image URLs that work without CORS issues
const realProductImages = [
  {
    name: 'Premium Wireless Headphones',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop&auto=format',
        alt: 'Premium Wireless Headphones - Front View'
      },
      {
        url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop&auto=format',
        alt: 'Premium Wireless Headphones - Side View'
      }
    ]
  },
  {
    name: 'Smart Fitness Watch',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop&auto=format',
        alt: 'Smart Fitness Watch - Front View'
      },
      {
        url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&h=500&fit=crop&auto=format',
        alt: 'Smart Fitness Watch - Detail View'
      }
    ]
  },
  {
    name: 'Ergonomic Office Chair',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop&auto=format',
        alt: 'Ergonomic Office Chair - Front View'
      },
      {
        url: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500&h=500&fit=crop&auto=format',
        alt: 'Ergonomic Office Chair - Side View'
      }
    ]
  },
  {
    name: 'Bluetooth Speaker',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop&auto=format',
        alt: 'Bluetooth Speaker - Front View'
      },
      {
        url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=500&fit=crop&auto=format',
        alt: 'Bluetooth Speaker - Detail View'
      }
    ]
  },
  {
    name: 'Wireless Gaming Mouse',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop&auto=format',
        alt: 'Wireless Gaming Mouse - Top View'
      },
      {
        url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&h=500&fit=crop&auto=format',
        alt: 'Wireless Gaming Mouse - Side View'
      }
    ]
  },
  {
    name: 'Organic Cotton T-Shirt',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop&auto=format',
        alt: 'Organic Cotton T-Shirt - Front'
      },
      {
        url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500&h=500&fit=crop&auto=format',
        alt: 'Organic Cotton T-Shirt - Back'
      }
    ]
  },
  {
    name: 'Test Headphones',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop&auto=format',
        alt: 'Test Headphones - Premium Design'
      },
      {
        url: 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=500&h=500&fit=crop&auto=format',
        alt: 'Test Headphones - Detail View'
      }
    ]
  },
  {
    name: 'Test Product 2',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&h=500&fit=crop&auto=format',
        alt: 'Smartphone - Latest Model'
      },
      {
        url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop&auto=format',
        alt: 'Smartphone - Back View'
      }
    ]
  }
];

async function setRealImages() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/ecommerce');
    console.log('✅ Connected to MongoDB');

    let updatedCount = 0;

    for (const update of realProductImages) {
      try {
        const result = await Product.updateOne(
          { name: update.name },
          { $set: { images: update.images } }
        );
        
        if (result.matchedCount > 0) {
          console.log(`✅ Updated REAL images for: ${update.name}`);
          console.log(`   Primary URL: ${update.images[0].url}`);
          if (update.images[1]) {
            console.log(`   Secondary URL: ${update.images[1].url}`);
          }
          updatedCount++;
        } else {
          console.log(`⚠️ Product not found: ${update.name}`);
        }
        
        // Small delay to be respectful to Unsplash
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`❌ Failed to update ${update.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} products with REAL Unsplash images!`);
    console.log('🖼️  All images are high-quality stock photos from Unsplash');
    console.log('🚀 Your ecommerce site now has professional product photos!');

  } catch (error) {
    console.error('❌ Error updating product images:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

setRealImages();
