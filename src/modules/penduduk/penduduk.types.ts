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
  kepalaKeluargaId?: number;
  rtId?: number;
  rwId?: number;
  dukuhId?: number;
  jenisKelamin?: string;
  agama?: string;
  statusPerkawinan?: string;
}