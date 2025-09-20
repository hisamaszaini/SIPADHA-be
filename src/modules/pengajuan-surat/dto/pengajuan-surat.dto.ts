import z from "zod";

export const StatusSuratEnum = z.enum(['PENDING', 'DIPROSES', 'SELESAI', 'DITOLAK']);
export const JenisSuratEnum = z.enum([
    'KETERANGAN_USAHA',
    'KETERANGAN_TIDAK_MAMPU_SEKOLAH',
    'KETERANGAN_PENGHASILAN',
    'KETERANGAN_SUAMI_ISTRI_KELUAR_NEGERI',
    'KETERANGAN_TIDAK_MEMILIKI_MOBIL',
    'KETERANGAN_PROFESI',
    'KETERANGAN_DOMISILI'
]);

export const baseCreatePengajuanSuratSchema = z.object({
    // pendudukId: z.string().nonempty('Penduduk wajib dipilih !')
    //     .transform((val) => Number(val))
    //     .pipe(z.number().int().positive('Penduduk tidak valid')),
    pendudukId: z.preprocess((val) => { if (typeof val === 'string') { return val.trim() === '' ? NaN : Number(val); } return val; }, z.number('pendudukId harus berupa angka').int('ID Penduduk harus bilangan bulat').positive('Penduduk wajib dipilih dan ID tidak valid'),),
    // jenisSuratId: z.string().nonempty('Jenis surat wajib dipilih !')
    //     .transform((val) => Number(val))
    //     .pipe(z.number().int().positive('Jenis surat tidak valid')),
    statusSurat: StatusSuratEnum.default('PENDING'),
});

const keteranganUsahaFields = z.object({
    pertanian: z.string().trim(),
    perdagangan: z.string().trim(),
    peternakan: z.string().trim(),
    perindustrian: z.string().trim(),
    jasa: z.string().trim(),
    lain: z.string().trim(),
    alamatUsaha: z.string().trim(),
    tahun: z.coerce.number().refine(
        num => !isNaN(num) && num >= 1900 && num <= new Date().getFullYear(),
        { message: "Tahun tidak valid" }
    )
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

export const keteranganaTidakMampuSekolahSchema = baseCreatePengajuanSuratSchema
    .extend({
        jenis: z.literal('KETERANGAN_TIDAK_MAMPU_SEKOLAH'),
        targetId: z.preprocess((val) => { if (typeof val === 'string') { return val.trim() === '' ? NaN : Number(val); } return val; }, z.number('Anak wajib dipilih').int('targetId harus bilangan bulat').positive('Target wajib dipilih dan ID tidak valid'),),
        institusi: z.string().nonempty('Insitusi sekolah / universitas wajib diisi'),
        alamatSiswa: z.string().nonempty('Alamat siswa/mahasiswa wajib diisi'),
        penghasilan: z.string().nonempty('Penghasilan wajib diisi'),
        keterangan: z.string().nonempty('Keterangan pembayaran gaji wajib diisi')
    });

export const keteranganSuamiIstriKeluarNegeriSchema = baseCreatePengajuanSuratSchema
    .extend({
        jenis: z.literal('KETERANGAN_SUAMI_ISTRI_KELUAR_NEGERI'),
        targetId: z.preprocess((val) => { if (typeof val === 'string') { return val.trim() === '' ? NaN : Number(val); } return val; }, z.number('Anak wajib dipilih').int('targetId harus bilangan bulat').positive('Target wajib dipilih dan ID tidak valid'),),
        tahun: z.number().min(4, "Tahun harus 4 digit").refine((val) => val >= 1900 && val <= new Date().getFullYear(), {
            message: "Tahun tidak valid",
        }),
        negaraTujuan: z.string().nonempty('Negara tujuan wajib diisi'),
        keterangan: z.string().nonempty('Keterangan tujuan pengajuan surat wajib diisi'),
    });

export const keteranganTidakMemilikiMobilSchema = baseCreatePengajuanSuratSchema
    .extend({
        jenis: z.literal('KETERANGAN_TIDAK_MEMILIKI_MOBIL')
    });

export const keteranganProfesiSchema = baseCreatePengajuanSuratSchema
    .extend({
        jenis: z.literal('KETERANGAN_PROFESI')
    });

export const keteranganDomisiliSchema = baseCreatePengajuanSuratSchema
    .extend({
        jenis: z.literal('KETERANGAN_DOMISILI'),
        keterangan: z.string().nonempty('Keterangan tujuan pengajuan surat wajib diisi'),
    });

export const createPengajuanSuratSchema = z.discriminatedUnion('jenis', [
    keteranganUsahaSchema,
    keteranganaTidakMampuSekolahSchema,
    keteranganSuamiIstriKeluarNegeriSchema,
    keteranganTidakMemilikiMobilSchema,
    keteranganProfesiSchema,
    keteranganDomisiliSchema
]);

export const fullCreatePengajuanSuratSchema = createPengajuanSuratSchema;

export type fullCreatePengajuanSuratDto = z.infer<typeof fullCreatePengajuanSuratSchema>;

export type UpdatePengajuanSuratDto = Partial<
    fullCreatePengajuanSuratDto
> & {
    pendudukId?: number;
    jenisSuratId?: number;
    statusSurat?: 'PENDING' | 'DIPROSES' | 'SELESAI' | 'DITOLAK';
};
