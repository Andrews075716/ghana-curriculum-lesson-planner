import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentTeacherId } from "@/server/auth/session";
import { getLessonDetailForTeacher } from "@/server/services/lesson.service";
import { NotFoundError } from "@/server/errors/app-error";
import { ReflectionForm } from "@/components/planner/reflection/ReflectionForm";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ plannerId: string; lessonId: string }>;
}) {
  const { plannerId, lessonId } = await params;
  const teacherId = await getCurrentTeacherId();

  if (!teacherId) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Your account doesn&apos;t have a teacher profile, so there&apos;s nothing to reflect on
        yet. Contact an administrator if you believe this is a mistake.
      </div>
    );
  }

  let lesson;
  try {
    lesson = await getLessonDetailForTeacher(plannerId, lessonId, teacherId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href={`/planners/${plannerId}/print`} />}
          nativeButton={false}
        >
          <ArrowLeft className="size-4" />
          Back to Planner
        </Button>
        <h1 className="mt-2 text-xl font-semibold text-foreground">
          Post-Lesson Reflection — Lesson {lesson.sequence}
        </h1>
        <p className="text-sm text-muted-foreground">
          {[lesson.subject, lesson.classSection, lesson.weekNumber ? `Week ${lesson.weekNumber}` : null]
            .filter(Boolean)
            .join(" · ") || "No curriculum details yet."}
          {lesson.date ? ` · ${lesson.date}` : ""}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <ReflectionForm
          plannerId={plannerId}
          lessonId={lessonId}
          learningIndicator={lesson.learningIndicator}
          initialReflection={lesson.reflection}
        />
      </div>
    </div>
  );
}
