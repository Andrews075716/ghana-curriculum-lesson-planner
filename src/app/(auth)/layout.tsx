import Link from "next/link";
import { Star } from "lucide-react";

// Ghana flag colours, matching the landing page's visual identity
// (src/app/(marketing)/page.tsx) — applied directly here rather than
// through the shared (grayscale) theme tokens, so only this auth layout
// and the marketing page carry them.
const GHANA_GREEN = "#006B3F";
const GHANA_GOLD = "#FCD116";
const GHANA_RED = "#CE1126";

function TricolorBar({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-1 overflow-hidden rounded-full ${className}`} aria-hidden="true">
      <div className="flex-1" style={{ backgroundColor: GHANA_RED }} />
      <div className="flex-1" style={{ backgroundColor: GHANA_GOLD }} />
      <div className="flex-1" style={{ backgroundColor: GHANA_GREEN }} />
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-black p-10 text-white lg:flex lg:w-[42%]">
        <div
          className="pointer-events-none absolute top-0 left-0 size-96 -translate-x-1/3 -translate-y-1/3 rounded-full blur-3xl"
          style={{ backgroundColor: GHANA_GOLD, opacity: 0.15 }}
          aria-hidden="true"
        />
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10" aria-hidden="true">
              <Star className="size-4.5" style={{ color: GHANA_GOLD }} fill={GHANA_GOLD} />
            </span>
            <span className="text-sm font-semibold leading-tight">
              Ghana Curriculum
              <br />
              Lesson Planner
            </span>
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <TricolorBar className="w-24" />
          <h2 className="text-3xl font-bold leading-tight">
            Plan curriculum-aligned lessons with confidence.
          </h2>
          <p className="max-w-sm text-sm text-white/75">
            Access your curriculum, select learning requirements and build structured lesson
            plans for your classes.
          </p>
        </div>

        <p className="text-xs text-white/50">Built for Ghanaian classrooms</p>
      </aside>

      <div className="flex flex-1 flex-col">
        <TricolorBar className="rounded-none lg:hidden" />
        <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted/30 px-4 py-10 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-sm lg:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-black" aria-hidden="true">
              <Star className="size-4.5" style={{ color: GHANA_GOLD }} fill={GHANA_GOLD} />
            </span>
            <span className="text-sm font-semibold leading-tight text-foreground">
              Ghana Curriculum
              <br />
              Lesson Planner
            </span>
          </Link>
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
