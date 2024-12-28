-- DropForeignKey
ALTER TABLE "Data" DROP CONSTRAINT "Data_forecast_id_fkey";

-- AddForeignKey
ALTER TABLE "Data" ADD CONSTRAINT "Data_forecast_id_fkey" FOREIGN KEY ("forecast_id") REFERENCES "Forecast"("id") ON DELETE CASCADE ON UPDATE CASCADE;
