import z from "zod";

export const settingSchema = z.object({
    namaKepdes: z.string().nonempty('Nama Kepala Desa wajib diisi'),
    nikKepdes: z.string().nonempty('NIK Kepala Desa wajib diisi'),
    jenisKelaminKepdes: z.enum(['Laki-laki', 'Perempuan']),
    alamatKepdes: z.string().nonempty('Alamat Kepala Desa wajib diisi'),
    tempatLahirKepdes: z.string().nonempty('Tempat Lahir Kepada Desa wajib diisi'),
    tanggalLahirKepdes: z.coerce.date({ 'message': 'Tanggal lahir wajib diisi' }),
    endPointWa: z.string().nonempty('Alamat API Endpoint Whatsapp wajib diisi'),
});

export type settingDto = z.infer<typeof settingSchema>;