export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: number;
    message: string;
  };
}

export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function apiSuccess<T>(data: T): ApiSuccessResponse<T> {
  return { success: true, data };
}

export function apiError(code: number, message: string): ApiErrorResponse {
  return { success: false, error: { code, message } };
}

export function apiPaginated<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): ApiPaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
