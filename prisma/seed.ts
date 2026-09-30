import { PrismaClient } from "@prisma/client";
import { importCurriculumTree } from "./seed/import-curriculum";
import { importDemoTeacher } from "./seed/import-demo-teacher";
import { importDemoAdmin } from "./seed/import-demo-admin";
import { importCrossCuttingThemes } from "./seed/import-cross-cutting-themes";
import { computingForm1 } from "./seed-data/computing-form1";
import { demoTeacher } from "./seed-data/demo-teacher";
import { demoAdmin } from "./seed-data/demo-admin";
import { crossCuttingThemes } from "./seed-data/cross-cutting-themes";

const prisma = new PrismaClient();

async function main() {
  const result = await importCurriculumTree(prisma, computingForm1);

  console.log(
    `Imported ${result.subject.name} / ${result.classLevel.name} ` +
      `(curriculum version: ${result.curriculumVersion.name})`,
  );
  console.log(
    `  strands: ${result.counts.strands}, sub-strands: ${result.counts.subStrands}, ` +
      `content standards: ${result.counts.contentStandards}, ` +
      `learning outcomes: ${result.counts.learningOutcomes}, ` +
      `learning indicators: ${result.counts.learningIndicators}`,
  );

  const teacherResult = await importDemoTeacher(prisma, demoTeacher);
  console.log(
    `Imported demo teacher ${teacherResult.user.name} <${teacherResult.user.email}> ` +
      `at ${teacherResult.school.name}`,
  );

  const themesResult = await importCrossCuttingThemes(prisma, crossCuttingThemes);
  console.log(`Imported ${themesResult.count} cross-cutting themes`);

  const adminResult = await importDemoAdmin(prisma, demoAdmin);
  console.log(`Imported demo admin ${adminResult.user.name} <${adminResult.user.email}>`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
