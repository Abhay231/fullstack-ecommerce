console.log('Starting product seeding...');

const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const sampleProducts = [
  {
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    price: 299.99,
    originalPrice: 399.99,
    category: 'Electronics',
    brand: 'AudioTech',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
        alt: 'Premium Wireless Headphones - Front View'
      },
      {
        url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop',
        alt: 'Premium Wireless Headphones - Side View'
      }
    ],
    inventory: {
      quantity: 50,
      threshold: 10
    },
    features: ['Noise Cancellation', 'Wireless', '30hr Battery', 'Premium Sound'],
    specifications: {
      'Battery Life': '30 hours',
      'Connectivity': 'Bluetooth 5.0',
      'Weight': '250g',
      'Warranty': '2 years'
    },
    tags: ['electronics', 'audio', 'wireless', 'premium'],
    status: 'active',
    featured: true
  },
  {
    name: 'Smart Fitness Watch',
    description: 'Advanced fitness tracking smartwatch with heart rate monitor, GPS, and 7-day battery life.',
    price: 199.99,
    category: 'Electronics',
    brand: 'FitPro',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
        alt: 'Smart Fitness Watch - Front View'
      }
    ],
    inventory: {
      quantity: 75,
      threshold: 10
    },
    features: ['Heart Rate Monitor', 'GPS Tracking', 'Water Resistant', '7-day Battery'],
    specifications: {
      'Display': '1.4" AMOLED',
      'Battery': '7 days',
      'Water Resistance': '5ATM'
    },
    tags: ['fitness', 'smartwatch', 'health', 'sports'],
    status: 'active',
    featured: true
  },
  {
    name: 'Ergonomic Office Chair',
    description: 'Professional ergonomic office chair with lumbar support and adjustable height.',
    price: 449.99,
    originalPrice: 599.99,
    category: 'Home & Garden',
    brand: 'ComfortPro',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop',
        alt: 'Ergonomic Office Chair'
      }
    ],
    inventory: {
      quantity: 30,
      threshold: 5
    },
    features: ['Lumbar Support', 'Adjustable Height', 'Premium Materials'],
    specifications: {
      'Material': 'Premium Mesh & Leather',
      'Weight Capacity': '300 lbs',
      'Warranty': '5 years'
    },
    tags: ['office', 'furniture', 'ergonomic', 'chair'],
    status: 'active',
    featured: true
  },
  {
    name: 'Bluetooth Speaker',
    description: 'Portable Bluetooth speaker with 360-degree sound and waterproof design.',
    price: 79.99,
    category: 'Electronics',
    brand: 'AudioTech',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop',
        alt: 'Bluetooth Speaker'
      }
    ],
    inventory: {
      quantity: 80,
      threshold: 15
    },
    features: ['360° Sound', 'Waterproof', '20hr Battery', 'Portable'],
    specifications: {
      'Battery Life': '20 hours',
      'Water Rating': 'IPX7',
      'Connectivity': 'Bluetooth 5.0'
    },
    tags: ['audio', 'bluetooth', 'portable', 'waterproof'],
    status: 'active',
    featured: true
  },
  {
    name: 'Wireless Gaming Mouse',
    description: 'High-precision wireless gaming mouse with RGB lighting.',
    price: 89.99,
    originalPrice: 129.99,
    category: 'Electronics',
    brand: 'GamePro',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop',
        alt: 'Wireless Gaming Mouse'
      }
    ],
    inventory: {
      quantity: 100,
      threshold: 20
    },
    features: ['Wireless', 'RGB Lighting', 'Programmable Buttons', 'High Precision'],
    specifications: {
      'DPI': '16000',
      'Battery': '70 hours',
      'Connectivity': 'Wireless 2.4GHz'
    },
    tags: ['gaming', 'mouse', 'wireless', 'rgb'],
    status: 'active',
    featured: false
  },
  {
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable organic cotton t-shirt in various colors and sizes.',
    price: 29.99,
    category: 'Clothing',
    brand: 'EcoWear',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
        alt: 'Organic Cotton T-Shirt'
      }
    ],
    inventory: {
      quantity: 200,
      threshold: 50
    },
    features: ['Organic Cotton', 'Comfortable Fit', 'Various Colors', 'Sustainable'],
    specifications: {
      'Material': '100% Organic Cotton',
      'Sizes': 'XS - XXL',
      'Care': 'Machine Washable'
    },
    tags: ['clothing', 'organic', 'cotton', 'sustainable'],
    status: 'active',
    featured: false
  }
];

async function seedProducts() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Clear existing products (except test ones)
    console.log('Clearing existing products...');
    const deletedCount = await Product.deleteMany({ 
      name: { $nin: ['Test Headphones', 'Test Product 2'] } 
    });
    console.log(`🗑️ Cleared ${deletedCount.deletedCount} existing products`);

    // Insert new products one by one
    console.log('Creating products...');
    let createdCount = 0;
    
    for (const productData of sampleProducts) {
      try {
        const product = await Product.create(productData);
        console.log(`✅ Created: ${product.name} - $${product.price}`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Failed to create ${productData.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Successfully created ${createdCount} products`);

    // Verify the products were created
    const totalProducts = await Product.countDocuments();
    console.log(`📊 Total products in database: ${totalProducts}`);

  } catch (error) {
    console.error('❌ Error seeding products:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedProducts();
