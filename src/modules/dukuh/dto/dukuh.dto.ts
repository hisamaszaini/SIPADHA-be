import { createZodDto } from "nestjs-zod";
import z from "zod";

export const createDukuhSchema = z.object({
    nama: z.string().trim().nonempty('Nama dukuh wajib diisi')
});
export const updateDukuhSchema = createDukuhSchema.partial();

export class CreateDukuhDto extends createZodDto(createDukuhSchema) {}
export class UpdateDukuhDto extends createZodDto(updateDukuhSchema) {}