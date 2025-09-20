import { BadRequestException, Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { settingDto, settingSchema } from './dto/setting.dto';
import { SettingService } from './setting.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('setting')
export class SettingController {

    constructor(private readonly settingService: SettingService) { }

    @Get()
    async find() {
        return this.settingService.find();
    }

    @Put()
    async update(
        @Body() dto: settingDto,
    ) {
        const validatedData = settingSchema.safeParse(dto);
        if (!validatedData.success) {
            const formattedErrors = validatedData.error.flatten();
            throw new BadRequestException({
                message: 'Data yang dikirim tidak valid',
                errors: formattedErrors.fieldErrors,
            });
        }
        const data = validatedData.data;
        return this.settingService.update(data);
    }
}
