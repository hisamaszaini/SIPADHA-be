import { RoleUsersEnum } from '@/modules/users/dto/users.dto';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().trim(),
  password: z.string().min(6),
});

export const registerSchema = loginSchema.extend({
  noHp: z.string().nonempty('Nomor HP Wajib diisi, (+62...)').min(11, 'Nomor HP minimal 11 digit').max(15, 'Nomor HP Maksimal 15'),
  username: z.string().nonempty().trim(),
  role: RoleUsersEnum,
});

export const wargaRegisterSchema = loginSchema.extend({
  noHp: z.string().nonempty('Nomor HP Wajib diisi, (+62...)').min(11, 'Nomor HP minimal 11 digit').max(15, 'Nomor HP Maksimal 15'),
  username: z.string().nonempty().trim(),
  nik: z.string().nonempty('Nomor Induk Kependudukan tidak boleh kosong!').min(16, 'Nomor Induk Kependudukan minimal 16 digit').regex(/^[0-9]+$/, 'Nomor Induk Kependudukan hanya boleh mengandung angka').trim(),
  role: RoleUsersEnum.default("WARGA"),
});

export const refreshSchema = z.object({
  refreshToken: z.string(),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type WargaRegisterDto = z.infer<typeof wargaRegisterSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;