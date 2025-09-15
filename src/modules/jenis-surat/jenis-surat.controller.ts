import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, HttpCode, HttpStatus, Query, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { JenisSuratService } from './jenis-surat.service';
import { CreateJenisSuratDto, UpdateJenisSuratDto } from './dto/jenis-surat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jenis-surat')
export class JenisSuratController {
  constructor(private readonly jenisSuratService: JenisSuratService) { }

  @Post()
  @Roles('ADMIN', 'PENGURUS')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /(application\/pdf|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet)$/,
          }),
        ],
      }),
    )
    templateFile: Express.Multer.File,
    @Body() createJenisSuratDto: CreateJenisSuratDto) {
    return this.jenisSuratService.create(createJenisSuratDto, templateFile);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc',) {
    const queryParams = {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      sortBy,
      sortOrder,
    };
    return this.jenisSuratService.findAll(queryParams);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)

  findOne(@Param('id') id: string) {
    return this.jenisSuratService.findOne(+id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PENGURUS')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,

    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /(application\/pdf|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet)$/,
          }),
        ],
        fileIsRequired: false,
      }),
    )
    templateFile: Express.Multer.File | undefined,

    @Body() updateJenisSuratDto: UpdateJenisSuratDto) {
    return this.jenisSuratService.update(+id, updateJenisSuratDto, templateFile);
  }

  @Delete(':id')
  @Roles('ADMIN', 'PENGURUS')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.jenisSuratService.remove(+id);
  }
}
