import z from "zod";

export const StatusSuratEnum = z.enum(['PENDING', 'DIPROSES', 'SELESAI', 'DITOLAK']);

export const baseCreatePengajuanSuratSchema = z.object({
    pendudukId: z.string().nonempty('Penduduk wajib dipilih !')
        .transform((val) => Number(val))
        .pipe(z.number().int().positive('Penduduk tidak valid')),
    jenisSuratId: z.string().nonempty('Jenis surat wajib dipilih !')
        .transform((val) => Number(val))
        .pipe(z.number().int().positive('Jenis surat tidak valid')),
    status: StatusSuratEnum.default('PENDING'),
});