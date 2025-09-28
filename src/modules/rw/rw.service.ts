import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateRwDto, UpdateRwDto } from './dto/rw.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class RwService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateRwDto) {
    try {
      // Check if RW already exists
      const exists = await this.prisma.rw.findFirst({
        where: {
          nomor: dto.nomor,
          dukuhId: dto.dukuhId
        }
      });

      if (exists) {
        throw new ConflictException("RW sudah ada di dukuh tersebut");
      }

      // Check if dukuh exists
      const dukuhExists = await this.prisma.dukuh.findUnique({
        where: { id: dto.dukuhId }
      });

      if (!dukuhExists) {
        throw new NotFoundException("Dukuh tidak ada");
      }

      // Create RW
      const rw = await this.prisma.rw.create({
        data: {
          nomor: dto.nomor,
          dukuhId: dto.dukuhId,
        },
        include: {
          dukuh: {
            select: {
              id: true,
              nama: true
            }
          }
        }
      });

      return {
        message: 'RW berhasil ditambahkan',
        data: rw
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal menambahkan RW');
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
        dukuhId
      } = queryParams;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        throw new BadRequestException('Invalid pagination parameters');
      }

      // Build where clause for search and filter
      const where: any = {};
      let orderBy: any;

      if (search) {
        where.OR = [
          { nomor: { contains: search, mode: 'insensitive' } },
          { dukuh: { nama: { contains: search, mode: 'insensitive' } } },
        ];
      }

      if (dukuhId) {
        where.dukuhId = dukuhId;
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
      const [total, rws] = await Promise.all([
        this.prisma.rw.count({ where }),
        this.prisma.rw.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: orderBy,
          include: {
            dukuh: {
              select: {
                id: true,
                nama: true
              }
            },
            _count: {
              select: {
                rts: true
              }
            }
          },
        }),
      ]);

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      return {
        data: rws,
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
      throw new InternalServerErrorException('Gagal mengambil data RW');
    }
  }

  async findOne(id: number) {
    try {
      const rw = await this.prisma.rw.findUnique({
        where: { id },
        include: {
          dukuh: {
            select: {
              id: true,
              nama: true
            }
          },
          _count: {
            select: {
              rts: true
            }
          }
        }
      });

      if (!rw) {
        throw new NotFoundException('RW tidak ada');
      }

      return {
        message: 'Data RW berhasil diambil',
        data: rw
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal mengambil data RW');
    }
  }

  async update(id: number, dto: UpdateRwDto) {
    try {
      // Check if RW exists
      const existingRw = await this.prisma.rw.findUnique({
        where: { id }
      });

      if (!existingRw) {
        throw new NotFoundException('RW tidak ada');
      }

      // Check if new nomor is already taken in the same dukuh
      if (dto.nomor && dto.nomor !== existingRw.nomor) {
        const rwExists = await this.prisma.rw.findFirst({
          where: {
            nomor: dto.nomor,
            dukuhId: dto.dukuhId || existingRw.dukuhId
          },
        });

        if (rwExists) {
          throw new ConflictException('RW sudah ada di dukuh tersebut');
        }
      }

      // Check if dukuh exists if dukuhId is being updated
      if (dto.dukuhId && dto.dukuhId !== existingRw.dukuhId) {
        const dukuhExists = await this.prisma.dukuh.findUnique({
          where: { id: dto.dukuhId }
        });

        if (!dukuhExists) {
          throw new NotFoundException('Dukuh tidak ada');
        }
      }

      // Update RW
      const rw = await this.prisma.rw.update({
        where: { id },
        data: { ...dto },
        include: {
          dukuh: {
            select: {
              id: true,
              nama: true
            }
          }
        }
      });

      return {
        message: 'RW berhasil diperbarui',
        data: rw
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('RW tidak ada');
      }

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Gagal memperbarui RW');
    }
  }

  async remove(id: number) {
    try {
      // Check if RW exists
      const rw = await this.prisma.rw.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              rts: true
            }
          }
        }
      });

      if (!rw) {
        throw new NotFoundException('RW tidak ditemukan');
      }

      // Check if RW has RTs
      if (rw._count.rts > 0) {
        throw new ConflictException('RW memiliki RT, hapus RT terlebih dahulu');
      }

      // Delete RW
      await this.prisma.rw.delete({
        where: { id },
      });

      return {
        message: 'RW berhasil dihapus',
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('RW tidak ditemukan');
      }

      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException('Gagal menghapus RW');
    }
  }
}