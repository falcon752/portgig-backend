const logger = require("./logging").getLogger("Error");

class AppError extends Error {
  constructor(message, options) {
    super(message, options);
    this.cause = options?.cause || null;
  }

  toObject() {
    return {
      message: this.message,
      status: this?.status,
      name: this.name,
      cause: this.cause?.message || null, // Optional: include cause for debugging
    };
  }
}

class InternalServerError extends AppError {
  constructor(message = "INTERNAL_SERVER_ERROR", options) {
    super(message, options);
    this.name = "InternalServerError";
    this.status = options?.status || 500;
  }
}

class DatabaseError extends AppError {
  constructor(message = "DATABASE_ERROR", options) {
    super(message, options);
    this.name = "DatabaseError";
    this.status = options?.status || 500;
  }
}

class InvalidPayloadError extends AppError {
  constructor(message = "INVALID_PAYLOAD", options) {
    super(message, options);
    this.name = "InvalidPayloadError";
    this.status = options?.status || 400;
  }
}

class TransactionError extends AppError {
  constructor(message = "TRANSACTION_ERROR", options) {
    super(message, options);
    this.name = "TransactionError";
    this.status = options?.status || 400;
  }
}

class UnAuthorizedError extends AppError {
  constructor(message = "UNAUTHORIZED", options) {
    super(message, options);
    this.name = "UnAuthorizedError";
    this.status = options?.status || 403;
  }
}

class AuthenticationError extends AppError {
  constructor(message = "UNAUTHENTICATED", options) {
    super(message, options);
    this.name = "AuthenticationError";
    this.status = options?.status || 401;
  }
}
class ServiceNotAvailable extends AppError {
  constructor(message = "SERVICE_NOT_AVAILABLE") {
    super(message, options);
    this.name = "ServiceNotAvailable";
    this.status = options?.status || 503;
  }
}

module.exports = {
  InternalServerError,
  DatabaseError,
  InvalidPayloadError,
  UnAuthorizedError,
  AuthenticationError,
  TransactionError,
  ServiceNotAvailable,
  AppError,
};
