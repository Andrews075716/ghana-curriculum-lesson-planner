import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingHomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 px-4 py-10 text-center">
      <div className="flex items-center gap-2">
        <GraduationCap className="size-6 text-primary" aria-hidden="true" />
        <span className="text-lg font-semibold text-foreground">
          Ghana Curriculum Lesson Planner
        </span>
      </div>
      <p className="max-w-md text-sm text-muted-foreground">
        Create curriculum-aligned lesson plans in minutes, built directly from
        Ghana&apos;s SHS curriculum structure.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button render={<Link href="/login" />} nativeButton={false}>
          Sign in
        </Button>
        <Button
          variant="outline"
          render={<Link href="/register" />}
          nativeButton={false}
        >
          Create account
        </Button>
      </div>
    </div>
  );
}
