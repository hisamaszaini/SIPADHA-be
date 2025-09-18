import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UsePipes,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { PendudukService } from './penduduk.service';
import { CreatePendudukDto, UpdatePendudukDto, createPendudukSchema, updatePendudukSchema } from './dto/penduduk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('penduduk')
export class PendudukController {
  constructor(private readonly pendudukService: PendudukService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePendudukDto) {
    const validatedData = createPendudukSchema.safeParse(dto);
    if (!validatedData.success) {
      const formattedErrors = validatedData.error.flatten();
      throw new BadRequestException({
        message: 'Data yang dikirim tidak valid',
        errors: formattedErrors.fieldErrors,
      });
    }
    const data = validatedData.data;
    return this.pendudukService.create(data);
  }

  @Get('nik/:nik')
  @HttpCode(HttpStatus.OK)
  findByNIK(@Param('nik') nik: string) {
    return this.pendudukService.findByNIK(nik);
  }

  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  getStatistics() {
    return this.pendudukService.getStatistics();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.pendudukService.findOne(+id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @Request() req,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc',
    @Query('kepalaKeluargaId') kepalaKeluargaId: string,
    @Query('rtId') rtId: string,
    @Query('rwId') rwId: string,
    @Query('dukuhId') dukuhId: string,
    @Query('jenisKelamin') jenisKelamin: string,
    @Query('agama') agama: string,
    @Query('statusPerkawinan') statusPerkawinan: string,
  ) {
    const user = req.user;
    const queryParams = {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      sortBy,
      sortOrder,
      kepalaKeluargaId: kepalaKeluargaId ? parseInt(kepalaKeluargaId) : undefined,
      rtId: rtId ? parseInt(rtId) : undefined,
      rwId: rwId ? parseInt(rwId) : undefined,
      dukuhId: dukuhId ? parseInt(dukuhId) : undefined,
      jenisKelamin,
      agama,
      statusPerkawinan,
    };

    return this.pendudukService.findAll(queryParams, user);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() dto: UpdatePendudukDto) {
    const validatedData = updatePendudukSchema.safeParse(dto);
    if (!validatedData.success) {
      const formattedErrors = validatedData.error.flatten();
      throw new BadRequestException({
        message: 'Data yang dikirim tidak valid',
        errors: formattedErrors.fieldErrors,
      });
    }
    const data = validatedData.data;
    return this.pendudukService.update(+id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.pendudukService.remove(+id);
  }
}