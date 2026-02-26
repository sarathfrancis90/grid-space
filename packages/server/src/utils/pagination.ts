export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function getPaginationParams(query: {
  page?: string;
  limit?: string;
}): PaginationParams {
  const rawPage = parseInt(query.page ?? "1", 10);
  const rawLimit = parseInt(query.limit ?? "20", 10);
  const page = Math.max(1, Number.isNaN(rawPage) ? 1 : rawPage);
  const limit = Math.min(
    100,
    Math.max(1, Number.isNaN(rawLimit) ? 20 : rawLimit),
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
