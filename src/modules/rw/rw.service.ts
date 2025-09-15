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
        throw new ConflictException("RW already exists in this dukuh!");
      }

      // Check if dukuh exists
      const dukuhExists = await this.prisma.dukuh.findUnique({
        where: { id: dto.dukuhId }
      });

      if (!dukuhExists) {
        throw new NotFoundException("Dukuh not found!");
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
        message: 'RW created successfully',
        data: rw
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create RW');
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
      throw new InternalServerErrorException('Failed to fetch RWs');
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
          rts: {
            select: {
              id: true,
              nomor: true
            }
          }
        }
      });

      if (!rw) {
        throw new NotFoundException('RW not found');
      }

      return {
        message: 'RW retrieved successfully',
        data: rw
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch RW');
    }
  }

  async update(id: number, dto: UpdateRwDto) {
    try {
      // Check if RW exists
      const existingRw = await this.prisma.rw.findUnique({
        where: { id }
      });

      if (!existingRw) {
        throw new NotFoundException('RW not found');
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
          throw new ConflictException('RW number already exists in this dukuh');
        }
      }

      // Check if dukuh exists if dukuhId is being updated
      if (dto.dukuhId && dto.dukuhId !== existingRw.dukuhId) {
        const dukuhExists = await this.prisma.dukuh.findUnique({
          where: { id: dto.dukuhId }
        });

        if (!dukuhExists) {
          throw new NotFoundException('Dukuh not found');
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
        message: 'RW updated successfully',
        data: rw
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('RW not found');
      }

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update RW');
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
        throw new NotFoundException('RW not found');
      }

      // Check if RW has RTs
      if (rw._count.rts > 0) {
        throw new ConflictException('Cannot delete RW that has RTs');
      }

      // Delete RW
      await this.prisma.rw.delete({
        where: { id },
      });

      return {
        message: 'RW deleted successfully'
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('RW not found');
      }

      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to delete RW');
    }
  }
}