require('dotenv').config();
const connectDB = require('../../utils/database');
const redisClient = require('../../utils/redis');
const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const { authenticate, requireAdmin, optionalAuth } = require('../../utils/auth');
const {
  lambdaWrapper,
  successResponse,
  errorResponse,
  notFoundResponse,
  parseBody,
  getPathParams,
  validateRequiredFields
} = require('../../utils/response');

// Initialize database connection
let dbConnection = null;
const initDB = async () => {
  if (!dbConnection) {
    dbConnection = await connectDB();
    await redisClient.connect();
  }
};

// Get user's cart
const getCart = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await optionalAuth(event);
  const { userId } = getPathParams(event);

  // If authenticated, ensure user can only access their own cart
  if (user && userId && userId !== user._id.toString()) {
    return errorResponse('Access denied', 403);
  }

  if (!user) {
    // For guest users, return empty cart
    return successResponse({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      lastUpdated: new Date()
    }, 'Cart retrieved successfully');
  }

  const targetUserId = userId || user._id;
  const cacheKey = `cart:${targetUserId}`;

  // Try cache first
  let cart = await redisClient.get(cacheKey);

  if (!cart) {
    cart = await Cart.findOne({ user: targetUserId })
      .populate({
        path: 'items.product',
        select: 'name price images inventory status discountedPrice'
      })
      .lean();

    if (!cart) {
      // Create empty cart if doesn't exist
      cart = await Cart.create({
        user: targetUserId,
        items: [],
        totalItems: 0,
        totalPrice: 0
      });
    }

    // Cache for 5 minutes
    await redisClient.set(cacheKey, cart, 300);
  }

  // Filter out inactive products and update prices
  if (cart.items && cart.items.length > 0) {
    const validItems = cart.items.filter(item => 
      item.product && item.product.status === 'active'
    );

    // Check if any items were removed due to inactive products
    if (validItems.length !== cart.items.length) {
      const dbCart = await Cart.findOne({ user: targetUserId });
      dbCart.items = validItems;
      await dbCart.save();
      cart = dbCart.toObject();
      
      // Update cache
      await redisClient.set(cacheKey, cart, 300);
    }
  }

  return successResponse(cart, 'Cart retrieved successfully');
});

// Add item to cart
const addToCart = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const body = parseBody(event);
  
  validateRequiredFields(body, ['productId', 'quantity']);

  const { productId, quantity, selectedVariants = {} } = body;

  if (quantity < 1) {
    return errorResponse('Quantity must be at least 1', 400);
  }

  // Check if product exists and is active
  const product = await Product.findById(productId);
  if (!product) {
    return notFoundResponse('Product');
  }

  if (product.status !== 'active') {
    return errorResponse('Product is not available', 400);
  }

  // Check inventory - calculate how many items are already reserved in ALL carts
  const allCarts = await Cart.find({ 'items.product': productId });
  let totalReservedQuantity = 0;
  
  // Count total reserved quantity across all carts
  allCarts.forEach(cart => {
    const cartItem = cart.items.find(item => item.product.toString() === productId);
    if (cartItem) {
      totalReservedQuantity += cartItem.quantity;
    }
  });

  const availableStock = product.inventory.quantity - totalReservedQuantity;

  if (availableStock < quantity) {
    return errorResponse(`Cannot add ${quantity} items. Only ${Math.max(0, availableStock)} items available (${totalReservedQuantity} already in other carts)`, 400);
  }

  if (availableStock <= 0) {
    return errorResponse('Product is out of stock - all items are reserved in other carts', 400);
  }

  // Get or create cart for authenticated user
  let cart = await Cart.findOne({ user: user._id });
  if (!cart) {
    cart = new Cart({
      user: user._id,
      items: []
    });
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(item => 
    item.product.toString() === productId &&
    JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
  );

  const currentPrice = product.discountedPrice || product.price;

  if (existingItemIndex > -1) {
    // Update quantity of existing item
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    const currentUserQuantity = cart.items[existingItemIndex].quantity;
    
    // Recalculate available stock excluding current user's existing quantity
    const reservedByOthers = totalReservedQuantity - currentUserQuantity;
    const availableForThisUser = product.inventory.quantity - reservedByOthers;
    
    if (newQuantity > availableForThisUser) {
      return errorResponse(`Cannot add ${quantity} more items. Only ${Math.max(0, availableForThisUser - currentUserQuantity)} more items available`, 400);
    }

    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].price = currentPrice; // Update price in case it changed
  } else {
    // Add new item to cart
    cart.items.push({
      product: productId,
      quantity,
      price: currentPrice,
      selectedVariants
    });
  }

  await cart.save();
  
  // Populate product details
  await cart.populate({
    path: 'items.product',
    select: 'name price images inventory status discountedPrice'
  });

  // Update cache
  const cacheKey = `cart:${user._id}`;
  await redisClient.set(cacheKey, cart, 300);

  return successResponse(cart, 'Item added to cart successfully');
});

// Update cart item quantity
const updateCartItem = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const body = parseBody(event);
  
  validateRequiredFields(body, ['productId', 'quantity']);

  const { productId, quantity, selectedVariants = {} } = body;

  if (quantity < 0) {
    return errorResponse('Quantity cannot be negative', 400);
  }

  const cart = await Cart.findOne({ user: user._id });
  if (!cart) {
    return notFoundResponse('Cart');
  }

  // Find the item in cart
  const itemIndex = cart.items.findIndex(item => 
    item.product.toString() === productId &&
    JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
  );

  if (itemIndex === -1) {
    return notFoundResponse('Item in cart');
  }

  if (quantity === 0) {
    // Remove item from cart
    cart.items.splice(itemIndex, 1);
  } else {
    // Check inventory by calculating reserved quantities
    const product = await Product.findById(productId);
    if (!product) {
      return notFoundResponse('Product');
    }

    // Calculate how many items are already reserved in ALL carts
    const allCarts = await Cart.find({ 'items.product': productId });
    let totalReservedQuantity = 0;
    
    allCarts.forEach(cart => {
      const cartItem = cart.items.find(item => item.product.toString() === productId);
      if (cartItem) {
        totalReservedQuantity += cartItem.quantity;
      }
    });

    // Get current item quantity in this user's cart
    const currentUserQuantity = cart.items[itemIndex].quantity;
    
    // Calculate available stock excluding current user's existing quantity
    const reservedByOthers = totalReservedQuantity - currentUserQuantity;
    const availableForThisUser = product.inventory.quantity - reservedByOthers;
    
    if (quantity > availableForThisUser) {
      return errorResponse(`Cannot set quantity to ${quantity}. Only ${availableForThisUser} items available (${reservedByOthers} already reserved in other carts)`, 400);
    }

    // Update quantity and price
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.discountedPrice || product.price;
  }

  await cart.save();
  
  // Populate product details
  await cart.populate({
    path: 'items.product',
    select: 'name price images inventory status discountedPrice'
  });

  // Update cache
  const cacheKey = `cart:${user._id}`;
  await redisClient.set(cacheKey, cart, 300);

  return successResponse(cart, 'Cart updated successfully');
});

// Remove item from cart
const removeFromCart = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const body = parseBody(event);
  
  validateRequiredFields(body, ['productId']);

  const { productId, selectedVariants = {} } = body;

  const cart = await Cart.findOne({ user: user._id });
  if (!cart) {
    return notFoundResponse('Cart');
  }

  // Find and remove the item
  const initialLength = cart.items.length;
  cart.items = cart.items.filter(item => 
    !(item.product.toString() === productId &&
      JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants))
  );

  if (cart.items.length === initialLength) {
    return notFoundResponse('Item in cart');
  }

  await cart.save();
  
  // Populate product details
  await cart.populate({
    path: 'items.product',
    select: 'name price images inventory status discountedPrice'
  });

  // Update cache
  const cacheKey = `cart:${user._id}`;
  await redisClient.set(cacheKey, cart, 300);

  return successResponse(cart, 'Item removed from cart successfully');
});

// Clear entire cart
const clearCart = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);

  const cart = await Cart.findOne({ user: user._id });
  if (!cart) {
    return notFoundResponse('Cart');
  }

  await cart.clearCart();

  // Clear cache
  const cacheKey = `cart:${user._id}`;
  await redisClient.del(cacheKey);

  return successResponse(cart, 'Cart cleared successfully');
});

// Get cart summary (items count and total)
const getCartSummary = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const cacheKey = `cart:summary:${user._id}`;

  let summary = await redisClient.get(cacheKey);

  if (!summary) {
    const cart = await Cart.findOne({ user: user._id }).select('totalItems totalPrice');
    
    summary = {
      totalItems: cart ? cart.totalItems : 0,
      totalPrice: cart ? cart.totalPrice : 0,
      hasItems: cart ? cart.totalItems > 0 : false
    };

    // Cache for 2 minutes
    await redisClient.set(cacheKey, summary, 120);
  }

  return successResponse(summary, 'Cart summary retrieved successfully');
});

// Sync cart with inventory (cleanup invalid items)
const syncCart = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);

  const cart = await Cart.findOne({ user: user._id })
    .populate('items.product', 'status inventory');

  if (!cart) {
    return notFoundResponse('Cart');
  }

  let hasChanges = false;
  const validItems = [];

  for (const item of cart.items) {
    if (!item.product || item.product.status !== 'active') {
      hasChanges = true;
      continue; // Skip inactive/deleted products
    }

    if (item.quantity > item.product.inventory.quantity) {
      // Adjust quantity to available stock
      item.quantity = item.product.inventory.quantity;
      hasChanges = true;
    }

    if (item.quantity > 0) {
      validItems.push(item);
    } else {
      hasChanges = true;
    }
  }

  if (hasChanges) {
    cart.items = validItems;
    await cart.save();
    
    // Clear cache to force refresh
    const cacheKey = `cart:${user._id}`;
    await redisClient.del(cacheKey);
  }

  // Return updated cart with populated products
  await cart.populate({
    path: 'items.product',
    select: 'name price images inventory status discountedPrice'
  });

  return successResponse(cart, 'Cart synchronized successfully');
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
  syncCart
};
