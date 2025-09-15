import z from "zod";

export const createRwSchema = z.object({
    nomor: z.string().nonempty('Nomor RW tidak boleh kosong!').trim().regex(/^[0-9]+$/, 'Nomor RW hanya boleh mengandung angka'),
    dukuhId: z.coerce.number().int().positive().refine((val) => !Number.isNaN(val), { message: "Dukuh tidak valid!", })
});

export const updateRwSchema = createRwSchema.partial();

export type CreateRwDto = z.infer<typeof createRwSchema>;
export type UpdateRwDto = z.infer<typeof updateRwSchema>;