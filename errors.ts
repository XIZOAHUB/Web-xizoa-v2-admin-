/**
 * Custom error classes
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Array<{ field: string; message: string }>;

  constructor(
    code: string,
    message: string,
    statusCode = 500,
    details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    details?: Array<{ field: string; message: string }>
  ) {
    super('validation_error', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super('unauthorized', message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super('forbidden', message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('not_found', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter = 60) {
    super('rate_limited', 'Too many requests', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('conflict', message, 409);
    this.name = 'ConflictError';
  }
}

export class GitHubError extends AppError {
  constructor(message: string, statusCode = 500) {
    super('github_error', message, statusCode);
    this.name = 'GitHubError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
