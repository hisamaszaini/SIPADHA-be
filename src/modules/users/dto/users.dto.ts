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
  statusUser: StatusUsersEnum,
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

const baseUpdateUserSchema = z.object({
  noHp: z.string().trim().optional(),
  username: z.string().trim().optional(),
  email: z.string().email('Format email tidak valid').nonempty('Email wajib diisi'),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  statusUser: StatusUsersEnum.optional(),
}).refine(
  (data) => {
    if (!data.password) return true;
    if (data.password.length < 8) return false;
    if (!data.confirmPassword || data.password !== data.confirmPassword) return false;
    return true;
  },
  {
    message: 'Password dan konfirmasi harus cocok dan minimal 8 karakter',
    path: ['confirmPassword'],
  }
);

export const updateProfileSchema = z
  .object({
    email: z.string().nonempty().trim().optional(),
    noHp: z.string().min(11, 'Nomor HP minimal 11 digit').max(15, 'Nomor HP Maksimal 15').trim().optional(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(data => {
    if (!data.password) return true;
    if (data.password.length < 8) return false;
    if (!data.confirmPassword || data.password !== data.confirmPassword) return false;

    return true;
  }, {
    message: 'Password dan konfirmasi harus cocok dan minimal 8 karakter',
    path: ['confirmPassword'],
  })
  .strict();

export const registerSchema = z.discriminatedUnion("role", [
  adminPengurusCreateUserSchema,
  wargaCreateUserSchema,
]);

const adminPengurusUpdateSchema = baseUpdateUserSchema.merge(
  z.object({
    role: z.enum(['ADMIN', 'PENGURUS']),
    nik: z.nullable(z.never()).optional(),
  })
);

const wargaUpdateSchema = baseUpdateUserSchema.merge(
  z.object({
    role: z.literal('WARGA'),
    nik: z.string()
      .length(16, 'Nomor Induk Kependudukan harus 16 digit')
      .regex(/^[0-9]+$/, 'Nomor Induk Kependudukan hanya boleh angka'),
  })
);

export const updateUserSchema = z.discriminatedUnion('role', [
  adminPengurusUpdateSchema,
  wargaUpdateSchema,
]);

export type CreateUserDto = z.infer<typeof registerSchema>;
export type wargaCreateUserDto = z.infer<typeof wargaCreateUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;