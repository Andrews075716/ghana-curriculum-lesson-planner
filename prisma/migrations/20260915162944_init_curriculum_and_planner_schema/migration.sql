-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TEACHER', 'CURRICULUM_ADMIN');

-- CreateEnum
CREATE TYPE "CurriculumVersionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Term" AS ENUM ('TERM_1', 'TERM_2', 'TERM_3');

-- CreateEnum
CREATE TYPE "PlannerStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "LessonActivityStage" AS ENUM ('STARTER', 'INTRODUCTORY', 'ACTIVITY', 'CLOSURE');

-- CreateEnum
CREATE TYPE "DokLevel" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TEACHER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "district" TEXT,
    "region" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "school_id" TEXT,
    "staff_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_versions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER,
    "status" "CurriculumVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_levels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "class_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strands" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "class_level_id" TEXT NOT NULL,
    "curriculum_version_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_strands" (
    "id" TEXT NOT NULL,
    "strand_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_strands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_standards" (
    "id" TEXT NOT NULL,
    "sub_strand_id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_outcomes" (
    "id" TEXT NOT NULL,
    "content_standard_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_indicators" (
    "id" TEXT NOT NULL,
    "learning_outcome_id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cross_cutting_themes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "cross_cutting_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_planners" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "learning_indicator_id" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "term" "Term" NOT NULL,
    "week_number" INTEGER NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "class_section" TEXT NOT NULL,
    "status" "PlannerStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_planners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_planner_cross_cutting_themes" (
    "planner_id" TEXT NOT NULL,
    "theme_id" TEXT NOT NULL,

    CONSTRAINT "lesson_planner_cross_cutting_themes_pkey" PRIMARY KEY ("planner_id","theme_id")
);

-- CreateTable
CREATE TABLE "essential_questions" (
    "id" TEXT NOT NULL,
    "planner_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "essential_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedagogical_strategies" (
    "id" TEXT NOT NULL,
    "planner_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "pedagogical_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teaching_learning_resources" (
    "id" TEXT NOT NULL,
    "planner_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "teaching_learning_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "differentiation_notes" (
    "id" TEXT NOT NULL,
    "planner_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "differentiation_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedagogical_exemplars" (
    "id" TEXT NOT NULL,
    "planner_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "pedagogical_exemplars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keywords" (
    "id" TEXT NOT NULL,
    "planner_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "planner_id" TEXT NOT NULL,
    "lesson_id" TEXT,
    "dok_level" "DokLevel" NOT NULL,
    "description" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "planner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_activities" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "stage" "LessonActivityStage" NOT NULL,
    "label" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "teacher_activity" TEXT NOT NULL,
    "learner_activity" TEXT NOT NULL,

    CONSTRAINT "lesson_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reflections" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "best_moments" TEXT,
    "what_went_well" TEXT,
    "subgroups_catered" TEXT,
    "what_did_not_go_well" TEXT,
    "next_improvement" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reflections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_user_id_key" ON "teacher_profiles"("user_id");

-- CreateIndex
CREATE INDEX "teacher_profiles_school_id_idx" ON "teacher_profiles"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_versions_name_key" ON "curriculum_versions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "class_levels_name_key" ON "class_levels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "class_levels_sequence_key" ON "class_levels"("sequence");

-- CreateIndex
CREATE INDEX "strands_subject_id_class_level_id_curriculum_version_id_idx" ON "strands"("subject_id", "class_level_id", "curriculum_version_id");

-- CreateIndex
CREATE INDEX "sub_strands_strand_id_idx" ON "sub_strands"("strand_id");

-- CreateIndex
CREATE INDEX "content_standards_sub_strand_id_idx" ON "content_standards"("sub_strand_id");

-- CreateIndex
CREATE INDEX "learning_outcomes_content_standard_id_idx" ON "learning_outcomes"("content_standard_id");

-- CreateIndex
CREATE INDEX "learning_indicators_learning_outcome_id_idx" ON "learning_indicators"("learning_outcome_id");

-- CreateIndex
CREATE UNIQUE INDEX "cross_cutting_themes_name_key" ON "cross_cutting_themes"("name");

-- CreateIndex
CREATE INDEX "lesson_planners_teacher_id_idx" ON "lesson_planners"("teacher_id");

-- CreateIndex
CREATE INDEX "lesson_planners_learning_indicator_id_idx" ON "lesson_planners"("learning_indicator_id");

-- CreateIndex
CREATE INDEX "essential_questions_planner_id_idx" ON "essential_questions"("planner_id");

-- CreateIndex
CREATE INDEX "pedagogical_strategies_planner_id_idx" ON "pedagogical_strategies"("planner_id");

-- CreateIndex
CREATE INDEX "teaching_learning_resources_planner_id_idx" ON "teaching_learning_resources"("planner_id");

-- CreateIndex
CREATE INDEX "differentiation_notes_planner_id_idx" ON "differentiation_notes"("planner_id");

-- CreateIndex
CREATE INDEX "pedagogical_exemplars_planner_id_idx" ON "pedagogical_exemplars"("planner_id");

-- CreateIndex
CREATE INDEX "keywords_planner_id_idx" ON "keywords"("planner_id");

-- CreateIndex
CREATE INDEX "assessments_planner_id_idx" ON "assessments"("planner_id");

-- CreateIndex
CREATE INDEX "assessments_lesson_id_idx" ON "assessments"("lesson_id");

-- CreateIndex
CREATE INDEX "lessons_planner_id_idx" ON "lessons"("planner_id");

-- CreateIndex
CREATE INDEX "lesson_activities_lesson_id_idx" ON "lesson_activities"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "reflections_lesson_id_key" ON "reflections"("lesson_id");

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strands" ADD CONSTRAINT "strands_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strands" ADD CONSTRAINT "strands_class_level_id_fkey" FOREIGN KEY ("class_level_id") REFERENCES "class_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strands" ADD CONSTRAINT "strands_curriculum_version_id_fkey" FOREIGN KEY ("curriculum_version_id") REFERENCES "curriculum_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_strands" ADD CONSTRAINT "sub_strands_strand_id_fkey" FOREIGN KEY ("strand_id") REFERENCES "strands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_standards" ADD CONSTRAINT "content_standards_sub_strand_id_fkey" FOREIGN KEY ("sub_strand_id") REFERENCES "sub_strands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_outcomes" ADD CONSTRAINT "learning_outcomes_content_standard_id_fkey" FOREIGN KEY ("content_standard_id") REFERENCES "content_standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_indicators" ADD CONSTRAINT "learning_indicators_learning_outcome_id_fkey" FOREIGN KEY ("learning_outcome_id") REFERENCES "learning_outcomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_planners" ADD CONSTRAINT "lesson_planners_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_planners" ADD CONSTRAINT "lesson_planners_learning_indicator_id_fkey" FOREIGN KEY ("learning_indicator_id") REFERENCES "learning_indicators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_planner_cross_cutting_themes" ADD CONSTRAINT "lesson_planner_cross_cutting_themes_planner_id_fkey" FOREIGN KEY ("planner_id") REFERENCES "lesson_planners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_planner_cross_cutting_themes" ADD CONSTRAINT "lesson_planner_cross_cutting_themes_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "cross_cutting_themes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "essential_questions" ADD CONSTRAINT "essential_questions_planner_id_fkey" FOREIGN KEY ("planner_id") REFERENCES "lesson_planners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedagogical_strategies" ADD CONSTRAINT "pedagogical_strategies_planner_id_fkey" FOREIGN KEY ("planner_id") REFERENCES "lesson_planners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_learning_resources" ADD CONSTRAINT "teaching_learning_resources_planner_id_fkey" FOREIGN KEY ("planner_id") REFERENCES "lesson_planners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "differentiation_notes" ADD CONSTRAINT "differentiation_notes_planner_id_fkey" FOREIGN KEY ("planner_id") REFERENCES "lesson_planners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedagogical_exemplars" ADD CONSTRAINT "pedagogical_exemplars_planner_id_fkey" FOREIGN KEY ("planner_id") REFERENCES "lesson_planners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_planner_id_fkey" FOREIGN KEY ("planner_id") REFERENCES "lesson_planners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_planner_id_fkey" FOREIGN KEY ("planner_id") REFERENCES "lesson_planners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_planner_id_fkey" FOREIGN KEY ("planner_id") REFERENCES "lesson_planners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_activities" ADD CONSTRAINT "lesson_activities_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

