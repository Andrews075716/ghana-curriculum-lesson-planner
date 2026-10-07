import { BookOpen, Layers, NotebookPen } from "lucide-react";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { GHANA_GOLD, GHANA_GREEN, GHANA_RED, TricolorBar } from "@/components/auth/auth-theme";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Your Curriculum",
    description: "Access the curriculum for the subjects you teach.",
    color: GHANA_GREEN,
  },
  {
    icon: Layers,
    title: "Structured Standards",
    description: "Work with curriculum standards, outcomes and indicators.",
    color: GHANA_GOLD,
  },
  {
    icon: NotebookPen,
    title: "Effective Lesson Plans",
    description: "Build structured curriculum-aligned lessons.",
    color: GHANA_RED,
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <AuthBackground />
      <AuthHeader />

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:py-16">
        <section className="hidden max-w-lg flex-col gap-8 lg:flex">
          <div className="flex flex-col gap-4">
            <TricolorBar className="w-24" />
            <h1 className="text-4xl font-bold leading-tight text-foreground">
              Plan curriculum-aligned lessons with{" "}
              <span style={{ color: GHANA_GREEN }}>confidence</span>.
            </h1>
            <p className="max-w-md text-base text-muted-foreground">
              Access your curriculum, select learning requirements and build structured lesson
              plans for your classes.
            </p>
          </div>

          <ul className="flex flex-col gap-5">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${feature.color}1A`, color: feature.color }}
                  aria-hidden="true"
                >
                  <feature.icon className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold tracking-wide text-foreground uppercase">
                    {feature.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted-foreground">Built for Ghanaian classrooms</p>
        </section>

        <section className="flex flex-1 items-center justify-center lg:justify-end">
          {children}
        </section>
      </main>
    </div>
  );
}
