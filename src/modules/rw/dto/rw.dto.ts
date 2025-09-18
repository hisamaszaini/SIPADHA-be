import { createZodDto } from "nestjs-zod";
import z from "zod";

export const createRwSchema = z.object({
    nomor: z.string().nonempty('Nomor RW tidak boleh kosong!').trim().regex(/^[0-9]+$/, 'Nomor RW hanya boleh mengandung angka'),
    dukuhId: z.coerce.number().int().positive().refine((val) => !Number.isNaN(val), { message: "Dukuh tidak valid!", })
});

export const updateRwSchema = createRwSchema.partial();

export class CreateRwDto extends createZodDto(createRwSchema) {}
export class UpdateRwDto extends createZodDto(updateRwSchema) {}

