require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../../utils/database');
const redisClient = require('../../utils/redis');
const Wishlist = require('../../models/Wishlist');
const Product = require('../../models/Product');
const Cart = require('../../models/Cart');
const { authenticate } = require('../../utils/auth');
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

// Get user's wishlist
const getWishlist = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const cacheKey = `wishlist:${user._id}`;

  // Try cache first
  let wishlist = await redisClient.get(cacheKey);

  if (!wishlist) {
    wishlist = await Wishlist.findOne({ user: user._id })
      .populate({
        path: 'items.product',
        select: 'name price images inventory status discountedPrice category ratings'
      })
      .lean();

    if (!wishlist) {
      // Create empty wishlist if doesn't exist
      wishlist = await Wishlist.create({
        user: user._id,
        items: []
      });
    }

    // Filter out inactive products
    if (wishlist.items && wishlist.items.length > 0) {
      const validItems = wishlist.items.filter(item => 
        item.product && item.product.status === 'active'
      );

      // Update if any items were removed
      if (validItems.length !== wishlist.items.length) {
        const dbWishlist = await Wishlist.findOne({ user: user._id });
        dbWishlist.items = validItems;
        await dbWishlist.save();
        wishlist = dbWishlist.toObject();
      }
    }

    // Cache for 5 minutes
    await redisClient.set(cacheKey, wishlist, 300);
  }

  return successResponse(wishlist, 'Wishlist retrieved successfully');
});

// Add item to wishlist
const addToWishlist = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const pathParams = getPathParams(event);
  
  const { productId } = pathParams;
  if (!productId) {
    return errorResponse('Product ID is required', 400);
  }

  // Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return errorResponse('Invalid product ID format', 400);
  }

  // Check if product exists and is active
  const product = await Product.findById(productId);
  if (!product) {
    return notFoundResponse('Product');
  }

  if (product.status !== 'active') {
    return errorResponse('Product is not available', 400);
  }

  // Get or create wishlist
  let wishlist = await Wishlist.findOne({ user: user._id });
  if (!wishlist) {
    wishlist = new Wishlist({
      user: user._id,
      items: []
    });
  }

  // Check if item already exists
  const existingItem = wishlist.items.find(item => 
    item.product.toString() === productId
  );

  if (existingItem) {
    return errorResponse('Product is already in your wishlist', 400);
  }

  // Add item to wishlist
  await wishlist.addItem(productId);
  
  // Populate product details
  await wishlist.populate({
    path: 'items.product',
    select: 'name price images inventory status discountedPrice category ratings'
  });

  // Update cache
  const cacheKey = `wishlist:${user._id}`;
  await redisClient.set(cacheKey, wishlist, 300);

  return successResponse(wishlist, 'Item added to wishlist successfully');
});

// Remove item from wishlist
const removeFromWishlist = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const { productId } = getPathParams(event);

  if (!productId) {
    return errorResponse('Product ID is required', 400);
  }

  // Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return errorResponse('Invalid product ID format', 400);
  }

  const wishlist = await Wishlist.findOne({ user: user._id });
  if (!wishlist) {
    return notFoundResponse('Wishlist');
  }

  // Check if item exists in wishlist
  const itemExists = wishlist.items.some(item => 
    item.product.toString() === productId
  );

  if (!itemExists) {
    return errorResponse('Product not found in wishlist', 400);
  }

  // Remove item
  await wishlist.removeItem(productId);

  // Populate remaining items
  await wishlist.populate({
    path: 'items.product',
    select: 'name price images inventory status discountedPrice category ratings'
  });

  // Update cache
  const cacheKey = `wishlist:${user._id}`;
  await redisClient.set(cacheKey, wishlist, 300);

  return successResponse(wishlist, 'Item removed from wishlist successfully');
});

// Move item from wishlist to cart
const moveToCart = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const pathParams = getPathParams(event);
  const body = parseBody(event);
  
  const { productId } = pathParams;
  const { quantity = 1 } = body;
  
  if (!productId) {
    return errorResponse('Product ID is required', 400);
  }

  // Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return errorResponse('Invalid product ID format', 400);
  }

  // Check if product exists and is active
  const product = await Product.findById(productId);
  if (!product) {
    return notFoundResponse('Product');
  }

  if (product.status !== 'active') {
    return errorResponse('Product is not available', 400);
  }

  // Check inventory using the same logic as cart handler
  const allCarts = await Cart.find({ 'items.product': productId });
  let totalReservedQuantity = 0;
  
  allCarts.forEach(cart => {
    const cartItem = cart.items.find(item => item.product.toString() === productId);
    if (cartItem) {
      totalReservedQuantity += cartItem.quantity;
    }
  });

  const availableStock = product.inventory.quantity - totalReservedQuantity;

  if (availableStock < quantity) {
    return errorResponse(`Cannot add to cart. Only ${Math.max(0, availableStock)} items available (${totalReservedQuantity} already in other carts)`, 400);
  }

  // Get user's cart
  let cart = await Cart.findOne({ user: user._id });
  if (!cart) {
    cart = new Cart({
      user: user._id,
      items: []
    });
  }

  // Check if item already exists in cart
  const existingCartItem = cart.items.find(item => 
    item.product.toString() === productId
  );

  const currentPrice = product.discountedPrice || product.price;

  if (existingCartItem) {
    // Update quantity
    const newQuantity = existingCartItem.quantity + quantity;
    const currentUserQuantity = existingCartItem.quantity;
    const reservedByOthers = totalReservedQuantity - currentUserQuantity;
    const availableForThisUser = product.inventory.quantity - reservedByOthers;
    
    if (newQuantity > availableForThisUser) {
      return errorResponse(`Cannot add ${quantity} more items. Only ${Math.max(0, availableForThisUser - currentUserQuantity)} more items available`, 400);
    }

    existingCartItem.quantity = newQuantity;
    existingCartItem.price = currentPrice;
  } else {
    // Add new item to cart
    cart.items.push({
      product: productId,
      quantity,
      price: currentPrice,
      selectedVariants: {}
    });
  }

  await cart.save();

  // Remove item from wishlist
  const wishlist = await Wishlist.findOne({ user: user._id });
  if (wishlist) {
    await wishlist.removeItem(productId);
  }

  // Populate cart details
  await cart.populate({
    path: 'items.product',
    select: 'name price images inventory status discountedPrice'
  });

  // Update caches
  const cartCacheKey = `cart:${user._id}`;
  const wishlistCacheKey = `wishlist:${user._id}`;
  await redisClient.set(cartCacheKey, cart, 300);
  await redisClient.del(wishlistCacheKey);

  return successResponse({
    cart,
    message: 'Item moved from wishlist to cart successfully'
  }, 'Item moved to cart successfully');
});

// Clear entire wishlist
const clearWishlist = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);

  const wishlist = await Wishlist.findOne({ user: user._id });
  if (!wishlist) {
    return notFoundResponse('Wishlist');
  }

  await wishlist.clearWishlist();

  // Clear cache
  const cacheKey = `wishlist:${user._id}`;
  await redisClient.del(cacheKey);

  return successResponse(wishlist, 'Wishlist cleared successfully');
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart,
  clearWishlist
};
