import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RegisterDto, registerSchema, UpdateProfileDto, UpdateUserDto } from './dto/users.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {

  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Roles('ADMIN', 'PENGURUS')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: RegisterDto) {
    const validatedData = registerSchema.safeParse(dto);
    if (!validatedData.success) {
      const formattedErrors = validatedData.error.flatten();
      throw new BadRequestException({
        message: 'Data yang dikirim tidak valid',
        errors: formattedErrors.fieldErrors,
      });
    }
    const data = validatedData.data;
    return this.usersService.create(data);
  }

  @Get()
  @Roles('ADMIN', 'PENGURUS')
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('role') role: 'ADMIN' | 'PENGURUS' | 'WARGA',
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc',
  ) {
    const queryParams = {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      role,
      sortBy,
      sortOrder,
    };

    return this.usersService.findAll(queryParams);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @Request() req,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('Silahkan login terlebih dahulu');
    }
    const userId = req.user.userId;
    return this.usersService.updateProfile(+userId, dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PENGURUS')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const validatedData = registerSchema.safeParse(dto);
    if (!validatedData.success) {
      const formattedErrors = validatedData.error.flatten();
      throw new BadRequestException({
        message: 'Data yang dikirim tidak valid',
        errors: formattedErrors.fieldErrors,
      });
    }
    const data = validatedData.data;
    return this.usersService.updateUser(+id, data);
  }

  @Delete(':id')
  @Roles('ADMIN', 'PENGURUS')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}