import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Request, UseGuards, Query, BadRequestException, UsePipes } from '@nestjs/common';
import { PengajuanSuratService } from './pengajuan-surat.service';
import { fullCreatePengajuanSuratDto, fullCreatePengajuanSuratSchema, UpdatePengajuanSuratDto } from './dto/pengajuan-surat.dto';
import { User } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ZodValidationPipe } from 'nestjs-zod';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pengajuan-surat')
export class PengajuanSuratController {
  constructor(private readonly pengajuanSuratService: PengajuanSuratService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  // @UsePipes(new ZodValidationPipe(fullCreatePengajuanSuratSchema))
  create(
    @Request() req,
    @Body() data: fullCreatePengajuanSuratDto,
  ) {
    const validatedData = fullCreatePengajuanSuratSchema.safeParse(data);
    if (!validatedData.success) {
      const formattedErrors = validatedData.error.flatten();
      throw new BadRequestException({
        message: 'Data yang dikirim tidak valid',
        errors: formattedErrors.fieldErrors,
      });
    }

    const user = req.user;
    return this.pengajuanSuratService.create(user, validatedData.data);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(
    @Request() req,
    @Param('id') id: string
  ) {
    const user = req.user;
    return this.pengajuanSuratService.findOne(+id, user);
  }


  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @Request() req,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc'
  ) {
    const user = req.user;
    const queryParams = {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      sortBy,
      sortOrder
    };
    return this.pengajuanSuratService.findAll(user, queryParams);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  // @UsePipes(new ZodValidationPipe(fullCreatePengajuanSuratSchema))
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() data: UpdatePengajuanSuratDto,
  ) {
    const validatedData = fullCreatePengajuanSuratSchema.safeParse(data);
    if (!validatedData.success) {
      const formattedErrors = validatedData.error.flatten();
      throw new BadRequestException({
        message: 'Data yang dikirim tidak valid',
        errors: formattedErrors.fieldErrors,
      });
    }
    const user = req.user;
    return this.pengajuanSuratService.update(+id, user, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Request() req,
    @Param('id') id: string
  ) {
    const user = req.user;
    return this.pengajuanSuratService.remove(+id, user);
  }
}
