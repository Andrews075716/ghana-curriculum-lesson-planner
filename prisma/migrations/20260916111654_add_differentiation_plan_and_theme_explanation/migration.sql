/*
  Warnings:

  - You are about to drop the `differentiation_notes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "differentiation_notes" DROP CONSTRAINT "differentiation_notes_planner_id_fkey";

-- AlterTable
ALTER TABLE "lesson_planner_cross_cutting_themes" ADD COLUMN     "explanation" TEXT;

-- DropTable
DROP TABLE "differentiation_notes";

-- CreateTable
CREATE TABLE "differentiation_plans" (
    "planner_id" TEXT NOT NULL,
    "mixed_ability_grouping" TEXT,
    "scaffold_support" TEXT,
    "extension_challenge" TEXT,
    "resource_adaptation" TEXT,
    "learning_task_differentiation" TEXT,
    "teacher_peer_support" TEXT,
    "additional_notes" TEXT,

    CONSTRAINT "differentiation_plans_pkey" PRIMARY KEY ("planner_id")
);

-- AddForeignKey
ALTER TABLE "differentiation_plans" ADD CONSTRAINT "differentiation_plans_planner_id_fkey" FOREIGN KEY ("planner_id") REFERENCES "lesson_planners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
