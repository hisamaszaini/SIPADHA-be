import z from "zod";

export const createDukuhSchema = z.object({
    nama: z.string().nonempty('Nama dukuh wajib diisi').trim()
});
export const updateDukuhSchema = createDukuhSchema.partial();

export type CreateDukuhDto = z.infer<typeof createDukuhSchema>;
export type UpdateDukuhDto = z.infer<typeof updateDukuhSchema>;