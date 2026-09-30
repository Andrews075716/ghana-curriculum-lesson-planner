"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

/** Human labels for known path segments; unknown segments fall back to a humanized form. */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  planners: "My Planners",
  new: "Create Planner",
  curriculum: "Curriculum",
  classes: "Classes",
  resources: "Resources",
  assessments: "Assessments",
  settings: "Settings",
  profile: "Profile",
  print: "Print",
  lessons: "Lessons",
  admin: "Admin",
};

function humanize(segment: string): string {
  const decoded = decodeURIComponent(segment);
  return decoded
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <span className="text-sm font-medium text-foreground">Dashboard</span>
    );
  }

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const isLast = index === segments.length - 1;
    const label = SEGMENT_LABELS[segment] ?? humanize(segment);
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        <li className="flex items-center">
          <Link
            href="/dashboard"
            aria-label="Dashboard"
            className="text-muted-foreground hover:text-foreground"
          >
            <Home className="size-4" />
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            {crumb.isLast ? (
              <span
                className="truncate font-medium text-foreground"
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className={cn("truncate text-muted-foreground hover:text-foreground")}
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
