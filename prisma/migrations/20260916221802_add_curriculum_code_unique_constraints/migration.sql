-- AlterTable
CREATE UNIQUE INDEX "strands_code_key" ON "strands"("code");

-- AlterTable
CREATE UNIQUE INDEX "sub_strands_code_key" ON "sub_strands"("code");

-- AlterTable
CREATE UNIQUE INDEX "content_standards_code_key" ON "content_standards"("code");

-- AlterTable
CREATE UNIQUE INDEX "learning_indicators_code_key" ON "learning_indicators"("code");
