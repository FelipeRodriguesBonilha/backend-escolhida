import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/users/__enums__/role.enum';
import { ReturnDailyReportDto } from './__dtos__/returnDailyReport.dto';
import { ReturnMonthlyReportDto } from './__dtos__/returnMonthlyReport.dto';
import { ReportsService } from './reports.service';

@Roles(Role.Admin)
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('today')
    async todaySummary(): Promise<ReturnDailyReportDto> {
        return new ReturnDailyReportDto(await this.reportsService.todaySummary());
    }

    @Get('daily')
    async dailyReport(@Query('date') date: string): Promise<ReturnDailyReportDto> {
        return new ReturnDailyReportDto(await this.reportsService.dailyReport(date));
    }

    @Get('monthly/:year/:month')
    async monthlyReport(
        @Param('year', ParseIntPipe) year: number,
        @Param('month', ParseIntPipe) month: number,
    ): Promise<ReturnMonthlyReportDto> {
        return new ReturnMonthlyReportDto(await this.reportsService.monthlyReport(year, month));
    }

    @Get('charts/:period')
    async salesChartData(@Param('period') period: 'quarter' | 'semester' | 'annual') {
        return await this.reportsService.salesChartData(period);
    }

    @Get('top-products-month')
    async topProductsCurrentMonth(@Query('limit') limit?: string) {
        return await this.reportsService.topProductsCurrentMonth(limit ? parseInt(limit) : 15);
    }
}