// Interface untuk response pagination
interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Interface untuk query parameters
interface FindAllQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Interface untuk user tanpa field sensitif
interface SafeUser {
  id: number;
  username: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}
