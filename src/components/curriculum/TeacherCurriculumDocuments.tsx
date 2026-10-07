import Link from "next/link";
import { ExternalLink, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { TeacherCurriculumDocumentView } from "@/server/services/curriculum.service";

export function TeacherCurriculumDocuments({
  documents,
  classLevelLabels,
}: {
  documents: TeacherCurriculumDocumentView[];
  classLevelLabels: string[];
}) {
  if (documents.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        You haven&apos;t set any teaching subjects yet, so there&apos;s nothing to show here.{" "}
        <Link
          href="/settings/profile"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Add your subjects in Profile Settings
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => (
        <Card key={doc.subjectId}>
          <CardHeader>
            <CardTitle>{doc.subjectName}</CardTitle>
            <CardDescription>
              {doc.curriculumVersionName
                ? `${doc.curriculumVersionName}${doc.curriculumVersionYear ? ` (${doc.curriculumVersionYear})` : ""}`
                : "Official SHS curriculum document"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {classLevelLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {classLevelLabels.map((label) => (
                  <Badge key={label} variant="secondary">
                    {label}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                This document covers SHS 1–3. No class/form preference is set —{" "}
                <Link href="/settings/profile" className="underline-offset-4 hover:underline">
                  set one in Profile Settings
                </Link>
                .
              </p>
            )}

            {doc.documentUrl ? (
              <Button
                render={<a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" />}
                nativeButton={false}
              >
                <ExternalLink className="size-4" />
                Open Curriculum PDF
              </Button>
            ) : (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <FileWarning className="size-4" aria-hidden="true" />
                Curriculum document unavailable.
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
