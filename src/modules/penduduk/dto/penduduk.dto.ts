import z from "zod";

export const createPendudukSchema = z.object({
    nik: z.string().nonempty('Nomor Induk Kependudukan tidak boleh kosong!').min(16, 'Nomor Induk Kependudukan minimal 16 digit').regex(/^[0-9]+$/, 'Nomor Induk Kependudukan hanya boleh mengandung angka').trim(),
    nama: z.string().nonempty('Nama tidak boleh kosong').trim(),
    tempatLahir: z.string().nonempty('Tempat Lahir wajib diisi').trim(),
    tanggalLahir: z.iso.datetime('Tanggal lahir wajib diisi'),
    jenisKelamin: z.enum(['Laki-laki', 'Perempuan']),
    agama: z.enum(['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu']),
    statusPerkawinan: z.enum(['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati']),
    pendidikan: z.enum(['Tidak/Belum Sekolah', 'SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3']),
    pekerjaan: z.string().trim().optional(),
    hubunganDalamKeluarga: z.enum(['Kepala Keluarga', 'Istri', 'Anak', 'Famili Lain', 'Cucu', 'Orang Tua']).optional(),
    kartuKeluargaId: z.preprocess((val) => { if (typeof val === 'string') { return val.trim() === '' ? NaN : Number(val); } return val; }, z.number('Kartu keluarga wajib dipilih').int('kartuKeluargaId harus bilangan bulat').positive('Kartu keluarga tidak valid'),),
    userId: z.string().trim().optional().transform((val) => (val ? Number(val) : null)).refine((val) => val === null || (Number.isInteger(val) && val > 0), {
        message: 'User tidak valid',
    }),
});

export const updatePendudukSchema = createPendudukSchema.partial();

export type CreatePendudukDto = z.infer<typeof createPendudukSchema>;
export type UpdatePendudukDto = z.infer<typeof updatePendudukSchema>;