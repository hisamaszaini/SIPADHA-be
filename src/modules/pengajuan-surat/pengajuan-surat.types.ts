export type SortOrder = 'asc' | 'desc';

export interface FindAllPengajuanSuratQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  statusSurat?: 'PENDING' | 'DIPROSES' | 'SELESAI' | 'DITOLAK';
  sortBy?: string;
  sortOrder?: SortOrder;
}