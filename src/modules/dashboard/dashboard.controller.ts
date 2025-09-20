import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService){}

    @Get()
    @HttpCode(HttpStatus.OK)
    dashboardSummary(){
        return this.dashboardService.getDashboardSummary()
    }

}
