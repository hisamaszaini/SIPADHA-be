import { Controller, Get, HttpCode, HttpStatus, Request, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService){}

    @Get()
    @HttpCode(HttpStatus.OK)
    dashboardSummary(){
        return this.dashboardService.getDashboardSummary()
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('WARGA')
    @Get('warga')
    @HttpCode(HttpStatus.OK)
    dashboardWargaSummary(
        @Request() req,
    ){
        const userId = req.user.userId;
        return this.dashboardService.getDashboardWarga(userId);
    }

}
