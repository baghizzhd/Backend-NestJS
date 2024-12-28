/*
  Warnings:

  - A unique constraint covering the columns `[latitude,longitude]` on the table `Forecast` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Data_forecast_id_idx" ON "Data"("forecast_id");

-- CreateIndex
CREATE UNIQUE INDEX "Forecast_latitude_longitude_key" ON "Forecast"("latitude", "longitude");
