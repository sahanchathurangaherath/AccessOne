export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export function pageQuery(page = 0, size = 20, sort?: string) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (sort) params.set("sort", sort);
  return `?${params.toString()}`;
}
