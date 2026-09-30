"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintActions({ plannerId }: { plannerId: string }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExportPdf() {
    setIsExporting(true);
    setExportError(null);
    try {
      const res = await fetch(`/api/planners/${plannerId}/pdf`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Failed to generate the PDF.");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") ?? "";
      const filenameMatch = /filename="([^"]+)"/.exec(disposition);
      const filename = filenameMatch?.[1] ?? "Lesson-Plan.pdf";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Failed to generate the PDF.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="print:hidden mb-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" render={<Link href={`/planners/${plannerId}`} />} nativeButton={false}>
          <ArrowLeft className="size-4" />
          Back to Planner
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportPdf} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {isExporting ? "Generating PDF…" : "Export to PDF"}
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
        </div>
      </div>
      {exportError ? (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {exportError}
        </p>
      ) : null}
    </div>
  );
}
