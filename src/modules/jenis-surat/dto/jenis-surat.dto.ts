import z from "zod";

export const createJenisSuratSchema = z.object({
    kode: z.string().nonempty('Kode surat wajib diisi!').trim(),
    namaSurat: z.string().nonempty('Nama surat wajib diisi!').trim(),
    deskripsi: z.string().trim().optional(),
    // templateFile: z.string().trim()
});

export const updateJenisSuratSchema = createJenisSuratSchema.partial();

export type CreateJenisSuratDto = z.infer<typeof createJenisSuratSchema>;
export type UpdateJenisSuratDto = z.infer<typeof updateJenisSuratSchema>;