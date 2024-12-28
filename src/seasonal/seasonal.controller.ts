import { SeasonalService } from 'src/seasonal/seasonal.service';
import { Controller, Get, Query, HttpException, HttpStatus, Delete} from '@nestjs/common';

@Controller('seasonal')
export class SeasonalController {
  constructor(private readonly seasonalService: SeasonalService) {}

  @Get('forecast')
  async getWeatherForecast(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
  ) {
    return this.seasonalService.fetchWeatherData(latitude, longitude);
  }
  @Delete('clear')
  async clearRecommendations2() {
      try {
          await this.seasonalService.clearAllRecommendations2();
          return { message: 'All Forecast data cleared successfully' };
      } catch (error) {
          console.error('Error clearing Forecast data:', error);
          throw new HttpException(
              'Failed to clear Forecast data',
              HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
  }
}
