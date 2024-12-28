-- CreateTable
CREATE TABLE "Forecast" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Forecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Data" (
    "id" SERIAL NOT NULL,
    "totalPrecipitation4Months" DOUBLE PRECISION NOT NULL,
    "weeklySums" DOUBLE PRECISION[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "forecast_id" INTEGER NOT NULL,

    CONSTRAINT "Data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Data_forecast_id_idx" ON "Data"("forecast_id");

-- AddForeignKey
ALTER TABLE "Data" ADD CONSTRAINT "Data_forecast_id_fkey" FOREIGN KEY ("forecast_id") REFERENCES "Forecast"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
