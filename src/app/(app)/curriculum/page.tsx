import Link from "next/link";
import { Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeacherCurriculumDocuments } from "@/components/curriculum/TeacherCurriculumDocuments";
import { getCurrentTeacherId } from "@/server/auth/session";
import { getTeacherCurriculumDocuments } from "@/server/services/curriculum.service";

export const dynamic = "force-dynamic";

export default async function CurriculumPage() {
  const teacherId = await getCurrentTeacherId();

  if (!teacherId) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Your account doesn&apos;t have a teacher profile, so there&apos;s nothing to show here.
        Contact an administrator if you believe this is a mistake.
      </div>
    );
  }

  const { classLevelLabels, documents } = await getTeacherCurriculumDocuments(teacherId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Curriculum</h1>
          <p className="text-sm text-muted-foreground">
            Access the official curriculum documents for the subjects you teach.
          </p>
        </div>
        <Button
          variant="outline"
          render={<Link href="/curriculum/browse" />}
          nativeButton={false}
        >
          <Library className="size-4" />
          Browse curriculum structure
        </Button>
      </div>

      <TeacherCurriculumDocuments documents={documents} classLevelLabels={classLevelLabels} />
    </div>
  );
}
