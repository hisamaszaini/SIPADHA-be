import z from "zod";

export const createKartuKeluargaSchema = z.object({
    noKk: z.string().nonempty('Nomor kartu keluarga tidak boleh kosong!').min(16, 'Nomor KK minimal 16 digit').regex(/^[0-9]+$/, 'Nomor kartu keluarga hanya boleh mengandung angka'),
    alamat: z.string().nonempty('Alamat wajib diisi').trim(),
    dukuhId: z.string().nonempty('Dukuh wajib dipilih')
        .transform((val) => Number(val))
        .pipe(z.number().int().positive('Dukuh tidak valid')),
    rwId: z.string().nonempty('RT wajib dipilih')
        .transform((val) => Number(val))
        .pipe(z.number().int().positive('RW tidak valid')),
    rtId: z.string().nonempty('RT wajib dipilih')
        .transform((val) => Number(val))
        .pipe(z.number().int().positive('RW tidak valid')),
});

export const createKartuKeluargaWithPendudukSchema = createKartuKeluargaSchema.merge(
    z.object({
        nik: z.string().nonempty('Nomor Induk Kependudukan tidak boleh kosong!').min(16, 'Nomor Induk Kependudukan minimal 16 digit').regex(/^[0-9]+$/, 'Nomor Induk Kependudukan hanya boleh mengandung angka').trim(),
        nama: z.string().nonempty('Nama tidak boleh kosong').trim(),
        tempatLahir: z.string().nonempty('Tempat Lahir wajib diisi').trim(),
        tanggalLahir: z.iso.datetime('Tanggal lahir wajib diisi'),
        jenisKelamin: z.enum(['Laki-laki', 'Perempuan']),
        agama: z.enum(['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu']),
        statusPerkawinan: z.enum(['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati']),
        pendidikan: z.enum(['Tidak/Belum Sekolah', 'SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3']),
        pekerjaan: z.string().trim().optional(),
        hubunganDalamKeluarga: z.enum(['Kepala Keluarga', 'Istri', 'Anak', 'Famili Lain', 'Cucu', 'Orang Tua']).optional().default('Kepala Keluarga'),
    }),
);

export const createKkFromExistingPendudukSchema = createKartuKeluargaSchema.merge(
    z.object({
        kepalaPendudukId: z.number().min(1, 'ID Kepala Penduduk wajib diisi'),
    }),
);

export const updateKartuKeluargaSchema = createKartuKeluargaWithPendudukSchema.merge(z.object({
    kepalaPendudukId: z.string().nonempty('Kepala Keluarga wajib dipilih')
        .transform((val) => Number(val))
        .pipe(z.number().int().positive('Kepala Keluarga tidak valid')),
}));
export const updateKartuKeluargaWithPendudukSchema = updateKartuKeluargaSchema.partial();

export type CreateKartuKeluargaDto = z.infer<typeof createKartuKeluargaSchema>;
export type CreateKartuKeluargaWithPendudukDto = z.infer<typeof createKartuKeluargaWithPendudukSchema>;
export type CreateKkFromExistingPendudukDto = z.infer<typeof createKkFromExistingPendudukSchema>;
export type UpdateKartuKeluargaDto = z.infer<typeof updateKartuKeluargaSchema>;
export type updateKartuKeluargaWithPendudukDto = z.infer<typeof updateKartuKeluargaWithPendudukSchema>;