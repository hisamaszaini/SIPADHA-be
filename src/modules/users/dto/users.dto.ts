import z from "zod";

export const RoleUsersEnum = z.enum([
  "ADMIN",
  "PENGURUS",
  "WARGA"
]);

export const StatusUsersEnum = z.enum([
  "ACTIVE",
  "INACTIVE"
])

export const baseCreateUserSchema = z.object({
  noHp: z.string().nonempty('Nomor HP Wajib diisi, (08...)').min(11, 'Nomor HP minimal 11 digit').max(15, 'Nomor HP Maksimal 15').trim(),
  email: z.email().nonempty('Email wajib diisi').trim(),
  username: z.string().nonempty('Username wajib diisi').trim(),
  password: z.string().nonempty('Password wajib diisi').min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string().nonempty('Konfirmasi password wajib diisi').min(8, 'Konfirmasi password minimal 8 karakter'),
  StatusUser: StatusUsersEnum,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password dan konfirmasi password tidak cocok',
  path: ['confirmPassword'],
});

export const adminPengurusCreateUserSchema = baseCreateUserSchema.merge(
  z.object({
    role: z.enum(['ADMIN', 'PENGURUS']),
  })
);

export const wargaCreateUserSchema = baseCreateUserSchema.merge(
  z.object({
    nik: z.string().min(16, 'Nomor Induk Kependudukan minimal 16 digit').trim().regex(/^[0-9]+$/, 'Nomor Induk Kependudukan hanya boleh mengandung angka'),
    role: z.literal('WARGA'),
  }),
);

export const updateUserSchema = z
  .object({
    username: z.string().nonempty().trim().optional(),
    password: z.string().min(8).optional(),
    confirmPassword: z.string().optional(),
    role: RoleUsersEnum.optional(),
    statusUser: StatusUsersEnum.optional(),
  })
  .refine(
    d => !d.password || (d.confirmPassword && d.password === d.confirmPassword),
    { message: 'Password dan konfirmasi tidak cocok', path: ['confirmPassword'] }
  )
  .strict();

export const updateProfileSchema = z
  .object({
    username: z.string().nonempty().trim().optional(),
    password: z.string().min(8).optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    d => !d.password || (d.confirmPassword && d.password === d.confirmPassword),
    { message: 'Password dan konfirmasi tidak cocok', path: ['confirmPassword'] }
  )
  .strict();

export const registerSchema = z.discriminatedUnion("role", [
  adminPengurusCreateUserSchema,
  wargaCreateUserSchema,
]);


export type CreateUserDto = z.infer<typeof registerSchema>;
export type wargaCreateUserDto = z.infer<typeof wargaCreateUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;