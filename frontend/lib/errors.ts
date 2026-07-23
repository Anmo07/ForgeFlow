/**
 * ForgeFlow API Error
 *
 * Typed error class that wraps standardized backend error responses.
 * Every apiFetch rejection uses this class — never raw Error objects.
 *
 * Backend error response shape:
 * {
 *   error_code: string,    // e.g. "INVOICE_NOT_FOUND"
 *   message: string,       // Human-readable, safe to show users
 *   request_id: string,    // Correlation ID for Sentry/Loki lookup
 *   timestamp: string,
 * }
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly errorCode: string;
  public readonly requestId: string | undefined;
  public readonly timestamp: string | undefined;

  constructor(
    message: string,
    status: number,
    errorCode: string = 'UNKNOWN_ERROR',
    requestId?: string,
    timestamp?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.requestId = requestId;
    this.timestamp = timestamp;
    
    // Restore prototype chain for ES5 / TS environments
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** True for network-level errors (no status code) */
  get isNetworkError(): boolean {
    return this.status === 0;
  }

  /** True for auth failures — triggers redirect to login */
  get isAuthError(): boolean {
    return this.status === 401;
  }

  /** True for permission failures */
  get isPermissionError(): boolean {
    return this.status === 403;
  }

  /** True for not found */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** True for validation failures (Pydantic) */
  get isValidationError(): boolean {
    return this.status === 422;
  }

  /** True for optimistic lock conflict */
  get isConflict(): boolean {
    return this.status === 409;
  }

  /** True for server-side failures */
  get isServerError(): boolean {
    return this.status >= 500;
  }

  /**
   * User-facing message — safe to display in toast notifications.
   * Falls back to a generic message if the server message is empty.
   */
  get displayMessage(): string {
    if (this.message) return this.message;
    if (this.isNetworkError) return 'Network error — check your connection.';
    if (this.isAuthError) return 'Your session has expired. Please log in again.';
    if (this.isPermissionError) return 'You do not have permission to do this.';
    if (this.isNotFound) return 'The requested resource was not found.';
    if (this.isConflict) return 'This record was modified by someone else. Please refresh.';
    if (this.isServerError) return 'Server error — our team has been notified.';
    return 'An unexpected error occurred.';
  }
}

/**
 * Type guard — check if an unknown error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
