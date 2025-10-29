// Enhanced error handling utilities

export const handleApiError = (error, fallbackMessage = 'An unexpected error occurred') => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.message || error.response.statusText || fallbackMessage,
      status: error.response.status,
      type: 'server_error'
    };
  } else if (error.request) {
    // Network error
    return {
      message: 'Network error. Please check your connection and try again.',
      status: 0,
      type: 'network_error'
    };
  } else {
    // Other error
    return {
      message: error.message || fallbackMessage,
      status: null,
      type: 'client_error'
    };
  }
};

export const logError = (error, context = '') => {
  const errorInfo = handleApiError(error);
  console.error(`[${context}] Error:`, {
    ...errorInfo,
    originalError: error,
    timestamp: new Date().toISOString()
  });
  return errorInfo;
};

export const withErrorHandling = (asyncFunction, context = '') => {
  return async (...args) => {
    try {
      return await asyncFunction(...args);
    } catch (error) {
      const errorInfo = logError(error, context);
      throw errorInfo;
    }
  };
};
