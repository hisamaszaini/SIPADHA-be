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
} from '@nestjs/common';
import { RtService } from './rt.service';
import { CreateRtDto, UpdateRtDto, createRtSchema, updateRtSchema } from './dto/rt.dto';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';

@Controller('rt')
export class RtController {
  constructor(private readonly rtService: RtService) {}

  @Post()
  // @UsePipes(new ZodValidationPipe(createRtSchema))
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

  @Patch(':id')
  // @UsePipes(new ZodValidationPipe(updateRtSchema))
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateRtDto: UpdateRtDto) {
    return this.rtService.update(+id, updateRtDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.rtService.remove(+id);
  }
}