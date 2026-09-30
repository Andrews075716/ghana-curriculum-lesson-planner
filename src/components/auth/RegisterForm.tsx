"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MultiSelectField } from "./MultiSelectField";
import { useCurriculumOptions } from "@/hooks/useCurriculumOptions";

export function RegisterForm() {
  const router = useRouter();
  const subjects = useCurriculumOptions("/api/curriculum/subjects");
  const classLevels = useCurriculumOptions("/api/curriculum/class-levels/all");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [region, setRegion] = useState("");
  const [staffId, setStaffId] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [classLevelIds, setClassLevelIds] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setConfirmPasswordError(null);

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          schoolName,
          region: region || undefined,
          staffId: staffId || undefined,
          subjectIds,
          classLevelIds,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to create your account.");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create your account.");
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Register as a teacher to start planning lessons.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="register-name">Full Name</Label>
            <Input id="register-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="register-password">Password</Label>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                At least 8 characters, with a letter, a number, and a symbol.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="register-confirm-password">Confirm Password</Label>
              <Input
                id="register-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPasswordError ? (
                <p className="text-xs text-destructive">{confirmPasswordError}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="register-school">School</Label>
            <Input
              id="register-school"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. Achimota Basic School"
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
              <Label htmlFor="register-region">Region (optional)</Label>
              <Input id="register-region" value={region} onChange={(e) => setRegion(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="register-staff-id">Teacher ID (optional)</Label>
              <Input id="register-staff-id" value={staffId} onChange={(e) => setStaffId(e.target.value)} />
            </div>
          </div>

          {errorMessage ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" disabled={isSubmitting} className="mt-1 justify-center">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Create account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
