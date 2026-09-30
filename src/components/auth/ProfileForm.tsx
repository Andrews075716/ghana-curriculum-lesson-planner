"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MultiSelectField } from "./MultiSelectField";
import { useCurriculumOptions } from "@/hooks/useCurriculumOptions";
import type { TeacherProfileDetail } from "@/server/repositories/auth.repository";

export function ProfileForm({ initialProfile }: { initialProfile: TeacherProfileDetail }) {
  const subjects = useCurriculumOptions("/api/curriculum/subjects");
  const classLevels = useCurriculumOptions("/api/curriculum/class-levels/all");

  const [name, setName] = useState(initialProfile.name);
  const [schoolName, setSchoolName] = useState(initialProfile.schoolName ?? "");
  const [region, setRegion] = useState(initialProfile.region ?? "");
  const [staffId, setStaffId] = useState(initialProfile.staffId ?? "");
  const [subjectIds, setSubjectIds] = useState<string[]>(initialProfile.subjectIds);
  const [classLevelIds, setClassLevelIds] = useState<string[]>(initialProfile.classLevelIds);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          schoolName,
          region: region || null,
          staffId: staffId || null,
          subjectIds,
          classLevelIds,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to save your profile.");
      }
      setSaved(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save your profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" value={initialProfile.email} disabled />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-name">Full Name</Label>
        <Input id="profile-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-school">School</Label>
        <Input
          id="profile-school"
          required
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
        />
      </div>

      <MultiSelectField
        label="Subject(s)"
        options={subjects.options}
        value={subjectIds}
        onChange={setSubjectIds}
        loading={subjects.status === "loading"}
      />

      <MultiSelectField
        label="Class(es)"
        options={classLevels.options}
        value={classLevelIds}
        onChange={setClassLevelIds}
        loading={classLevels.status === "loading"}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-region">Region (optional)</Label>
          <Input id="profile-region" value={region} onChange={(e) => setRegion(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-staff-id">Teacher ID (optional)</Label>
          <Input id="profile-staff-id" value={staffId} onChange={(e) => setStaffId(e.target.value)} />
        </div>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      {saved ? (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertDescription>Profile saved.</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={isSaving} className="self-start">
        {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
        Save changes
      </Button>
    </form>
  );
}
