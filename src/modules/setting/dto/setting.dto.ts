import z from "zod";

export const settingSchema = z.object({
    namaKepdes: z.string().nonempty('Nama Kepala Desa wajib diisi'),
    nikKepdes: z.string().nonempty('NIK Kepala Desa wajib diisi'),
    jenisKelaminKepdes: z.enum(['Laki-laki', 'Perempuan']),
    alamatKepdes: z.string().nonempty('Alamat Kepala Desa wajib diisi'),
    tempatLahirKepdes: z.string().nonempty('Tempat Lahir Kepada Desa wajib diisi'),
    tanggalLahirKepdes: z.iso.datetime('Tanggal lahir wajib diisi').nonempty('Tanggal lahir wajib diisi'),
    nomorWa: z.string().nonempty('Nomor Whatsapp Admin wajib diisi'),
    endPointWa: z.string().nonempty('Alamat API Endpoint Whatsapp wajib diisi'),
});

export type settingDto = z.infer<typeof settingSchema>;