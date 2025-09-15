import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { hash } from '../auth/auth.util';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    try {
      // Check if user already exists
      const exists = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      
      if (exists) {
        throw new ConflictException('Username already registered');
      }

      // Create user
      const user = await this.prisma.user.create({
        data: {
          noHp: dto.noHp,
          email: dto.email,
          username: dto.username,
          password: await hash(dto.password),
          role: dto.role,
        },
      });

      // Remove sensitive fields from response
      const { password, refreshToken, ...userData } = user;
      
      return { 
        message: 'User created successfully', 
        data: userData 
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async update(id: number, dto: UpdateUserDto) {
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({ 
        where: { id } 
      });
      
      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // Check if new username is already taken
      if (dto.username && dto.username !== existingUser.username) {
        const usernameExists = await this.prisma.user.findUnique({
          where: { username: dto.username },
        });
        
        if (usernameExists) {
          throw new ConflictException('Username already taken');
        }
      }

      // Hash password if provided
      if (dto.password) {
        dto.password = await hash(dto.password);
      }

      // Update user
      const user = await this.prisma.user.update({
        where: { id },
        data: { ...dto },
      });

      // Remove sensitive fields from response
      const { password, refreshToken, ...userUpdated } = user;
      
      return { 
        message: 'User updated successfully', 
        data: userUpdated 
      };
    } catch (error) {
      // Check for Prisma error using error code
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      
      if (
        error instanceof NotFoundException || 
        error instanceof ConflictException
      ) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async findAll(queryParams: FindAllQueryParams): Promise<PaginatedResult<SafeUser>> {
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
        throw new BadRequestException('Invalid pagination parameters');
      }

      // Build where clause for search
      const where: any = search
        ? {
            OR: [
              { username: { contains: search, mode: 'insensitive' } },
              { role: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      // Execute queries in parallel
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
            // Exclude password and refreshToken
          },
        }),
      ]);

      // Calculate total pages
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
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findOne(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          // Exclude password and refreshToken
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return { 
        message: 'User retrieved successfully', 
        data: user 
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async remove(id: number) {
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Delete user
      await this.prisma.user.delete({
        where: { id },
      });

      return { 
        message: 'User deleted successfully' 
      };
    } catch (error) {
      // Check for Prisma error using error code
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to delete user');
    }
  }
}