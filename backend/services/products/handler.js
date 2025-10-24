require('dotenv').config();
const connectDB = require('../../utils/database');
const redisClient = require('../../utils/redis');
const Product = require('../../models/Product');
const { authenticate, requireAdmin, optionalAuth } = require('../../utils/auth');
const {
  lambdaWrapper,
  successResponse,
  errorResponse,
  notFoundResponse,
  paginatedResponse,
  parseBody,
  getQueryParams,
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

// Get all products with filtering, sorting, and pagination
const getProducts = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const query = getQueryParams(event);
  const {
    page = 1,
    limit = 12,
    category,
    brand,
    minPrice,
    maxPrice,
    search,
    sort = '-createdAt',
    status = 'active',
    featured
  } = query;

  // Build cache key
  const cacheKey = `products:${JSON.stringify(query)}`;
  
  // Try to get from cache first
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return successResponse(cached, 'Products retrieved from cache');
  }

  // Build filter object
  const filter = { status };

  if (category) {
    filter.category = new RegExp(category, 'i');
  }

  if (brand) {
    filter.brand = new RegExp(brand, 'i');
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  if (search) {
    // Use only regex search for better compatibility
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  if (featured !== undefined) {
    filter.featured = featured === 'true';
  }

  // Build sort object
  let sortObject = {};
  if (sort.startsWith('-')) {
    sortObject[sort.substring(1)] = -1;
  } else {
    sortObject[sort] = 1;
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Execute queries
  const [products, totalProducts] = await Promise.all([
    Product.find(filter)
      .sort(sortObject)
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'name email')
      .lean(),
    Product.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalProducts / limitNum);

  const result = {
    items: products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalPages,
      totalItems: totalProducts
    }
  };

  // Cache the result for 5 minutes
  await redisClient.set(cacheKey, result, 300);

  return paginatedResponse(products, {
    page: pageNum,
    limit: limitNum,
    totalPages,
    totalItems: totalProducts
  }, 'Products retrieved successfully');
});

// Get single product by ID
const getProduct = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const { id } = getPathParams(event);
  
  if (!id) {
    return errorResponse('Product ID is required', 400);
  }

  // Handle case where id might be '[object Object]' or similar
  if (id === '[object Object]' || typeof id !== 'string') {
    return errorResponse('Invalid product ID format', 400);
  }

  // Validate ObjectId format
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return errorResponse(`Invalid product ID format: ${id}`, 400);
  }

  // Try cache first
  const cacheKey = `product:${id}`;
  let product = await redisClient.get(cacheKey);

  if (!product) {
    product = await Product.findById(id)
      .populate('createdBy', 'name email')
      .populate('reviews.user', 'name avatar')
      .lean();

    if (!product) {
      return notFoundResponse('Product');
    }

    // Cache for 10 minutes
    await redisClient.set(cacheKey, product, 600);
  }

  return successResponse(product, 'Product retrieved successfully');
});

// Create new product (Admin only)
const createProduct = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await requireAdmin(event);
  const body = parseBody(event);
  
  validateRequiredFields(body, ['name', 'description', 'price', 'category']);

  const productData = {
    ...body,
    createdBy: user._id
  };

  // Validate images array
  if (body.images && Array.isArray(body.images)) {
    productData.images = body.images.map(img => ({
      url: img.url || img,
      alt: img.alt || body.name
    }));
  } else if (body.images) {
    productData.images = [{ url: body.images, alt: body.name }];
  }

  const product = await Product.create(productData);
  
  // Populate creator info
  await product.populate('createdBy', 'name email');

  // Clear products cache
  await redisClient.del('products:*');

  return successResponse(product, 'Product created successfully', 201);
});

// Update product (Admin only)
const updateProduct = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await requireAdmin(event);
  const { id } = getPathParams(event);
  const body = parseBody(event);

  if (!id) {
    return errorResponse('Product ID is required', 400);
  }

  const product = await Product.findById(id);
  if (!product) {
    return notFoundResponse('Product');
  }

  // Update allowed fields
  const allowedUpdates = [
    'name', 'description', 'price', 'originalPrice', 'category', 'brand',
    'images', 'inventory', 'specifications', 'tags', 'status', 'featured',
    'discount', 'seo'
  ];

  allowedUpdates.forEach(field => {
    if (body[field] !== undefined) {
      product[field] = body[field];
    }
  });

  await product.save();
  await product.populate('createdBy', 'name email');

  // Clear caches
  await redisClient.del(`product:${id}`);
  await redisClient.del('products:*');

  return successResponse(product, 'Product updated successfully');
});

// Delete product (Admin only)
const deleteProduct = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await requireAdmin(event);
  const { id } = getPathParams(event);

  if (!id) {
    return errorResponse('Product ID is required', 400);
  }

  const product = await Product.findById(id);
  if (!product) {
    return notFoundResponse('Product');
  }

  await Product.findByIdAndDelete(id);

  // Clear caches
  await redisClient.del(`product:${id}`);
  await redisClient.del('products:*');

  return successResponse(null, 'Product deleted successfully');
});

// Get product categories
const getCategories = lambdaWrapper(async (event, context) => {
  await initDB();

  const cacheKey = 'product:categories';
  let categories = await redisClient.get(cacheKey);

  if (!categories) {
    categories = await Product.distinct('category', { status: 'active' });
    await redisClient.set(cacheKey, categories, 1800); // Cache for 30 minutes
  }

  return successResponse(categories, 'Categories retrieved successfully');
});

// Get product brands
const getBrands = lambdaWrapper(async (event, context) => {
  await initDB();

  const cacheKey = 'product:brands';
  let brands = await redisClient.get(cacheKey);

  if (!brands) {
    brands = await Product.distinct('brand', { 
      status: 'active',
      brand: { $ne: null, $ne: '' }
    });
    await redisClient.set(cacheKey, brands, 1800); // Cache for 30 minutes
  }

  return successResponse(brands, 'Brands retrieved successfully');
});

// Search products
const searchProducts = lambdaWrapper(async (event, context) => {
  await initDB();

  const query = getQueryParams(event);
  const { q, page = 1, limit = 12 } = query;

  if (!q) {
    return errorResponse('Search query is required', 400);
  }

  const cacheKey = `search:${q}:${page}:${limit}`;
  let result = await redisClient.get(cacheKey);

  if (!result) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [products, totalProducts] = await Promise.all([
      Product.find({
        $text: { $search: q },
        status: 'active'
      })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments({
        $text: { $search: q },
        status: 'active'
      })
    ]);

    const totalPages = Math.ceil(totalProducts / limitNum);

    result = {
      items: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages,
        totalItems: totalProducts
      }
    };

    // Cache search results for 5 minutes
    await redisClient.set(cacheKey, result, 300);
  }

  return paginatedResponse(result.items, result.pagination, 'Search completed successfully');
});

// Add product review
const addReview = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const { id } = getPathParams(event);
  const body = parseBody(event);

  validateRequiredFields(body, ['rating', 'comment']);

  const { rating, comment } = body;

  if (rating < 1 || rating > 5) {
    return errorResponse('Rating must be between 1 and 5', 400);
  }

  const product = await Product.findById(id);
  if (!product) {
    return notFoundResponse('Product');
  }

  // Check if user already reviewed this product
  const existingReview = product.reviews.find(
    review => review.user.toString() === user._id.toString()
  );

  if (existingReview) {
    return errorResponse('You have already reviewed this product', 400);
  }

  // Add review
  product.reviews.push({
    user: user._id,
    rating,
    comment: comment.trim()
  });

  // Update ratings
  const totalReviews = product.reviews.length;
  const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
  product.ratings.average = totalRating / totalReviews;
  product.ratings.count = totalReviews;

  await product.save();
  await product.populate('reviews.user', 'name avatar');

  // Clear product cache
  await redisClient.del(`product:${id}`);

  return successResponse(product, 'Review added successfully');
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getBrands,
  searchProducts,
  addReview
};
