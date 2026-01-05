/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
  code?: string;
}

/**
 * Standard API success response structure
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  [key: string]: unknown; // Allow additional fields like 'trip', 'log', etc.
}

/**
 * Union type for API responses
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Validation error detail structure
 */
export interface ValidationErrorDetail {
  path: string;
  message: string;
  value?: unknown;
}

/**
 * Extended error response with validation details
 */
export interface ValidationErrorResponse extends ApiErrorResponse {
  error: "ValidationError";
  details: ValidationErrorDetail[];
}

/**
 * Cast error response structure
 */
export interface CastErrorResponse extends ApiErrorResponse {
  error: "CastError";
  path?: string;
  value?: unknown;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  toResponse(): ApiErrorResponse {
    return {
      success: false,
      error: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

/**
 * Type guard to check if a response is an error response
 */
export function isErrorResponse(
  response: unknown,
): response is ApiErrorResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    response.success === false &&
    "error" in response &&
    typeof response.error === "string"
  );
}

/**
 * Type guard to check if a response is a success response
 */
export function isSuccessResponse<T = unknown>(
  response: unknown,
): response is ApiSuccessResponse<T> {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    response.success === true
  );
}
