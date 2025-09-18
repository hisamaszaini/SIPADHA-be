import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { RegisterDto, UpdateProfileDto, UpdateUserDto } from './dto/users.dto';
import { hash } from '../auth/auth.util';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async create(dto: RegisterDto) {
    try {
      // cek username
      const checkUsername = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (checkUsername) {
        throw new ConflictException('Username sudah terdaftar');
      }

      // cek email
      const checkEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (checkEmail) {
        throw new ConflictException('Email sudah terdaftar');
      }

      let penduduk: { id: number; userId: number | null } | null = null;
      if (dto.role === 'WARGA') {
        penduduk = await this.prisma.penduduk.findUnique({
          where: { nik: dto.nik },
        });

        if (!penduduk) {
          throw new BadRequestException('NIK tidak ditemukan di data penduduk');
        }

        if (penduduk.userId) {
          throw new ConflictException('NIK sudah digunakan untuk akun lain');
        }
      }

      const user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            noHp: dto.noHp,
            email: dto.email,
            username: dto.username,
            password: await hash(dto.password),
            role: dto.role,
            statusUser: dto.StatusUser ?? 'ACTIVE',
          },
        });

        if (dto.role === 'WARGA' && penduduk) {
          await tx.penduduk.update({
            where: { id: penduduk.id },
            data: { userId: newUser.id },
          });
        }

        return newUser;
      });

      const { password, refreshToken, ...userData } = user;

      return {
        message: 'Akun berhasil dibuat',
        data: userData,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal membuat akun baru');
    }
  }


  /**
   * Update user (oleh admin/pengurus)
   */
  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const data: any = {};

    // noHp
    if (dto.noHp) data.noHp = dto.noHp;

    // Username
    if (dto.username) {
      if (dto.username !== user.username) {
        const exists = await this.prisma.user.findUnique({ where: { username: dto.username } });
        if (exists) throw new BadRequestException('Username sudah digunakan');
      }
      data.username = dto.username;
    }

    // Email
    if (dto.email) {
      if (dto.email !== user.email) {
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists) throw new BadRequestException('Email sudah digunakan');
      }
      data.email = dto.email;
    }

    // Role & status
    if (dto.role) data.role = dto.role;
    if (dto.statusUser) data.statusUser = dto.statusUser;

    // NIK hanya untuk WARGA
    if ((dto.role === 'WARGA' || user.role === 'WARGA') && dto.nik) {
      const penduduk = await this.prisma.penduduk.findUnique({ where: { nik: dto.nik } });
      if (!penduduk) throw new BadRequestException('NIK tidak ditemukan di data penduduk');

      if (penduduk.userId && penduduk.userId !== id) {
        throw new BadRequestException('NIK sudah terdaftar di user lain');
      }

      data.nik = dto.nik;
    }

    // Password
    if (dto.password) {
      if (dto.password !== dto.confirmPassword) throw new BadRequestException('Password dan konfirmasi tidak cocok');
      data.password = await hash(dto.password);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    const { password, refreshToken, ...userData } = updated;
    return { message: 'User berhasil diperbarui', data: userData };
  }

  /**
   * Update profile (oleh user sendiri / warga)
   */
  async updateProfile(id: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const data: any = {};

    if (dto.username) data.username = dto.username;
    if (dto.password) {
      if (dto.password !== dto.confirmPassword) {
        throw new BadRequestException('Password dan konfirmasi tidak cocok');
      }
      data.password = await hash(dto.password);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    const { password, refreshToken, ...userData } = updated;
    return { message: 'Profil berhasil diperbarui', data: userData };
  }

  async findAll(queryParams: UserFindAllQueryParams): Promise<PaginatedResult<SafeUser>> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        role,
        sortBy = 'id',
        sortOrder = 'asc',
      } = queryParams;

      if (page < 1 || limit < 1 || limit > 100) {
        throw new BadRequestException('Parameter paginasi tidak valid');
      }

      const where: any = {};

      // filter role jika ada
      if (role) {
        where.role = role;
      }

      // filter search jika ada
      if (search) {
        where.OR = [
          { username: { contains: search, mode: 'insensitive' } },
          { role: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, users] = await Promise.all([
        this.prisma.user.count({ where }),
        this.prisma.user.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          select: {
            id: true,
            username: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            penduduk: {
              select: {
                nik: true,
                nama: true,
              },
            },
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: users as SafeUser[],
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal mengambil data user');
    }
  }

  async findOne(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          noHp: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          penduduk: {
            select: {
              nik: true,
              nama: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User tidak ditemukan');
      }

      return {
        message: 'User berhasil diambil',
        data: user,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal mengambil data user');
    }
  }

  async remove(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('User tidak ditemukan');
      }

      if (user.role === 'WARGA') {
        await this.prisma.penduduk.updateMany({
          where: { userId: user.id },
          data: { userId: null },
        });
      }

      await this.prisma.user.delete({
        where: { id },
      });

      return {
        message: 'User berhasil dihapus',
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User tidak ditemukan');
      }

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Gagal menghapus user');
    }
  }
}