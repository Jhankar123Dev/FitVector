/**
 * Standard API response wrapper.
 * On success, `data` is present. On error, `error` is present.
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated API response for list endpoints.
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Standard pagination query parameters.
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Standard sorting query parameters.
 */
export interface SortParams<T extends string = string> {
  sortBy?: T;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Helper to create a successful API response.
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return { data, message };
}

/**
 * Helper to create an error API response.
 */
export function errorResponse(error: string): ApiResponse<never> {
  return { error };
}

/**
 * Helper to create a paginated response.
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  return {
    data,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}
