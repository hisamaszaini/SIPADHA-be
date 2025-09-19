import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePendudukDto, UpdatePendudukDto } from './dto/penduduk.dto';

@Injectable()
export class PendudukService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreatePendudukDto) {
    try {
      // Cek jika NIK sudah ada
      const nikExists = await this.prisma.penduduk.findUnique({
        where: { nik: dto.nik },
      });

      if (nikExists) {
        throw new ConflictException('NIK sudah terdaftar');
      }

      // Cek jika kepala keluarga ada
      const kepalaKeluargaExists = await this.prisma.kartuKeluarga.findUnique({
        where: { id: dto.kartuKeluargaId },
      });

      if (!kepalaKeluargaExists) {
        throw new NotFoundException('Kartu keluarga tidak ditemukan');
      }

      // Cek jika user ID diberikan, pastikan user ada
      if (dto.userId) {
        const userExists = await this.prisma.user.findUnique({
          where: { id: dto.userId },
        });

        if (!userExists) {
          throw new NotFoundException('User tidak ditemukan');
        }
      }

      // Jika hubunganDalamKeluarga adalah "Kepala Keluarga", 
      // pastikan belum ada Kepala Keluarga dalam KK tersebut
      if (dto.hubunganDalamKeluarga === 'Kepala Keluarga') {
        const existingKepala = await this.prisma.penduduk.findFirst({
          where: {
            kartuKeluargaId: dto.kartuKeluargaId,
            hubunganDalamKeluarga: 'Kepala Keluarga',
          },
        });

        if (existingKepala) {
          throw new ConflictException('Sudah ada Kepala Keluarga dalam kartu keluarga ini');
        }
      }

      // Buat penduduk baru
      const penduduk = await this.prisma.penduduk.create({
        data: {
          nik: dto.nik,
          nama: dto.nama,
          tempatLahir: dto.tempatLahir,
          tanggalLahir: dto.tanggalLahir,
          jenisKelamin: dto.jenisKelamin,
          agama: dto.agama,
          statusPerkawinan: dto.statusPerkawinan,
          pendidikan: dto.pendidikan,
          pekerjaan: dto.pekerjaan,
          hubunganDalamKeluarga: dto.hubunganDalamKeluarga || 'Anak', // Default value
          kartuKeluargaId: dto.kartuKeluargaId,
          userId: dto.userId,
        },
        include: {
          kartuKeluarga: {
            include: {
              rt: {
                include: {
                  rw: {
                    include: {
                      dukuh: true,
                    },
                  },
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      });

      return {
        message: 'Penduduk berhasil ditambahkan',
        data: penduduk,
      };
    } catch (error) {
      console.error(error);
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal menambahkan penduduk');
    }
  }

  async findAll(queryParams: FindAllQueryParams, user: { userId: number; role: string }): Promise<PaginatedResult<any>> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'id',
        sortOrder = 'asc',
        kepalaKeluargaId,
        rtId,
        rwId,
        dukuhId,
        jenisKelamin,
        agama,
        statusPerkawinan,
      } = queryParams;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        throw new BadRequestException('Parameter pagination tidak valid');
      }

      // Build where clause for search and filter
      const where: any = {};
      let orderBy: any;

      if (search) {
        where.OR = [
          { nik: { contains: search, mode: 'insensitive' } },
          { nama: { contains: search, mode: 'insensitive' } },
          { tempatLahir: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (user.role === 'WARGA') {
        const checkKk = await this.prisma.penduduk.findFirst({
          where: { userId: user.userId },
          select: { kartuKeluargaId: true }
        });

        console.log(user);
        console.log(`[PENDUDUK] KartuKeluargaId : ${checkKk?.kartuKeluargaId}`)
        console.log(`[PENDUDUK] userId: ${user.userId}`);


        if (!checkKk) {
          throw new ForbiddenException('Anda tidak memiliki akses ke data penduduk');
        }

        where.kartuKeluargaId = checkKk?.kartuKeluargaId;
      } else if ((user.role === 'ADMIN' || user.role === 'PENGURUS') && kepalaKeluargaId) {
        where.kepalaKeluargaId = kepalaKeluargaId;
      }

      if (jenisKelamin) {
        where.jenisKelamin = jenisKelamin;
      }

      if (agama) {
        where.agama = agama;
      }

      if (statusPerkawinan) {
        where.statusPerkawinan = statusPerkawinan;
      }

      // Filter by wilayah
      if (rtId || rwId || dukuhId) {
        where.kartuKeluarga = { rt: {} };

        if (rtId) {
          where.kartuKeluarga.rtId = rtId;
        }
        if (rwId) {
          where.kartuKeluarga.rt.rwId = rwId;
        }
        if (dukuhId) {
          where.kartuKeluarga.rt.rw = { dukuhId };
        }
      }

      // Sorting
      if (sortBy === 'noKk') {
        orderBy = {
          kartuKeluarga: {
            noKk: sortOrder,
          },
        };
      } else if (sortBy === 'alamat') {
        orderBy = {
          kartuKeluarga: {
            alamat: sortOrder,
          },
        };
      } else {
        orderBy = {
          [sortBy]: sortOrder,
        };
      }

      // Execute queries in parallel
      const [total, penduduks] = await Promise.all([
        this.prisma.penduduk.count({ where }),
        this.prisma.penduduk.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: orderBy,
          select: {
            id: true,
            nik: true,
            nama: true,
            tempatLahir: true,
            tanggalLahir: true,
            jenisKelamin: true,
            statusPerkawinan: true,
            hubunganDalamKeluarga: true,
            kartuKeluarga: {
              select: {
                id: true,
                noKk: true,
                alamat: true,
                kepalaKeluarga: {
                  select: { id: true, nama: true, nik: true },
                },
                rt: {
                  select: {
                    id: true,
                    nomor: true,
                    rw: {
                      select: {
                        id: true,
                        nomor: true,
                        dukuh: {
                          select: { id: true, nama: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
      ]);

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      return {
        data: penduduks,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error(error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal mengambil data penduduk');
    }
  }

  async findOne(id: number) {
    try {
      const penduduk = await this.prisma.penduduk.findUnique({
        where: { id },
        include: {
          kartuKeluarga: {
            include: {
              kepalaKeluarga: { select: { nama: true, nik: true } },
              rt: {
                include: {
                  rw: {
                    include: {
                      dukuh: true,
                    },
                  },
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
          pengajuanDibuat: {
            include: {
              jenisSurat: true,
            },
          },
        },
      });

      if (!penduduk) {
        throw new NotFoundException('Penduduk tidak ditemukan');
      }

      return {
        message: 'Data penduduk berhasil diambil',
        data: penduduk,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal mengambil data penduduk');
    }
  }

  async findByNIK(nik: string) {
    try {
      const penduduk = await this.prisma.penduduk.findUnique({
        where: { nik },
        include: {
          kartuKeluarga: {
            include: {
              rt: {
                include: {
                  rw: {
                    include: {
                      dukuh: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!penduduk) {
        throw new NotFoundException('Penduduk dengan NIK tersebut tidak ditemukan');
      }

      return {
        message: 'Data penduduk berhasil diambil',
        data: penduduk,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal mengambil data penduduk');
    }
  }

  async update(id: number, dto: UpdatePendudukDto) {
    try {
      // Check if penduduk exists
      const existingPenduduk = await this.prisma.penduduk.findUnique({
        where: { id },
      });

      if (!existingPenduduk) {
        throw new NotFoundException('Penduduk tidak ditemukan');
      }

      // Check if new NIK is already taken
      if (dto.nik && dto.nik !== existingPenduduk.nik) {
        const nikExists = await this.prisma.penduduk.findUnique({
          where: { nik: dto.nik },
        });

        if (nikExists) {
          throw new ConflictException('NIK sudah digunakan');
        }
      }

      // Check if kepala keluarga exists if being updated
      if (dto.kartuKeluargaId && dto.kartuKeluargaId !== existingPenduduk.kartuKeluargaId) {
        const kepalaKeluargaExists = await this.prisma.kartuKeluarga.findUnique({
          where: { id: dto.kartuKeluargaId },
        });

        if (!kepalaKeluargaExists) {
          throw new NotFoundException('Kepala keluarga tidak ditemukan');
        }
      }

      // Check if user exists if being updated
      if (dto.userId && dto.userId !== existingPenduduk.userId) {
        const userExists = await this.prisma.user.findUnique({
          where: { id: dto.userId },
        });

        if (!userExists) {
          throw new NotFoundException('User tidak ditemukan');
        }
      }

      // Update penduduk
      const penduduk = await this.prisma.penduduk.update({
        where: { id },
        data: { ...dto },
        include: {
          kartuKeluarga: {
            include: {
              rt: {
                include: {
                  rw: {
                    include: {
                      dukuh: true,
                    },
                  },
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      });

      return {
        message: 'Penduduk berhasil diperbarui',
        data: penduduk,
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Penduduk tidak ditemukan');
      }

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Gagal memperbarui penduduk');
    }
  }

  async remove(id: number) {
    try {
      // Check if penduduk exists
      const penduduk = await this.prisma.penduduk.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              pengajuanDibuat: true,
            },
          },
        },
      });

      if (!penduduk) {
        throw new NotFoundException('Penduduk tidak ditemukan');
      }

      // Check if penduduk has pengajuan surat
      if (penduduk._count.pengajuanDibuat > 0) {
        throw new ConflictException('Tidak dapat menghapus penduduk yang masih memiliki pengajuan surat');
      }

      // If penduduk has user account, disconnect it but don't delete the user
      if (penduduk.userId) {
        await this.prisma.penduduk.update({
          where: { id },
          data: { userId: null },
        });
      }

      // Delete penduduk
      await this.prisma.penduduk.delete({
        where: { id },
      });

      return {
        message: 'Penduduk berhasil dihapus',
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Penduduk tidak ditemukan');
      }

      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException('Gagal menghapus penduduk');
    }
  }

  async getStatistics() {
    try {
      const totalPenduduk = await this.prisma.penduduk.count();

      const byJenisKelamin = await this.prisma.penduduk.groupBy({
        by: ['jenisKelamin'],
        _count: true,
      });

      const byAgama = await this.prisma.penduduk.groupBy({
        by: ['agama'],
        _count: true,
      });

      const byStatusPerkawinan = await this.prisma.penduduk.groupBy({
        by: ['statusPerkawinan'],
        _count: true,
      });

      return {
        message: 'Statistik penduduk berhasil diambil',
        data: {
          total: totalPenduduk,
          byJenisKelamin,
          byAgama,
          byStatusPerkawinan,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Gagal mengambil statistik penduduk');
    }
  }
}