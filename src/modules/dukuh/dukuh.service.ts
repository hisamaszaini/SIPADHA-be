import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateDukuhDto, UpdateDukuhDto } from './dto/dukuh.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class DukuhService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateDukuhDto) {
    console.log(`CREATE Dukuh: ${dto}`);
    try {
      // Check if Dukuh already exists
      const exists = await this.prisma.dukuh.findFirst({
        where: {
          nama: dto.nama
        }
      });

      if (exists) {
        throw new ConflictException("Dukuh dengan nama tersebut sudah ada!");
      }

      // Create Dukuh
      const dukuh = await this.prisma.dukuh.create({
        data: {
          nama: dto.nama,
        },
      });

      return {
        message: 'Dukuh berhasil dibuat',
        data: dukuh
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal membuat dukuh');
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
      } = queryParams;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        throw new BadRequestException('Parameter pagination tidak valid');
      }

      // Build where clause for search
      const where: any = {};

      if (search) {
        where.OR = [
          { nama: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Execute queries in parallel
      const [total, dukuhs] = await Promise.all([
        this.prisma.dukuh.count({ where }),
        this.prisma.dukuh.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            _count: {
              select: {
                rws: true
              }
            }
          },
        }),
      ]);

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      return {
        data: dukuhs,
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
      throw new InternalServerErrorException('Gagal mengambil data dukuh');
    }
  }

  async findOne(id: number) {
    try {
      const dukuh = await this.prisma.dukuh.findUnique({
        where: { id },
        include: {
          rws: {
            include: {
              _count: {
                select: {
                  rts: true
                }
              }
            }
          }
        }
      });

      if (!dukuh) {
        throw new NotFoundException('Dukuh tidak ditemukan');
      }

      return {
        message: 'Data dukuh berhasil diambil',
        data: dukuh
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal mengambil data dukuh');
    }
  }

  async update(id: number, dto: UpdateDukuhDto) {
    console.log(`UPDATE Dukuh ${id} : ${dto}`);

    try {
      // Check if Dukuh exists
      const existingDukuh = await this.prisma.dukuh.findUnique({
        where: { id }
      });

      if (!existingDukuh) {
        throw new NotFoundException('Dukuh tidak ditemukan');
      }

      // Check if new nama is already taken
      if (dto.nama && dto.nama !== existingDukuh.nama) {
        const dukuhExists = await this.prisma.dukuh.findFirst({
          where: {
            nama: dto.nama
          },
        });

        if (dukuhExists) {
          throw new ConflictException('Nama dukuh sudah digunakan');
        }
      }

      // Update Dukuh
      const dukuh = await this.prisma.dukuh.update({
        where: { id },
        data: { ...dto },
      });

      return {
        message: 'Dukuh berhasil diperbarui',
        data: dukuh
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Dukuh tidak ditemukan');
      }

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Gagal memperbarui dukuh');
    }
  }

  async remove(id: number) {
    try {
      // Check if Dukuh exists
      const dukuh = await this.prisma.dukuh.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              rws: true
            }
          }
        }
      });

      if (!dukuh) {
        throw new NotFoundException('Dukuh tidak ditemukan');
      }

      // Check if Dukuh has RWs
      if (dukuh._count.rws > 0) {
        throw new ConflictException('Tidak dapat menghapus dukuh yang masih memiliki RW');
      }

      // Delete Dukuh
      await this.prisma.dukuh.delete({
        where: { id },
      });

      return {
        message: 'Dukuh berhasil dihapus'
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Dukuh tidak ditemukan');
      }

      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException('Gagal menghapus dukuh');
    }
  }
}