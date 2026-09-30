"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Copy, Pencil, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function PlannerDetailActions({
  plannerId,
  status,
  topic,
}: {
  plannerId: string;
  status: "DRAFT" | "PUBLISHED";
  topic: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editHref =
    status === "DRAFT" ? `/planners/new?draftId=${plannerId}` : `/planners/${plannerId}`;

  async function handleDuplicate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/planners/${plannerId}/duplicate`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Failed to duplicate the planner.");
      router.push(`/planners/new?draftId=${body.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate the planner.");
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/planners/${plannerId}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Failed to delete the planner.");
      router.push("/planners");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete the planner.");
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" render={<Link href="/planners" />} nativeButton={false}>
          <ArrowLeft className="size-4" />
          Back to My Planners
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled={busy} render={<Link href={editHref} />} nativeButton={false}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button variant="outline" disabled={busy} onClick={handleDuplicate}>
            <Copy className="size-4" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            render={<Link href={`/planners/${plannerId}/print`} />}
            nativeButton={false}
          >
            <Printer className="size-4" />
            Print / Preview
          </Button>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" disabled={busy} />}>
              <Trash2 className="size-4" />
              Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this planner?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{topic}&rdquo; will be permanently deleted, including its lesson
                  activities and assessments. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {error ? (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
