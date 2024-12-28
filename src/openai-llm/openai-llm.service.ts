import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from "zod";
import { PrismaService } from 'src/prisma/prisma.service';

const MODEL = 'gpt-4o-mini';
// Define the expected JSON response structure with Zod
const OutputSchema = z.object({
  outputWaktu: z.string(),
  outputTanaman: z.string(),
  outputPrakiraan: z.string(),
  outputRingkasanSatuSiklus: z.string(),
  outputRingkasanMingguanBulan1: z.string(),
  outputRingkasanMingguanBulan2: z.string(),
  outputRingkasanMingguanBulan3: z.string(),
  outputRingkasanMingguanBulan4: z.string()
});

const INSTRUCTIONS = `Selalu jawab dalam format JSON yang valid dan pastikan tidak ada teks lain di luar format JSON dab jelaskan dalam bahasa Indonesia yang baku dan mudah dipahami tanpa menunjukkan jumlah curah hujan. Hasil JSON File harus seperti contoh berikut:
{
  "outputWaktu": "Minggu Ke-n Nama Bulan",
  "outputTanaman”: “Padi/Palawija(Kacang Hijau)”,
  "outputPrakiraan": "Musim hujan dimulai pada akhir Oktober dan sekarang anda berada dalam musim hujan",
  "outputRingkasanSatuSiklus": "Curah hujan selalu meningkat dalam setiap minggunya pada bulan November dan Minggu Pertama adalah minggu dengan curah hujan tertinggi",
  "outputRingkasanMingguanBulan1": "ringkasan prakiraan data curah hujan (weeklySums) pada bulan n(nama bulan) dalam 30 kata",
  "outputRingkasanMingguanBulan2": "ringkasan prakiraan data curah hujan (weeklySums) pada bulan n+1(nama bulan) dalam 30 kata",
  "outputRingkasanMingguanBulan3": "ringkasan prakiraan data curah hujan (weeklySums) pada bulan n+2(nama bulan) dalam 30 kata",
  "outputRingkasanMingguanBulan4": "ringkasan prakiraan data curah hujan (weeklySums) pada bulan n+3(nama bulan) dalam 30 kata"
}`;



@Injectable()
export class OpenaiLlmService {
  constructor(
    private readonly openai: OpenAI,
    private readonly prisma: PrismaService,
  ) {}

  private readonly geofencingRadiusKm = 2; // Radius for geofencing in kilometers

  // Calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of Earth in km
    const dLat = this.degToRad(lat2 - lat1);
    const dLon = this.degToRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(lat1)) *
        Math.cos(this.degToRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  
  private degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
  
  async clearAllRecommendations() {
    try {
      const deletedRecords = await this.prisma.geofencedRecommendation.deleteMany({});
      console.log(`${deletedRecords.count} GeofencedRecommendations have been deleted successfully.`);
    } catch (error) {
      console.error('Error deleting GeofencedRecommendations:', error);
      throw new HttpException(
        'Failed to clear GeofencedRecommendations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  async getRecommendation(latitude: number, longitude: number, condition:string ,message: string) {
    const latitudeFloat = parseFloat(latitude.toString());
    const longitudeFloat = parseFloat(longitude.toString());
    const soilCondition = condition.toString();

    // Step 1: Check for existing LLM data within the geofencing radius
    try {
      const allRecommendations = await this.prisma.geofencedRecommendation.findMany();

      for (const recommendation of allRecommendations) {
        const distance = this.calculateDistance(
          latitudeFloat,
          longitudeFloat,
          recommendation.latitude,
          recommendation.longitude,
        );

        if (distance <= this.geofencingRadiusKm && recommendation.condtion === soilCondition) {
          // If within the radius, return existing recommendation
          console.log('Returning stored LLM response from DB');
          return {
            outputWaktu: recommendation.outputWaktu,
            outputTanaman: recommendation.outputTanaman, 
            outputPrakiraan: recommendation.outputPrakiraan,
            outputRingkasanSatuSiklus: recommendation.outputRingkasanSatuSiklus,
            outputRingkasanMingguanBulan1: recommendation.outputRingkasanMingguanBulan1,
            outputRingkasanMingguanBulan2: recommendation.outputRingkasanMingguanBulan2,
            outputRingkasanMingguanBulan3: recommendation.outputRingkasanMingguanBulan3,
            outputRingkasanMingguanBulan4: recommendation.outputRingkasanMingguanBulan4
          };
        }
      }
    } catch (error) {
      console.error('Error checking existing LLM data in Prisma:', error);
      throw new HttpException(
        'Failed to check existing LLM data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Step 2: Fetch new LLM response from OpenAI if no nearby data is found
    try {
      const chatCompletion = await this.openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: INSTRUCTIONS},
          { role: 'user', content: message },
        ],
      });

      const content = chatCompletion.choices[0].message.content;
      
      console.log("isi return contect: ", content);

      // Parse and validate the JSON response
      let jsonResponse;
      try {
        jsonResponse = OutputSchema.parse(JSON.parse(content));
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        console.error('Original content:', content);
        throw new HttpException(
          'Failed to parse OpenAI response as JSON',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Step 3: Store the new LLM response in the database
      try {
        await this.prisma.geofencedRecommendation.create({
          data: {
            latitude: latitudeFloat,
            longitude: longitudeFloat,
            condtion: soilCondition,
            outputWaktu: jsonResponse.outputWaktu,
            outputTanaman: jsonResponse.outputTanaman,
            outputPrakiraan: jsonResponse.outputPrakiraan,
            radiusMeters: this.geofencingRadiusKm * 2,
            outputRingkasanSatuSiklus: jsonResponse.outputRingkasanSatuSiklus, // Add appropriate data
            outputRingkasanMingguanBulan1: jsonResponse.outputRingkasanMingguanBulan1, // Add appropriate data
            outputRingkasanMingguanBulan2: jsonResponse.outputRingkasanMingguanBulan2, // Add appropriate data
            outputRingkasanMingguanBulan3: jsonResponse.outputRingkasanMingguanBulan3, // Add appropriate data
            outputRingkasanMingguanBulan4: jsonResponse.outputRingkasanMingguanBulan4, // Add appropriate data
          },
        });
      } catch (prismaError) {
        console.error('Error storing LLM recommendation in DB:', prismaError);
        throw new HttpException(
          'Failed to store LLM recommendation in database',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      console.log('Returning new LLM response from OpenAI');

      return jsonResponse;
    } catch (error) {
      console.error('Error fetching response from OpenAI:', error);
      throw new HttpException(
        'Failed to retrieve response from OpenAI',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
