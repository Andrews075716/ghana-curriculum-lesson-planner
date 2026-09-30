-- CreateTable
CREATE TABLE "learning_outcome_content_standard_links" (
    "id" TEXT NOT NULL,
    "learning_outcome_id" TEXT NOT NULL,
    "content_standard_id" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_outcome_content_standard_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learning_outcome_content_standard_links_learning_outcome_id_idx" ON "learning_outcome_content_standard_links"("learning_outcome_id");

-- CreateIndex
CREATE INDEX "learning_outcome_content_standard_links_content_standard_id_idx" ON "learning_outcome_content_standard_links"("content_standard_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_outcome_content_standard_links_learning_outcome_id_key" ON "learning_outcome_content_standard_links"("learning_outcome_id", "content_standard_id");

-- AddForeignKey
ALTER TABLE "learning_outcome_content_standard_links" ADD CONSTRAINT "learning_outcome_content_standard_links_learning_outcome_i_fkey" FOREIGN KEY ("learning_outcome_id") REFERENCES "learning_outcomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_outcome_content_standard_links" ADD CONSTRAINT "learning_outcome_content_standard_links_content_standard_i_fkey" FOREIGN KEY ("content_standard_id") REFERENCES "content_standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
