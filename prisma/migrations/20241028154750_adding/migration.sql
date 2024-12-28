-- CreateTable
CREATE TABLE "GeofencedRecommendation" (
    "id" SERIAL NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "condition" TEXT NOT NULL,
    "radiusMeters" INTEGER NOT NULL,
    "outputWaktu" JSONB NOT NULL,
    "outputTanaman" JSONB NOT NULL,
    "outputPrakiraan" JSONB NOT NULL,
    "outputRingkasanSatuSiklus" JSONB NOT NULL,
    "outputRingkasanMingguanBulan1" JSONB NOT NULL,
    "outputRingkasanMingguanBulan2" JSONB NOT NULL,
    "outputRingkasanMingguanBulan3" JSONB NOT NULL,
    "outputRingkasanMingguanBulan4" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeofencedRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeofencedRecommendation_latitude_longitude_idx" ON "GeofencedRecommendation"("latitude", "longitude");
