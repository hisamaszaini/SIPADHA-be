import { createZodDto } from "nestjs-zod";
import z from "zod";

export const createRtSchema = z.object({
    nomor: z.string().nonempty('Nomor RT tidak boleh kosong!').trim().regex(/^[0-9]+$/, 'Nomor RT hanya boleh mengandung angka'),
    rwId: z.string().nonempty('RW wajib dipilih')
        .transform((val) => Number(val))
        .pipe(z.number().int().positive('RW tidak valid')),
});

export const updateRtSchema = createRtSchema.partial();

export class CreateRtDto extends createZodDto(createRtSchema) {}
export class UpdateRtDto extends createZodDto(updateRtSchema) {}
