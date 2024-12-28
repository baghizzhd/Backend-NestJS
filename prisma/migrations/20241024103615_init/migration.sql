-- DropIndex
DROP INDEX "Data_forecast_id_idx";

-- DropIndex
DROP INDEX "Forecast_latitude_longitude_key";

-- AlterTable
ALTER TABLE "Forecast" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
