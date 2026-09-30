/*
  Warnings:

  - You are about to drop the column `best_moments` on the `reflections` table. All the data in the column will be lost.
  - You are about to drop the column `next_improvement` on the `reflections` table. All the data in the column will be lost.
  - You are about to drop the column `what_did_not_go_well` on the `reflections` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "reflections" DROP COLUMN "best_moments",
DROP COLUMN "next_improvement",
DROP COLUMN "what_did_not_go_well",
ADD COLUMN     "difficulties" TEXT,
ADD COLUMN     "indicators_achieved" TEXT,
ADD COLUMN     "next_lesson_changes" TEXT,
ADD COLUMN     "reteaching_needed" TEXT;
