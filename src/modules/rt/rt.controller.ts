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
  UseGuards,
} from '@nestjs/common';
import { RtService } from './rt.service';
import { CreateRtDto, UpdateRtDto, createRtSchema, updateRtSchema } from './dto/rt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rt')
export class RtController {
  constructor(private readonly rtService: RtService) { }

  @Roles('ADMIN', 'PENGURUS')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createRtDto: CreateRtDto) {
    return this.rtService.create(createRtDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc',
    @Query('rwId') rwId: string,
    @Query('dukuhId') dukuhId: string,
  ) {
    const queryParams = {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      sortBy,
      sortOrder,
      rwId: rwId ? parseInt(rwId) : undefined,
      dukuhId: dukuhId ? parseInt(dukuhId) : undefined,
    };

    return this.rtService.findAll(queryParams);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.rtService.findOne(+id);
  }

  @Roles('ADMIN', 'PENGURUS')
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateRtDto: UpdateRtDto) {
    return this.rtService.update(+id, updateRtDto);
  }

  @Roles('ADMIN', 'PENGURUS')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.rtService.remove(+id);
  }
}