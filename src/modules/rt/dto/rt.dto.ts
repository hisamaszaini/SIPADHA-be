import z from "zod";

export const createRtSchema = z.object({
    nomor: z.string().nonempty('Nomor RT tidak boleh kosong!').trim().regex(/^[0-9]+$/, 'Nomor RT hanya boleh mengandung angka'),
    rwId: z.string().nonempty('RW wajib dipilih')
        .transform((val) => Number(val))
        .pipe(z.number().int().positive('RW tidak valid')),
});

export const updateRtSchema = createRtSchema.partial();

export type CreateRtDto = z.infer<typeof createRtSchema>;
export type UpdateRtDto = z.infer<typeof updateRtSchema>;