import { notFound } from "next/navigation";
import { getCurrentTeacherId } from "@/server/auth/session";
import { getClassLevels, getStrands, getSubjects } from "@/server/services/curriculum.service";
import { NotFoundError } from "@/server/errors/app-error";
import { CurriculumTreeBrowser } from "@/components/curriculum/CurriculumTreeBrowser";

export const dynamic = "force-dynamic";

export default async function CurriculumSubjectFormPage({
  params,
}: {
  params: Promise<{ subjectId: string; formId: string }>;
}) {
  const { subjectId, formId } = await params;
  const teacherId = await getCurrentTeacherId();

  if (!teacherId) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Your account doesn&apos;t have a teacher profile, so there&apos;s nothing to browse yet.
        Contact an administrator if you believe this is a mistake.
      </div>
    );
  }

  let strands;
  let classLevels;
  try {
    [strands, classLevels] = await Promise.all([
      getStrands(subjectId, formId),
      getClassLevels(subjectId),
    ]);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const subjects = await getSubjects();
  const subjectLabel = subjects.find((s) => s.id === subjectId)?.label ?? "Subject";
  const classLevelLabel = classLevels.find((c) => c.id === formId)?.label ?? "Class / Form";

  return (
    <CurriculumTreeBrowser
      subjectId={subjectId}
      classLevelId={formId}
      subjectLabel={subjectLabel}
      classLevelLabel={classLevelLabel}
      strands={strands}
    />
  );
}
