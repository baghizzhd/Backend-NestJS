import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { fetchWeatherApi } from 'openmeteo';
import * as dayjs from 'dayjs';

const fixedParams = {
  daily: ["precipitation_sum", "precipitation_probability_max", "et0_fao_evapotranspiration"],
  timezone: 'Asia/Singapore',
  forecast_days: 16
};

const url = 'https://api.open-meteo.com/v1/forecast';

@Injectable()
export class DailyService {
  async fetchDailyWeatherData(latitude: number, longitude: number): Promise<any> {
    const params = {
      ...fixedParams,
      latitude,
      longitude,
    };

    try {
      // Fetch weather data from the OpenMeteo API
      const responses = await fetchWeatherApi(url, params);
      const response = responses[0];

      const utcOffsetSeconds = response.utcOffsetSeconds();
      const daily = response.daily();

      // Generate the dates using the range function
      const range = (start: number, stop: number, step: number) =>
        Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

      // Use the range function to generate an array of dates
      const dates = range(Number(daily.time()), Number(daily.timeEnd()), daily.interval()).map(
        (t) => dayjs((t + utcOffsetSeconds) * 1000).format('YYYY-MM-DD')
      );

      const precipitationSum = daily.variables(0)!.valuesArray()!;
      const precipitationProbabilityMax = daily.variables(1)!.valuesArray()!;
      const et0FaoEvapotranspiration = daily.variables(2)!.valuesArray()!;

      // Create the JSON structure for each date and its associated weather data
      const formattedData = dates.map((date, index) => ({
        [date]: {
          precipitation_sum: precipitationSum[index],
          precipitation_probability_max: precipitationProbabilityMax[index],
          et0_fao_evapotranspiration: et0FaoEvapotranspiration[index],
        },
      }));

      return formattedData; // This will return the structured JSON data

    } catch (error) {
      throw new HttpException(
        'Failed to fetch weather data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
