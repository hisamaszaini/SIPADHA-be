export type SortOrder = 'asc' | 'desc';

export interface FindAllPengajuanSuratQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  statusSurat?: 'PENDING' | 'DIPROSES' | 'SELESAI' | 'DITOLAK';
  sortBy?: string;
  sortOrder?: SortOrder;
}

export const jenisSuratOptions = [
    {value: 'KETERANGAN_USAHA', label: 'Surat Keterangan Usaha'},
    {value: 'KETERANGAN_TIDAK_MAMPU_SEKOLAH', label: 'Surat Keterangan Tidak Mampu (Sekolah)'},
    {value: 'KETERANGAN_SUAMI_ISTRI_KELUAR_NEGERI', label: 'Surat Keterangan Suami/Istri Keluar Negeri'},
    {value: 'KETERANGAN_TIDAK_MEMILIKI_MOBIL', label: 'Surat Keterangan Tidak Memiliki Mobil'},
    {value: 'KETERANGAN_PROFESI', label: 'Surat Keterangan Profesi'},
    {value: 'KETERANGAN_DOMISILI', label: 'Surat Keterangan Domisili'}
];