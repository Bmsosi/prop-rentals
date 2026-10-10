const validateResponseObject = (res) => {
  if (!res || typeof res !== "object") {
    throw new Error("Invalid response object: must be an object");
  }

  if (typeof res.status !== "function" || typeof res.json !== "function") {
    throw new Error(
      "Invalid response object: missing required Express methods (status, json)"
    );
  }

  return true;
};

const validateStatusCode = (statusCode) => {
  if (typeof statusCode !== "number") {
    throw new Error("Status code must be a number");
  }

  if (statusCode < 100 || statusCode > 599) {
    throw new Error("Status code must be between 100 and 599");
  }

  return true;
};

const sanitizeErrorMessage = (message) => {
  if (typeof message !== "string") {
    return "Unknown error occurred";
  }

  // Remove potential HTML/script tags
  return message.replace(/<[^>]*>/g, "").trim();
};

const extractValidationError = (validationErrors) => {
  if (Array.isArray(validationErrors)) {
    const errorWithMessage = validationErrors.find(
      (err) => err && typeof err === "object" && err.message
    );
    return (
      errorWithMessage?.message ||
      (typeof validationErrors[0] === "string"
        ? validationErrors[0]
        : "Validation failed")
    );
  }

  if (validationErrors && typeof validationErrors === "object") {
    return (
      validationErrors.message || validationErrors.msg || "Validation failed"
    );
  }

  if (typeof validationErrors === "string") {
    return validationErrors;
  }

  return "Validation failed";
};

const analyzeError = (error) => {
  const defaultError = {
    statusCode: 500,
    message: "Internal server error",
    details: null,
  };

  if (!error || typeof error !== "object") {
    return defaultError;
  }

  const statusCode = error.statusCode || error.status;
  if (
    statusCode &&
    typeof statusCode === "number" &&
    statusCode >= 400 &&
    statusCode < 600
  ) {
    return {
      statusCode,
      message: sanitizeErrorMessage(error.message || "Request failed"),
      details: error.details || null,
    };
  }

  // Handle Prisma errors
  if (error.code?.startsWith("P")) {
    return {
      statusCode: 500,
      message: "Database operation failed",
      details: process.env.NODE_ENV === "development" 
        ? sanitizeErrorMessage(error.message) 
        : "Please try again later",
    };
  }

  const errorType = error.constructor?.name?.toLowerCase();

  switch (errorType) {
    case "validationerror":
    case "zoderror":
      return {
        statusCode: 400,
        message: "Validation failed",
        details: sanitizeErrorMessage(error.message),
      };

    case "authenticationerror":
    case "unauthorizederror":
      return {
        statusCode: 401,
        message: "Authentication required",
        details: sanitizeErrorMessage(error.message),
      };

    case "forbiddenerror":
      return {
        statusCode: 403,
        message: "Access denied",
        details: sanitizeErrorMessage(error.message),
      };

    case "notfounderror":
      return {
        statusCode: 404,
        message: "Resource not found",
        details: sanitizeErrorMessage(error.message),
      };

    case "conflicterror":
      return {
        statusCode: 409,
        message: "Resource conflict",
        details: sanitizeErrorMessage(error.message),
      };

    default:
      return {
        statusCode: 500,
        message: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? sanitizeErrorMessage(error.message)
            : null,
      };
  }
};

export const SuccessResponse = (
  res,
  statusCode = 200,
  message = "Operation successful",
  data = null,
  meta = {}
) => {
  try {
    validateResponseObject(res);
    validateStatusCode(statusCode);

    const response = {
      success: true,
      message:
        typeof message === "string" ? message.trim() : "Operation successful",
      timestamp: new Date().toISOString(),
      ...meta,
    };

    if (data !== null && data !== undefined) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  } catch (error) {
    // Fallback for utility function failures
    console.error("SuccessResponse utility error:", error);
    return res.status(500).json({
      success: false,
      message: "Response formatting error",
      timestamp: new Date().toISOString(),
    });
  }
};

export const ErrorResponse = (
  res,
  statusCode = 400,
  message = "Request failed",
  details = null
) => {
  try {
    validateResponseObject(res);
    validateStatusCode(statusCode);

    const response = {
      success: false,
      message: typeof message === "string" ? message.trim() : "Request failed",
      timestamp: new Date().toISOString(),
    };

    if (details !== null && details !== undefined) {
      response.details = details;
    }

    return res.status(statusCode).json(response);
  } catch (error) {
    // Fallback for utility function failures
    console.error("ErrorResponse utility error:", error);
    return res.status(500).json({
      success: false,
      message: "Response formatting error",
      timestamp: new Date().toISOString(),
    });
  }
};

export const ValidationError = (res, validationErrors) => {
  const errorMessage = extractValidationError(validationErrors);
  return ErrorResponse(res, 400, "Validation failed", errorMessage);
};

export const CreatedResponse = (
  res,
  message = "Resource created successfully",
  data = null,
  meta = {}
) => {
  return SuccessResponse(res, 201, message, data, meta);
};

export const BadRequest = (res, message = "Bad request", details = null) => {
  return ErrorResponse(res, 400, message, details);
};

export const Unauthorized = (res, message = "Authentication required") => {
  return ErrorResponse(res, 401, message);
};

export const Forbidden = (res, message = "Access denied") => {
  return ErrorResponse(res, 403, message);
};

export const NotFound = (res, message = "Resource not found") => {
  return ErrorResponse(res, 404, message);
};

export const Conflict = (res, message = "Resource conflict") => {
  return ErrorResponse(res, 409, message);
};

export const InternalServerError = (res, message = "Internal server error") => {
  return ErrorResponse(res, 500, message);
};

export const HandleError = (res, error) => {
  console.error("🔥 UPDATE ERROR DETAILS:", error); // <--- ADD THIS LINE
  const errorAnalysis = analyzeError(error);
  return ErrorResponse(
    res,
    errorAnalysis.statusCode,
    errorAnalysis.message,
    errorAnalysis.details
  );
};

export {
  analyzeError,
  extractValidationError,
  validateResponseObject,
  validateStatusCode,
};

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
    this.status = 404;
  }
}

export class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = "ForbiddenError";
    this.status = 403;
  }
}
