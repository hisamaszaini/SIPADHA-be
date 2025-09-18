import z from "zod";

export const StatusSuratEnum = z.enum(['PENDING', 'DIPROSES', 'SELESAI', 'DITOLAK']);
export const JenisSuratEnum = z.enum([
    'KETERANGAN_USAHA',
    'KETERANGAN_TIDAK_MAMPU_SEKOLAH',
    'KETERANGAN_PENGHASILAN',
    'KETERANGAN_SUAMI_ISTRI_KELUAR_NEGERI',
    'PERINTAH_TUGAS']);

export const baseCreatePengajuanSuratSchema = z.object({
    // pendudukId: z.string().nonempty('Penduduk wajib dipilih !')
    //     .transform((val) => Number(val))
    //     .pipe(z.number().int().positive('Penduduk tidak valid')),
    pendudukId: z.preprocess((val) => { if (typeof val === 'string') { return val.trim() === '' ? NaN : Number(val); } return val; }, z.number('pendudukId harus berupa angka').int('ID Penduduk harus bilangan bulat').positive('Penduduk wajib dipilih dan ID tidak valid'),),
    // jenisSuratId: z.string().nonempty('Jenis surat wajib dipilih !')
    //     .transform((val) => Number(val))
    //     .pipe(z.number().int().positive('Jenis surat tidak valid')),
    status: StatusSuratEnum.default('PENDING'),
});

const keteranganUsahaFields = z.object({
    pertanian: z.string().trim(),
    perdagangan: z.string().trim(),
    peternakan: z.string().trim(),
    perindustrian: z.string().trim(),
    jasa: z.string().trim(),
    lain: z.string().trim(),
    alamatUsaha: z.string(),
    tahun: z.number().min(4, "Tahun harus 4 digit").refine((val) => val >= 1900 && val <= new Date().getFullYear(), {
      message: "Tahun tidak valid",
    }),
});

export const keteranganUsahaSchema = baseCreatePengajuanSuratSchema
    .extend({
        jenis: z.literal('KETERANGAN_USAHA'),
    })
    .merge(keteranganUsahaFields)
    .refine((data) => {
        return ['pertanian', 'perdagangan', 'peternakan', 'perindustrian', 'jasa', 'lain']
            .some((key) => {
                const value = data[key as keyof typeof data];
                if (typeof value === 'string') {
                    return value.trim() !== '';
                }
                return false;
            });
    }, {
        message: "Setidaknya satu bidang usaha harus diisi",
        path: ['lain'],
    });

export const keteranganaTidakMampuSekolahSchema = z.object({
    jenis: z.literal('KETERANGAN_TIDAK_MAMPU_SEKOLAH'),
    // targetId: z.string().nonempty('Anak wajib dipilih !').transform((val) => Number(val)).pipe(z.number().int().positive('Anak tidak valid')),
    targetId: z.preprocess((val) => { if (typeof val === 'string') { return val.trim() === '' ? NaN : Number(val); } return val; }, z.number('Anak wajib dipilih').int('targetId harus bilangan bulat').positive('Target wajib dipilih dan ID tidak valid'),),
    institusi: z.string().nonempty('Insitusi sekolah / universitas wajib diisi'),
    alamatSiswa: z.string().nonempty('Alamat siswa/mahasiswa wajib diisi'),
    penghasilan: z.string().nonempty('Penghasilan wajib diisi'),
    keterangan: z.string().nonempty('Keterangan pembayaran gaji wajib diisi')
});

export const createPengajuanSuratSchema = z.discriminatedUnion('jenis', [
    keteranganUsahaSchema,
    keteranganaTidakMampuSekolahSchema
]);

export const fullCreatePengajuanSuratSchema = createPengajuanSuratSchema.and(baseCreatePengajuanSuratSchema);

export type fullCreatePengajuanSuratDto = z.infer<typeof fullCreatePengajuanSuratSchema>;

export type UpdatePengajuanSuratDto = Partial<
    fullCreatePengajuanSuratDto
> & {
    pendudukId?: number;
    jenisSuratId?: number;
    status?: string;
};
