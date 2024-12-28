import { Forecast } from './../../node_modules/.pnpm/@prisma+client@5.21.1_prisma@5.21.1/node_modules/.prisma/client/index.d';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { fetchWeatherApi } from 'openmeteo';
import * as dayjs from 'dayjs';
import { PrismaService } from 'src/prisma/prisma.service';

const fixedParams = {
  six_hourly: ['precipitation', 'soil_moisture_10_to_40cm'],
  daily: 'precipitation_sum',
  timezone: 'Asia/Singapore',
};

const url = 'https://seasonal-api.open-meteo.com/v1/seasonal';

// Generate interval parameters starting from the 1st day of the current month
const generateIntervalParams = () => {
  const currentDate = dayjs().startOf('month');
  const intervals = [];

  for (let i = 0; i < 4; i++) {
    const start_date = currentDate.add(i, 'month').format('YYYY-MM-DD');
    const end_date = currentDate.add(i + 1, 'month').format('YYYY-MM-DD');

    intervals.push({
      start_date,
      end_date,
    });
  }

  return intervals;
};

@Injectable()
export class SeasonalService {
  constructor(private readonly prisma: PrismaService) { }

  private readonly geofencingRadiusKm = 2; // Radius for geofencing in kilometers

  // Calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degToRad(lat2 - lat1);
    const dLon = this.degToRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async clearAllRecommendations2() {
    try {
      // Delete all related data from the 'Data' table
      await this.prisma.data.deleteMany({});
  
      // Now delete records from the 'Forecast' table
      const deletedRecords = await this.prisma.forecast.deleteMany({});
      console.log(`${deletedRecords.count} Forecast data have been deleted successfully.`);
    } catch (error) {
      console.error('Error deleting Forecast data:', error);
      throw new HttpException(
        'Failed to clear Forecast data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  

  async fetchWeatherData(latitude: number, longitude: number): Promise<any> {
    const latitudeFloat = parseFloat(latitude.toString());
    const longitudeFloat = parseFloat(longitude.toString());
    const responseDataFromAPI: Record<string, any> = {};
    const responseDataFromDB: Record<string, any> = {};

    // Step 1: Check for existing forecast data within the geofencing radius
    try {
      const allForecasts = await this.prisma.forecast.findMany({
        include: { data: true },
      });

      // Check if any existing forecast falls within the geofencing radius
      for (const forecast of allForecasts) {
        const distance = this.calculateDistance(
          latitudeFloat,
          longitudeFloat,
          forecast.latitude,
          forecast.longitude
        );

        if (distance <= this.geofencingRadiusKm) {
          // Return existing data if within the radius
          forecast.data.forEach((data, index) => {
            const { totalPrecipitation4Months, weeklySums, startDate, endDate } = data;

            responseDataFromDB[`response_params_${index + 1}`] = {
              totalPrecipitation4Months,
              weeklySums,
              startDate: dayjs(startDate).format('YYYY-MM-DD'),
              end_date: dayjs(endDate).format('YYYY-MM-DD'),
            };
          });

          console.log("Returning existing data from DB");
          return responseDataFromDB;
        }
      }
    } catch (error) {
      console.error('Error checking existing Forecast in Prisma:', error);
      throw new HttpException(
        'Failed to check existing forecast data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Step 2: Fetch new data from OpenMeteo API (no data found within radius)
    const intervalParams = generateIntervalParams();

    for (let i = 0; i < intervalParams.length; i++) {
      const params = {
        ...fixedParams,
        latitude,
        longitude,
        start_date: intervalParams[i].start_date,
        end_date: intervalParams[i].end_date,
      };

      try {
        const responses = await fetchWeatherApi(url, params);
        const response = responses[0];
        const daily = response.daily()!;
        const dailyPrecipitation = daily.variables(0)!.valuesArray()!;
        const totalPrecipitation4Months = dailyPrecipitation.reduce((sum, value) => sum + value, 0);

        const weeklySums = [];
        const startDate = dayjs(intervalParams[i].start_date);
        const endDate = dayjs(intervalParams[i].end_date);
        let currentWeekStart = startDate;

        while (currentWeekStart.isBefore(endDate)) {
          const currentWeekEnd = currentWeekStart.add(6, 'day').isBefore(endDate)
            ? currentWeekStart.add(6, 'day')
            : endDate;

          const daysInThisWeek = dailyPrecipitation.slice(
            currentWeekStart.diff(startDate, 'day'),
            currentWeekEnd.diff(startDate, 'day') + 1
          );

          const weeklySum = daysInThisWeek.reduce((sum, value) => sum + value, 0);
          weeklySums.push(weeklySum);
          currentWeekStart = currentWeekEnd.add(1, 'day');
        }

        responseDataFromAPI[`response_params_${i + 1}`] = {
          totalPrecipitation4Months,
          weeklySums,
          startDate: intervalParams[i].start_date,
          end_date: intervalParams[i].end_date,
        };

      } catch (error) {
        throw new HttpException(
          `Failed to fetch weather data for params ${i + 1}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    // Step 3: Store the new forecast in the database with latitude and longitude
    try {
      const newForecast = await this.prisma.forecast.create({
        data: { latitude: latitudeFloat, longitude: longitudeFloat },
      });

      for (let key in responseDataFromAPI) {
        const params = responseDataFromAPI[key];
        await this.prisma.data.create({
          data: {
            totalPrecipitation4Months: params.totalPrecipitation4Months,
            weeklySums: params.weeklySums,
            startDate: new Date(params.startDate),
            endDate: new Date(params.end_date),
            forecast: { connect: { id: newForecast.id } },
          },
        });
      }
    } catch (prismaError) {
      console.error('Error creating Forecast in Prisma:', prismaError);
      throw new HttpException(
        'Failed to create a new forecast record',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    console.log("Returning new data from API");
    return responseDataFromAPI; // Return the structured data object
  }
}