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
} from '@nestjs/common';
import { DukuhService } from './dukuh.service';
import { CreateDukuhDto, UpdateDukuhDto, createDukuhSchema, updateDukuhSchema } from './dto/dukuh.dto';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dukuh')
export class DukuhController {
  constructor(private readonly dukuhService: DukuhService) { }

  @Post()
  @Roles('ADMIN', 'PENGURUS')
  // @UsePipes(new ZodValidationPipe(createDukuhSchema))
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDukuhDto: CreateDukuhDto) {
    return this.dukuhService.create(createDukuhDto);
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
  // @UsePipes(new ZodValidationPipe(updateDukuhSchema))
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateDukuhDto: UpdateDukuhDto) {
    console.log('UPDATE Dukuh', id, updateDukuhDto);
    return this.dukuhService.update(+id, updateDukuhDto);
  }


  @Delete(':id')
  @Roles('ADMIN', 'PENGURUS')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.dukuhService.remove(+id);
  }
}