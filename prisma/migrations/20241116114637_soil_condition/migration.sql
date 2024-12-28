/*
  Warnings:

  - You are about to drop the column `condition` on the `GeofencedRecommendation` table. All the data in the column will be lost.
  - Added the required column `condtion` to the `GeofencedRecommendation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GeofencedRecommendation" DROP COLUMN "condition",
ADD COLUMN     "condtion" TEXT NOT NULL;
