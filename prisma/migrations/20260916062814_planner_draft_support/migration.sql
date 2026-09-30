-- AlterTable
ALTER TABLE "lesson_planners" ALTER COLUMN "learning_indicator_id" DROP NOT NULL,
ALTER COLUMN "term" DROP NOT NULL,
ALTER COLUMN "week_number" DROP NOT NULL,
ALTER COLUMN "duration_minutes" DROP NOT NULL,
ALTER COLUMN "class_section" DROP NOT NULL;

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "date" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "learning_tasks" (
    "id" TEXT NOT NULL,
    "planner_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "learning_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learning_tasks_planner_id_idx" ON "learning_tasks"("planner_id");

-- AddForeignKey
ALTER TABLE "learning_tasks" ADD CONSTRAINT "learning_tasks_planner_id_fkey" FOREIGN KEY ("planner_id") REFERENCES "lesson_planners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
