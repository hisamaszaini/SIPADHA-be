import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { KartuKeluargaService } from './kartu-keluarga.service';
import { CreateKartuKeluargaWithPendudukDto, CreateKkFromExistingPendudukDto, updateKartuKeluargaWithPendudukDto } from './dto/kartu-keluarga.dto';

@Controller('kartu-keluarga')
export class KartuKeluargaController {
  constructor(private readonly kartuKeluargaService: KartuKeluargaService) { }

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

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: updateKartuKeluargaWithPendudukDto) {
    return this.kartuKeluargaService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.kartuKeluargaService.remove(+id);
  }
}
