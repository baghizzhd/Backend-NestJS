import { Controller, Get, Query } from '@nestjs/common';
import { DailyService } from './daily.service';

@Controller('daily')
export class DailyController {
  constructor(private readonly dailyService: DailyService) {}

  @Get('forecast')
  async getDailyWeatherForecast(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
  ) {
    return this.dailyService.fetchDailyWeatherData(latitude, longitude);
  }
}
