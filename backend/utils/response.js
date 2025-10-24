// Success response
const successResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    })
  };
};

// Error response
const errorResponse = (error, statusCode = 500) => {
  let message = 'Internal server error';
  let details = null;

  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      statusCode = 400;
      details = Object.values(error.errors).map(err => err.message);
    } else if (error.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid ID format';
    } else if (error.code === 11000) {
      statusCode = 400;
      message = 'Duplicate field value';
      const field = Object.keys(error.keyValue)[0];
      details = `${field} already exists`;
    } else if (error.message.includes('Authentication failed')) {
      statusCode = 401;
    } else if (error.message.includes('Admin access required')) {
      statusCode = 403;
    }
  }

  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (details) {
    response.details = details;
  }

  // Don't expose sensitive error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    response.message = 'Internal server error';
    delete response.details;
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify(response)
  };
};

// Validation error response
const validationErrorResponse = (errors) => {
  return errorResponse({
    message: 'Validation failed',
    details: errors
  }, 400);
};

// Not found response
const notFoundResponse = (resource = 'Resource') => {
  return errorResponse(`${resource} not found`, 404);
};

// Unauthorized response
const unauthorizedResponse = (message = 'Unauthorized access') => {
  return errorResponse(message, 401);
};

// Forbidden response
const forbiddenResponse = (message = 'Access forbidden') => {
  return errorResponse(message, 403);
};

// Paginated response
const paginatedResponse = (data, pagination, message = 'Success') => {
  return successResponse({
    items: data,
    pagination: {
      currentPage: pagination.page,
      totalPages: pagination.totalPages,
      totalItems: pagination.totalItems,
      itemsPerPage: pagination.limit,
      hasNextPage: pagination.page < pagination.totalPages,
      hasPrevPage: pagination.page > 1
    }
  }, message);
};

// Lambda wrapper for error handling
const lambdaWrapper = (handler) => {
  return async (event, context) => {
    try {
      context.callbackWaitsForEmptyEventLoop = false;
      
      // Handle CORS preflight
      if (event.httpMethod === 'OPTIONS') {
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
          },
          body: ''
        };
      }

      return await handler(event, context);
    } catch (error) {
      console.error('Lambda error:', error);
      return errorResponse(error);
    }
  };
};

// Parse request body
const parseBody = (event) => {
  if (!event.body) return {};
  
  try {
    return JSON.parse(event.body);
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
};

// Extract query parameters
const getQueryParams = (event) => {
  return event.queryStringParameters || {};
};

// Extract path parameters
const getPathParams = (event) => {
  return event.pathParameters || {};
};

// Validate required fields
const validateRequiredFields = (data, requiredFields) => {
  const missing = requiredFields.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  paginatedResponse,
  lambdaWrapper,
  parseBody,
  getQueryParams,
  getPathParams,
  validateRequiredFields
};
