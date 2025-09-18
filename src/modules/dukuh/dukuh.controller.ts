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
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { DukuhService } from './dukuh.service';
import { CreateDukuhDto, UpdateDukuhDto, createDukuhSchema, updateDukuhSchema } from './dto/dukuh.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dukuh')
export class DukuhController {
  constructor(private readonly dukuhService: DukuhService) { }

  @Post()
  @Roles('ADMIN', 'PENGURUS')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateDukuhDto) {
    const validatedData = createDukuhSchema.safeParse(dto);
    if (!validatedData.success) {
      const formattedErrors = validatedData.error.flatten();
      throw new BadRequestException({
        message: 'Data yang dikirim tidak valid',
        errors: formattedErrors.fieldErrors,
      });
    }
    const data = validatedData.data;
    return this.dukuhService.create(data);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc',
  ) {
    const queryParams = {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      sortBy,
      sortOrder,
    };

    return this.dukuhService.findAll(queryParams);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.dukuhService.findOne(+id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PENGURUS')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDukuhDto) {
    const validatedData = createDukuhSchema.safeParse(dto);
    if (!validatedData.success) {
      const formattedErrors = validatedData.error.flatten();
      throw new BadRequestException({
        message: 'Data yang dikirim tidak valid',
        errors: formattedErrors.fieldErrors,
      });
    }
    const data = validatedData.data;
    return this.dukuhService.update(+id, data);
  }


  @Delete(':id')
  @Roles('ADMIN', 'PENGURUS')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.dukuhService.remove(+id);
  }
}