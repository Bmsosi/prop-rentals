/**
 * Extract a user-friendly error message from an API error
 * @param {Error} error - The error object from axios or other sources
 * @param {string} defaultMessage - Default message if extraction fails
 * @returns {Object} { message: string, details: string | null, statusCode: number | null }
 */
export const extractErrorMessage = (
  error,
  defaultMessage = "An unexpected error occurred"
) => {
  let message = defaultMessage;
  let details = null;
  let statusCode = null;

  // Network errors
  if (error.code === "ERR_NETWORK") {
    return {
      message: "Network error. Please check your internet connection.",
      details: null,
      statusCode: null,
    };
  }

  // Timeout errors
  if (error.code === "ECONNABORTED") {
    return {
      message: "Request timeout. Please try again.",
      details: null,
      statusCode: null,
    };
  }

  // Response errors
  if (error.response) {
    statusCode = error.response.status;
    const responseData = error.response.data;

    // Extract message from various response formats
    message =
      responseData?.message ||
      responseData?.error ||
      responseData?.data?.message ||
      error.message ||
      defaultMessage;

    details = responseData?.details || null;

    // Provide specific messages for status codes
    switch (statusCode) {
      case 400:
        message = message || "Invalid request. Please check your input.";
        break;
      case 401:
        message = message || "Authentication failed. Please login again.";
        break;
      case 403:
        message = message || "Access denied. You don't have permission.";
        break;
      case 404:
        message = message || "Resource not found.";
        break;
      case 409:
        message = message || "Conflict. Resource already exists.";
        break;
      case 422:
        message = message || "Validation failed. Please check your input.";
        break;
      case 429:
        message = "Too many requests. Please try again later.";
        break;
      case 500:
        message = message || "Server error. Please try again later.";
        break;
      case 502:
        message = "Bad gateway. The server is temporarily unavailable.";
        break;
      case 503:
        message = "Service temporarily unavailable. Please try again later.";
        break;
      case 504:
        message = "Gateway timeout. Please try again.";
        break;
      default:
        message = message || `Error: ${statusCode}`;
    }
  }

  return {
    message,
    details,
    statusCode,
  };
};

/**
 * Log error details for debugging
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 */
export const logError = (error, context = "Unknown") => {
  if (import.meta.env.DEV) {
    console.group(`🔴 Error in ${context}`);
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Stack:", error.stack);
    console.groupEnd();
  }
};

/**
 * Check if error is a specific type
 * @param {Error} error - The error object
 * @param {number|string} type - HTTP status code or error code
 * @returns {boolean}
 */
export const isErrorType = (error, type) => {
  if (typeof type === "number") {
    return error.response?.status === type;
  }
  return error.code === type;
};

/**
 * Handle API errors with toast notifications
 * @param {Error} error - The error object
 * @param {Function} toast - Toast notification function
 * @param {string} context - Context where the error occurred
 * @param {Object} options - Additional options
 */
export const handleApiError = (
  error,
  toast,
  context = "Operation",
  options = {}
) => {
  const {
    defaultMessage = "Operation failed",
    duration = 5000,
    showDetails = true,
  } = options;

  logError(error, context);

  const { message, details } = extractErrorMessage(error, defaultMessage);

  toast.error(message, {
    duration,
    description: showDetails && details ? details : undefined,
  });
};

export default {
  extractErrorMessage,
  logError,
  isErrorType,
  handleApiError,
};
