"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CurriculumSelectField } from "@/components/curriculum/CurriculumSelectField";
import { useCurriculumOptions } from "@/hooks/useCurriculumOptions";

export function CurriculumBrowserLanding() {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState("");
  const [classLevelId, setClassLevelId] = useState("");

  const subjects = useCurriculumOptions("/api/curriculum/subjects");
  const classLevels = useCurriculumOptions(
    subjectId ? `/api/curriculum/class-levels?subjectId=${subjectId}` : null,
  );

  function handleSubjectChange(id: string) {
    setSubjectId(id);
    setClassLevelId("");
  }

  function handleBrowse() {
    if (subjectId && classLevelId) {
      router.push(`/curriculum/${subjectId}/${classLevelId}`);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Curriculum</h1>
        <p className="text-sm text-muted-foreground">
          Browse the official Ghana curriculum hierarchy by subject and class. This is a
          read-only reference — curriculum records can only be changed by a curriculum
          administrator.
        </p>
      </div>

      <div className="flex max-w-xl flex-col gap-4 rounded-xl border bg-card p-4">
        <CurriculumSelectField
          id="browse-subject"
          label="Subject"
          value={subjectId}
          onValueChange={handleSubjectChange}
          options={subjects.options}
          status={subjects.status}
          errorMessage={subjects.errorMessage}
          onRetry={subjects.refetch}
          emptyMessage="No subjects have been added yet."
        />
        <CurriculumSelectField
          id="browse-class-level"
          label="Class / Form"
          value={classLevelId}
          onValueChange={setClassLevelId}
          options={classLevels.options}
          status={classLevels.status}
          errorMessage={classLevels.errorMessage}
          onRetry={classLevels.refetch}
          disabled={!subjectId}
          disabledMessage="Select a subject first."
          emptyMessage="No class levels for this subject yet."
        />
        <Button onClick={handleBrowse} disabled={!subjectId || !classLevelId}>
          Browse Curriculum
        </Button>
      </div>
    </div>
  );
}
