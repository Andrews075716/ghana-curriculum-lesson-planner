import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 px-4 py-10">
      <div className="flex items-center gap-2">
        <GraduationCap className="size-6 text-primary" aria-hidden="true" />
        <span className="text-lg font-semibold text-foreground">Ghana Curriculum Planner</span>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
