function successResponse(res, options = {}) {
  const {
    statusCode = 200,
    message = "Success",
    data = null,
    total = null,
    meta = null,
  } = options;

  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (total !== null) {
    response.total = total;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
}

function errorResponse(res, options = {}) {
  const {
    statusCode = 500,
    message = "Internal server error",
    error = null,
    errors = null,
  } = options;

  const response = {
    success: false,
    message,
  };

  if (error !== null && process.env.NODE_ENV === "development") {
    response.error = error;
  }

  if (errors !== null) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
}

function createdResponse(res, data = null, message = "Created successfully") {
  return successResponse(res, {
    statusCode: 201,
    message,
    data,
  });
}

function okResponse(res, data = null, message = "Success") {
  return successResponse(res, {
    statusCode: 200,
    message,
    data,
  });
}

function listResponse(res, data = [], message = "Data fetched successfully") {
  return successResponse(res, {
    statusCode: 200,
    message,
    total: Array.isArray(data) ? data.length : 0,
    data,
  });
}

function deletedResponse(res, data = null, message = "Deleted successfully") {
  return successResponse(res, {
    statusCode: 200,
    message,
    data,
  });
}

function badRequestResponse(res, message = "Bad request", errors = null) {
  return errorResponse(res, {
    statusCode: 400,
    message,
    errors,
  });
}

function unauthorizedResponse(res, message = "Unauthorized") {
  return errorResponse(res, {
    statusCode: 401,
    message,
  });
}

function forbiddenResponse(res, message = "Forbidden") {
  return errorResponse(res, {
    statusCode: 403,
    message,
  });
}

function notFoundResponse(res, message = "Data not found") {
  return errorResponse(res, {
    statusCode: 404,
    message,
  });
}

function conflictResponse(res, message = "Conflict") {
  return errorResponse(res, {
    statusCode: 409,
    message,
  });
}

function validationResponse(res, errors = [], message = "Validation failed") {
  return errorResponse(res, {
    statusCode: 422,
    message,
    errors,
  });
}

function serverErrorResponse(res, error = null, message = "Internal server error") {
  return errorResponse(res, {
    statusCode: 500,
    message,
    error,
  });
}

function paginatedResponse(res, options = {}) {
  const {
    data = [],
    message = "Data fetched successfully",
    page = 1,
    limit = 10,
    total = 0,
  } = options;

  const totalPages = Math.ceil(total / limit);

  return successResponse(res, {
    statusCode: 200,
    message,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}

function uploadResponse(res, file, message = "File uploaded successfully") {
  return successResponse(res, {
    statusCode: 201,
    message,
    data: file,
  });
}

function generateResponse(res, model, message = "3D model generated successfully") {
  return successResponse(res, {
    statusCode: 201,
    message,
    data: model,
  });
}

function statusResponse(res, status, data = null, message = "Status fetched successfully") {
  return successResponse(res, {
    statusCode: 200,
    message,
    data: {
      status,
      ...data,
    },
  });
}

function healthResponse(res, data = {}) {
  return successResponse(res, {
    statusCode: 200,
    message: "Server is running",
    data: {
      status: "OK",
      server: "online",
      time: new Date().toISOString(),
      ...data,
    },
  });
}

module.exports = {
  successResponse,
  errorResponse,

  createdResponse,
  okResponse,
  listResponse,
  deletedResponse,

  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  validationResponse,
  serverErrorResponse,

  paginatedResponse,
  uploadResponse,
  generateResponse,
  statusResponse,
  healthResponse,
};