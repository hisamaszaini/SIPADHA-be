import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RegisterDto, UpdateProfileDto, UpdateUserDto } from './dto/users.dto';
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
    return this.usersService.create(dto);
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

  @Patch('profile/:id')
  @HttpCode(HttpStatus.OK)
  updateProfile(
    @Param('id') id: string, @Body() dto: UpdateProfileDto,
    @Request() req,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('Silahkan login terlebih dahulu');
    }
    const userId = req.user.userId;
    return this.usersService.updateProfile(+id, dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PENGURUS')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(+id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'PENGURUS')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}