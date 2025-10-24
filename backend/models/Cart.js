const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true
  },
  selectedVariants: {
    size: String,
    color: String,
    style: String
  }
}, {
  timestamps: true
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  sessionId: {
    type: String,
    required: false
  },
  items: [cartItemSchema],
  totalItems: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Validation: Either user or sessionId must be provided
cartSchema.pre('validate', function(next) {
  if (!this.user && !this.sessionId) {
    next(new Error('Either user or sessionId must be provided'));
  } else {
    next();
  }
});

// Calculate totals before saving
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
  this.totalPrice = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  this.lastUpdated = new Date();
  next();
});

// Remove item from cart method
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => !item.product.equals(productId));
  return this.save();
};

// Update item quantity method
cartSchema.methods.updateItemQuantity = function(productId, newQuantity) {
  const item = this.items.find(item => item.product.equals(productId));
  if (item) {
    if (newQuantity <= 0) {
      return this.removeItem(productId);
    }
    item.quantity = newQuantity;
  }
  return this.save();
};

// Clear cart method
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);
