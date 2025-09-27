import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query, UseInterceptors, UploadedFile, BadRequestException, UseGuards } from '@nestjs/common';
import { KartuKeluargaService } from './kartu-keluarga.service';
import { CreateKartuKeluargaWithPendudukDto, CreateKkFromExistingPendudukDto, updateKartuKeluargaWithPendudukDto } from './dto/kartu-keluarga.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kartu-keluarga')
export class KartuKeluargaController {
  constructor(private readonly kartuKeluargaService: KartuKeluargaService) { }

  @Roles('ADMIN', 'PENGURUS')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateKartuKeluargaWithPendudukDto | CreateKkFromExistingPendudukDto) {
    console.log(dto);
    if ('kepalaPendudukId' in dto) {
      return this.kartuKeluargaService.createFromExistingPenduduk(dto);
    } else {
      return this.kartuKeluargaService.create(dto);
    }
  }

  @Get('kk/:noKk')
  @HttpCode(HttpStatus.OK)
  findNoKk(@Param('noKk') noKk: string) {
    console.log(`Kk: ${noKk}`);
    return this.kartuKeluargaService.findKk(noKk);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.kartuKeluargaService.findOne(+id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc',
    @Query('rtId') rtId: string,
    @Query('rwId') rwId: string,
    @Query('dukuhId') dukuhId: string,
  ) {
    const queryParams = {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      sortBy,
      sortOrder,
      rtId: rtId ? parseInt(rtId) : undefined,
      rwId: rwId ? parseInt(rwId) : undefined,
      dukuhId: dukuhId ? parseInt(dukuhId) : undefined,
    };

    return this.kartuKeluargaService.findAll(queryParams);
  }

  @Roles('ADMIN', 'PENGURUS')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: updateKartuKeluargaWithPendudukDto) {
    return this.kartuKeluargaService.updateKartuKeluarga(+id, dto);
  }

  @Roles('ADMIN', 'PENGURUS')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.kartuKeluargaService.remove(+id);
  }

  @Roles('ADMIN', 'PENGURUS')
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @UploadedFile() file: Express.Multer.File,
    @Query('dukuhId') dukuhId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File Excel tidak ditemukan');
    }

    if (!dukuhId) {
      throw new BadRequestException('Parameter dukuhId wajib diisi');
    }

    // Parse Excel
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    // Panggil service import
    const result = await this.kartuKeluargaService.importKartuKeluargaFromExcel(
      data as any[],
      Number(dukuhId),
    );

    return result;
  }
}
