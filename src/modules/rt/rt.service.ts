import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateRtDto, UpdateRtDto } from './dto/rt.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class RtService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateRtDto) {
    try {
      // Check if RT already exists in the same RW
      const exists = await this.prisma.rt.findFirst({
        where: {
          nomor: dto.nomor,
          rwId: dto.rwId
        }
      });

      if (exists) {
        throw new ConflictException("RT sudah ada di RW tersebut");
      }

      // Check if RW exists
      const rwExists = await this.prisma.rw.findUnique({
        where: { id: dto.rwId },
        include: { dukuh: true }
      });

      if (!rwExists) {
        throw new NotFoundException("RW tidak ada");
      }

      // Create RT
      const rt = await this.prisma.rt.create({
        data: {
          nomor: dto.nomor,
          rwId: dto.rwId,
        },
        include: {
          rw: {
            include: {
              dukuh: {
                select: {
                  id: true,
                  nama: true
                }
              }
            }
          }
        }
      });

      return {
        message: 'RT berhasil ditambahkan',
        data: rt
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal membuat RT baru');
    }
  }

  async findAll(queryParams: FindAllQueryParams): Promise<PaginatedResult<any>> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'id',
        sortOrder = 'asc',
        rwId,
        dukuhId
      } = queryParams;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        throw new BadRequestException('Parameter tidak valid');
      }

      // Build where clause for search and filter
      const where: any = {};
      let orderBy: any;

      if (search) {
        where.OR = [
          { nomor: { contains: search, mode: 'insensitive' } },
          { rw: { nomorRw: { contains: search, mode: 'insensitive' } } },
          { rw: { dukuh: { nama: { contains: search, mode: 'insensitive' } } } },
        ];
      }

      if (rwId) {
        where.rwId = rwId;
      }

      if (dukuhId) {
        where.rw = { dukuhId };
      }

      if (sortBy === 'dukuh') {
        orderBy = {
          dukuh: {
            nama: sortOrder,
          },
        };
      } else if (sortBy === 'rts') {
        orderBy = {
          rts: {
            _count: sortOrder,
          },
        };
      } else {
        orderBy = {
          [sortBy]: sortOrder,
        };
      }

      // Execute queries in parallel
      const [total, rts] = await Promise.all([
        this.prisma.rt.count({ where }),
        this.prisma.rt.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: orderBy,
          include: {
            rw: {
              include: {
                dukuh: {
                  select: {
                    id: true,
                    nama: true
                  }
                }
              }
            },
            _count: {
              select: {
                KartuKeluarga: true
              }
            }
          },
        }),
      ]);

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      return {
        data: rts,
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
      throw new InternalServerErrorException('Gagal mengambil data RT');
    }
  }

  async findOne(id: number) {
    try {
      const rt = await this.prisma.rt.findUnique({
        where: { id },
        include: {
          rw: {
            include: {
              dukuh: {
                select: {
                  id: true,
                  nama: true
                }
              }
            }
          },
          KartuKeluarga: {
            include: {
              anggotaKeluarga: true
            }
          }
        }
      });

      if (!rt) {
        throw new NotFoundException('RT not found');
      }

      return {
        message: 'Data RT berhasil diambil',
        data: rt
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal mengambil data RT');
    }
  }

  async update(id: number, dto: UpdateRtDto) {
    try {
      // Check if RT exists
      const existingRt = await this.prisma.rt.findUnique({
        where: { id }
      });

      if (!existingRt) {
        throw new NotFoundException('RT tidak ditemukan');
      }

      // Check if new nomor is already taken in the same RW
      if (dto.nomor && dto.nomor !== existingRt.nomor) {
        const rtExists = await this.prisma.rt.findFirst({
          where: {
            nomor: dto.nomor,
            rwId: dto.rwId || existingRt.rwId
          },
        });

        if (rtExists) {
          throw new ConflictException('Nomor RT sudah ada di RW tersebut');
        }
      }

      // Check if RW exists if rwId is being updated
      if (dto.rwId && dto.rwId !== existingRt.rwId) {
        const rwExists = await this.prisma.rw.findUnique({
          where: { id: dto.rwId }
        });

        if (!rwExists) {
          throw new NotFoundException('RW tidak ditemukan');
        }
      }

      // Update RT
      const rt = await this.prisma.rt.update({
        where: { id },
        data: { ...dto },
        include: {
          rw: {
            include: {
              dukuh: {
                select: {
                  id: true,
                  nama: true
                }
              }
            }
          }
        }
      });

      return {
        message: 'RT berhasil diperbarui',
        data: rt
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('RT not found');
      }

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Gagal memperbarui RT');
    }
  }

  async remove(id: number) {
    try {
      // Check if RT exists
      const rt = await this.prisma.rt.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              KartuKeluarga: true
            }
          }
        }
      });

      if (!rt) {
        throw new NotFoundException('RT tidak ada');
      }

      // Check if RT has Kepala Keluarga
      if (rt._count.KartuKeluarga > 0) {
        throw new ConflictException('RT memiliki Kepala Keluarga, hapus Kepala Keluarga terlebih dahulu');
      }

      // Delete RT
      await this.prisma.rt.delete({
        where: { id },
      });

      return {
        message: 'RT berhasil dihapus',
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('RT tidak ada');
      }

      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException('Gagal menghapus RT');
    }
  }
}