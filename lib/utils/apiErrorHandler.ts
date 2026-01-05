import { NextRequest, NextResponse } from "next/server";
import {
  ApiError,
  ApiErrorResponse,
  ApiResponse,
  ApiSuccessResponse,
  ValidationErrorDetail,
  ValidationErrorResponse,
  CastErrorResponse,
  isErrorResponse,
} from "@/app/types/ApiError";

export { ApiError };
export type { ApiResponse };

export interface ApiRequestOptions extends RequestInit {
  errorPrefix?: string;
  includeDetails?: boolean;
}

export interface ApiRequestResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export async function handleApiRequest<T = unknown>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<ApiRequestResult<T>> {
  const { errorPrefix, includeDetails = false, ...fetchOptions } = options;

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorMessage = errorPrefix
        ? `${errorPrefix}: ${response.statusText || `Status ${response.status}`}`
        : `Request failed with status ${response.status}`;

      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const text = await response.text();
          if (text) {
            const errorData = JSON.parse(text) as unknown;
            if (isErrorResponse(errorData)) {
              errorMessage = errorData.error;
              if (includeDetails && errorData.details) {
                if (
                  Array.isArray(errorData.details) &&
                  errorData.details.length > 0
                ) {
                  const details = errorData.details
                    .map((d: unknown) => {
                      if (
                        typeof d === "object" &&
                        d !== null &&
                        "path" in d &&
                        "message" in d
                      ) {
                        const detail = d as ValidationErrorDetail;
                        return `${detail.path}: ${detail.message}`;
                      }
                      return String(d);
                    })
                    .join(", ");
                  errorMessage += ` - ${details}`;
                } else {
                  errorMessage += ` - ${JSON.stringify(errorData.details)}`;
                }
              }
            } else if (
              typeof errorData === "object" &&
              errorData !== null &&
              "error" in errorData
            ) {
              errorMessage =
                typeof errorData.error === "string"
                  ? errorData.error
                  : errorMessage;
            }
          }
        }
      } catch (parseError) {
        const statusText = response.statusText;
        if (statusText) {
          errorMessage = errorPrefix
            ? `${errorPrefix}: ${statusText}`
            : statusText;
        }
        console.error("Failed to parse error response:", parseError);
      }

      return {
        success: false,
        error: errorMessage,
        statusCode: response.status,
      };
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = (await response.json()) as unknown;
      return {
        success: true,
        data: data as T,
      };
    }

    return {
      success: true,
      data: undefined as T,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during the request";

    console.error(`API request failed for ${url}:`, error);

    return {
      success: false,
      error: errorPrefix ? `${errorPrefix}: ${errorMessage}` : errorMessage,
    };
  }
}

export function withErrorHandler<T = unknown>(
  handler: (
    req: NextRequest,
    context?: unknown,
  ) => Promise<NextResponse<ApiResponse<T>>>,
) {
  return async (
    req: NextRequest,
    context?: unknown,
  ): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error("Route handler error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Internal server error";

      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          error: errorMessage,
        },
        { status: 500 },
      );
    }
  };
}

export function createErrorResponse(
  error: unknown,
  defaultMessage: string = "Internal server error",
  statusCode: number = 500,
): NextResponse<ApiErrorResponse> {
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "ValidationError" &&
    "errors" in error
  ) {
    const validationError = error as {
      errors: Record<string, { path: string; message: string; value: unknown }>;
    };

    const details: ValidationErrorDetail[] = Object.values(
      validationError.errors,
    ).map((e) => ({
      path: e.path,
      message: e.message,
      value: e.value,
    }));

    return NextResponse.json<ValidationErrorResponse>(
      {
        success: false,
        error: "ValidationError",
        details,
      },
      { status: 400 },
    );
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "CastError" &&
    "path" in error &&
    "value" in error
  ) {
    const castError = error as {
      path: string;
      value: unknown;
      kind?: string;
    };

    console.error("Mongoose CastError:", {
      path: castError.path,
      value: castError.value,
      kind: castError.kind,
    });

    return NextResponse.json<CastErrorResponse>(
      {
        success: false,
        error: "CastError",
        path: castError.path,
        value: castError.value,
      },
      { status: 400 },
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json<ApiErrorResponse>(error.toResponse(), {
      status: error.statusCode,
    });
  }

  const errorMessage = error instanceof Error ? error.message : defaultMessage;

  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error: errorMessage,
    },
    { status: statusCode },
  );
}

export function createSuccessResponse<T = unknown>(
  data?: T,
  statusCode: number = 200,
  additionalFields?: Record<string, unknown>,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json<ApiSuccessResponse<T>>(
    {
      success: true,
      data,
      ...additionalFields,
    },
    { status: statusCode },
  );
}

export function validateRequiredParam(
  value: unknown,
  paramName: string,
  statusCode: number = 400,
): asserts value is string {
  if (!value || typeof value !== "string") {
    throw new ApiError(
      `Invalid or missing ${paramName}`,
      statusCode,
      "INVALID_PARAM",
    );
  }
}

export async function validateJsonBody<T = unknown>(
  req: NextRequest,
): Promise<T> {
  try {
    return await req.json();
  } catch (error) {
    throw new ApiError(
      "Invalid request body",
      400,
      "INVALID_BODY",
      error instanceof Error ? error.message : undefined,
    );
  }
}
