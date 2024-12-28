import { Controller, Get, Query, Delete, HttpException, HttpStatus } from '@nestjs/common'; 
import { OpenaiLlmService } from './openai-llm.service';
import { SeasonalService } from 'src/seasonal/seasonal.service';

@Controller('openai-llm')
export class OpenaiLlmController {
    constructor(
        private readonly openaiLlmService: OpenaiLlmService,
        private readonly seasonalService: SeasonalService
    ) {}

    @Get()
    async getAllFromText(
        @Query('latitude') latitude: string,
        @Query('longitude') longitude: string,
        @Query('conditon') condition: string
    ) {
        try {
            // Memastikan latitude dan longitude diterima sebagai angka
            const lat = parseFloat(latitude);
            const lon = parseFloat(longitude);
            const con = String(condition);
            

            // Validasi jika latitude dan longitude tidak valid
            if (isNaN(lat) || isNaN(lon)) {
                throw new Error('Latitude dan Longitude harus berupa angka.');
            }

            // Memanggil API cuaca dari service dengan latitude dan longitude yang dinamis
            const forecastFromService = await this.seasonalService.fetchWeatherData(lat, lon);
            const json_file = forecastFromService; // Ambil data JSON dari respons

            // Membuat prompt untuk OpenAI dengan memasukkan data JSON
            const message = `Berdasarkan data JSON di bawah ini, berikan rekomendasi aksi dan ringkasan prakiraan musim hujan:
            Data JSON: ${JSON.stringify(json_file)}
            
            Jawablah setiap poin berikut dengan logika dan data yang disediakan dan gunakan 'startDate' sebagai nama bulan:
            
            1. "outputWaktu": Rekomendasi waktu tanam yang optimal bagi petani sawah tadah hujan, berupa bulan dan minggu spesifik untuk memulai tanaman padi atau palawija(kacang hijau) dengan mempertimbangkan kondisi berikut:
            Kondisi optimal tanah untuk penanaman adalah tanah gembur. Berikut logika yang harus diikuti:
            - Jika tanah kering, rekomendasikan waktu tanam ketika curah hujan mingguan mencapai minimal 150 mm untuk menjadikan tanah gembur.
            - Jika tanah basah, rekomendasikan waktu tanam ketika curah hujan mingguan mencapai minimal 50 mm  mulai menurun dan tanah menjadi gembur.
            - Jika tanah sudah gembur, waktu tanam dapat dimulai segera.

            2. “outputTanaman” : Memberikan rekomendasi tanaman yang cocok ditanam antara padi dan palawija(kacang hijau). Pilihlah salah satu tanaman yang cocok ditanam untuk siklus ini dengan memperhatikan kebutuhan air berikut :
            - Jika rata-rata curah hujan per bulan selama 2 bulan pertama (berdasarkan 'totalPrecipitation4Months') berada dalam rentang 150-300mm, rekomendasikan 'padi'.
            - Jika rata-rata curah hujan per bulan selama 2 bulan pertama berada dalam rentang 50-100mm, rekomendasikan 'palawija (kacang hijau)'.
            - Jika data curah hujan berada di bawah 40mm, tuliskan '-'.

            3. "outputPrakiraan": jelaskan kepada petan kapan musim hujan dimulai dan kondisi sekarang berada dalam musim hujan atau tidak.
            
            4. "outputRingkasanSatuSiklus": Ringkasan kecenderungan curah hujan untuk 4 bulan, termasuk nama bulan dengan curah hujan tinggi atau rendah.
            
            5. "outputRingkasanMingguanBulan1": Ringkasan curah hujan mingguan pada bulan pertama (nama bulan) dalam 30 kata, termasuk tren mingguan, minggu dengan curah hujan tertinggi, dan variasi curah hujan.
            
            6. "outputRingkasanMingguanBulan2": Sama seperti poin 5 untuk bulan kedua (nama bulan).
            
            7. "outputRingkasanMingguanBulan3": Sama seperti poin 5 untuk bulan ketiga (nama bulan).
            
            8. "outputRingkasanMingguanBulan4": Sama seperti poin 5 untuk bulan keempat (nama bulan).
            `;

            console.log("Hasil JSON: ",json_file);
            
            // Panggil OpenAI dengan prompt
            const response = await this.openaiLlmService.getRecommendation(lat, lon, con, message);

            return response;
        } catch (error) {
            // Tangani error saat memanggil API cuaca atau OpenAI
            console.error('Error fetching forecast or calling OpenAI:', error);
            throw error;
        }
    }

    @Delete('clear')
    async clearRecommendations() {
        try {
            await this.openaiLlmService.clearAllRecommendations();
            return { message: 'All GeofencedRecommendations cleared successfully' };
        } catch (error) {
            console.error('Error clearing recommendations:', error);
            throw new HttpException(
                'Failed to clear GeofencedRecommendations',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}