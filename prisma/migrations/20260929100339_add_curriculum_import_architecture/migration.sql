-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('EXTRACTED', 'NEEDS_REVIEW', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropIndex
DROP INDEX "content_standards_code_key";

-- DropIndex
DROP INDEX "learning_indicators_code_key";

-- DropIndex
DROP INDEX "strands_code_key";

-- DropIndex
DROP INDEX "sub_strands_code_key";

-- AlterTable
ALTER TABLE "content_standards" ADD COLUMN     "extraction_status" "ExtractionStatus",
ADD COLUMN     "review_note" TEXT,
ADD COLUMN     "review_status" "ReviewStatus" DEFAULT 'PENDING',
ADD COLUMN     "source_document" TEXT,
ADD COLUMN     "source_page" INTEGER,
ADD COLUMN     "source_pdf_page_index" INTEGER,
ADD COLUMN     "teaching_learning_resources" TEXT[];

-- AlterTable
ALTER TABLE "curriculum_versions" ADD COLUMN     "issuing_authority" TEXT;

-- AlterTable
ALTER TABLE "learning_indicators" ADD COLUMN     "extraction_status" "ExtractionStatus",
ADD COLUMN     "review_note" TEXT,
ADD COLUMN     "review_status" "ReviewStatus" DEFAULT 'PENDING',
ADD COLUMN     "source_document" TEXT,
ADD COLUMN     "source_page" INTEGER,
ADD COLUMN     "source_pdf_page_index" INTEGER;

-- AlterTable
ALTER TABLE "learning_outcomes" ADD COLUMN     "code" TEXT,
ADD COLUMN     "extraction_status" "ExtractionStatus",
ADD COLUMN     "review_note" TEXT,
ADD COLUMN     "review_status" "ReviewStatus" DEFAULT 'PENDING',
ADD COLUMN     "source_document" TEXT,
ADD COLUMN     "source_page" INTEGER,
ADD COLUMN     "source_pdf_page_index" INTEGER;

-- AlterTable
ALTER TABLE "strands" ADD COLUMN     "extraction_status" "ExtractionStatus",
ADD COLUMN     "pathway" TEXT,
ADD COLUMN     "review_note" TEXT,
ADD COLUMN     "review_status" "ReviewStatus" DEFAULT 'PENDING',
ADD COLUMN     "source_document" TEXT,
ADD COLUMN     "source_page" INTEGER,
ADD COLUMN     "source_pdf_page_index" INTEGER;

-- AlterTable
ALTER TABLE "sub_strands" ADD COLUMN     "extraction_status" "ExtractionStatus",
ADD COLUMN     "review_note" TEXT,
ADD COLUMN     "review_status" "ReviewStatus" DEFAULT 'PENDING',
ADD COLUMN     "source_document" TEXT,
ADD COLUMN     "source_page" INTEGER,
ADD COLUMN     "source_pdf_page_index" INTEGER,
ADD COLUMN     "teaching_learning_resources" TEXT[];

-- CreateTable
CREATE TABLE "learning_outcome_guidance" (
    "learning_outcome_id" TEXT NOT NULL,
    "twenty_first_century_skills" TEXT,
    "gesi" TEXT,
    "sel" TEXT,
    "national_core_values" TEXT[],

    CONSTRAINT "learning_outcome_guidance_pkey" PRIMARY KEY ("learning_outcome_id")
);

-- CreateTable
CREATE TABLE "learning_indicator_guidance" (
    "learning_indicator_id" TEXT NOT NULL,
    "pedagogical_exemplars" TEXT[],
    "assessment_code" TEXT,
    "dok_levels" INTEGER[],
    "dok_descriptions" TEXT[],

    CONSTRAINT "learning_indicator_guidance_pkey" PRIMARY KEY ("learning_indicator_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "content_standards_sub_strand_id_code_key" ON "content_standards"("sub_strand_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "learning_indicators_learning_outcome_id_code_key" ON "learning_indicators"("learning_outcome_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "learning_outcomes_content_standard_id_code_key" ON "learning_outcomes"("content_standard_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "strands_subject_id_class_level_id_curriculum_version_id_pat_key" ON "strands"("subject_id", "class_level_id", "curriculum_version_id", "pathway", "code");

-- CreateIndex
CREATE UNIQUE INDEX "sub_strands_strand_id_code_key" ON "sub_strands"("strand_id", "code");

-- AddForeignKey
ALTER TABLE "learning_outcome_guidance" ADD CONSTRAINT "learning_outcome_guidance_learning_outcome_id_fkey" FOREIGN KEY ("learning_outcome_id") REFERENCES "learning_outcomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_indicator_guidance" ADD CONSTRAINT "learning_indicator_guidance_learning_indicator_id_fkey" FOREIGN KEY ("learning_indicator_id") REFERENCES "learning_indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
