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
import { RwService } from './rw.service';
import { CreateRwDto, UpdateRwDto, createRwSchema, updateRwSchema } from './dto/rw.dto';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rw')
export class RwController {
  constructor(private readonly rwService: RwService) { }

  @Post()
  @Roles('ADMIN', 'PENGURUS')
  // @UsePipes(new ZodValidationPipe(createRwSchema))
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createRwDto: CreateRwDto) {
    return this.rwService.create(createRwDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc',
    @Query('dukuhId') dukuhId: string,
  ) {
    const queryParams = {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      sortBy,
      sortOrder,
      dukuhId: dukuhId ? parseInt(dukuhId) : undefined,
    };

    return this.rwService.findAll(queryParams);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.rwService.findOne(+id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PENGURUS')
  // @UsePipes(new ZodValidationPipe(updateRwSchema))
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateRwDto: UpdateRwDto) {
    return this.rwService.update(+id, updateRwDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'PENGURUS')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.rwService.remove(+id);
  }
}