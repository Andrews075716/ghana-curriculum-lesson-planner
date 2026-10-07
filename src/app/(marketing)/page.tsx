import Link from "next/link";
import {
  Star,
  BookOpen,
  Layers,
  NotebookPen,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Ghana flag colours, used directly as design accents rather than through the
// shared (grayscale) theme tokens — this page is the only place they apply.
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

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-black"
        aria-hidden="true"
      >
        <Star className="size-4.5" style={{ color: GHANA_GOLD }} fill={GHANA_GOLD} />
      </span>
      <span className="text-sm font-semibold leading-tight text-foreground">
        Ghana Curriculum
        <br />
        Lesson Planner
      </span>
    </div>
  );
}

const FEATURES = [
  {
    icon: BookOpen,
    title: "Your Curriculum",
    description:
      "Access curriculum documents for the subjects and SHS levels in your teaching profile.",
    badgeClassName: "bg-[#006B3F]/10 text-[#006B3F]",
  },
  {
    icon: Layers,
    title: "Structured Curriculum",
    description:
      "Explore strands, sub-strands, content standards, learning outcomes and learning indicators.",
    badgeClassName: "bg-[#FCD116]/25 text-foreground",
  },
  {
    icon: NotebookPen,
    title: "Lesson Planning",
    description: "Turn selected curriculum requirements into structured lesson plans.",
    badgeClassName: "bg-[#CE1126]/10 text-[#CE1126]",
  },
];

const WORKFLOW_STEPS = [
  {
    color: GHANA_GREEN,
    textColor: "white",
    title: "Set up your teaching profile",
    description: "Select the subjects and SHS levels you teach.",
  },
  {
    color: GHANA_GOLD,
    textColor: "black",
    title: "Choose curriculum content",
    description: "Work from the relevant standards, outcomes and indicators.",
  },
  {
    color: "black",
    textColor: "white",
    title: "Build your lesson",
    description: "Develop curriculum-aligned lesson plans from your selected content.",
  },
];

export default function MarketingHomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <BrandMark />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Account actions">
            <Button variant="outline" render={<Link href="/login" />} nativeButton={false}>
              Sign in
            </Button>
            <Button
              render={<Link href="/register" />}
              nativeButton={false}
              className="text-white hover:opacity-90"
              style={{ backgroundColor: GHANA_GREEN }}
            >
              Create account
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden px-4 py-20 text-center sm:px-6 sm:py-28">
          <div
            className="pointer-events-none absolute top-0 right-1/2 -z-10 size-[32rem] translate-x-1/3 -translate-y-1/3 rounded-full blur-3xl"
            style={{ backgroundColor: GHANA_GOLD, opacity: 0.18 }}
            aria-hidden="true"
          />
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
            <TricolorBar className="w-24" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
              <Star className="size-3" style={{ color: GHANA_GOLD }} fill={GHANA_GOLD} aria-hidden="true" />
              Built for Ghanaian classrooms
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Plan Better Lessons with{" "}
              <span style={{ color: GHANA_GREEN }}>Ghana&apos;s Curriculum</span>
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              A curriculum-aligned lesson planning platform designed to help SHS teachers turn
              curriculum standards, learning outcomes and indicators into structured, effective
              lessons.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                render={<Link href="/register" />}
                nativeButton={false}
                className="h-11 px-6 text-base text-white hover:opacity-90"
                style={{ backgroundColor: GHANA_GREEN }}
              >
                Create account
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/login" />}
                nativeButton={false}
                className="h-11 px-6 text-base"
              >
                Sign in
              </Button>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold text-foreground sm:text-3xl">
              Built Around the Curriculum You Teach
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card key={feature.title}>
                  <CardHeader>
                    <span
                      className={`flex size-10 items-center justify-center rounded-lg ${feature.badgeClassName}`}
                      aria-hidden="true"
                    >
                      <feature.icon className="size-5" />
                    </span>
                    <CardTitle className="mt-3">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/30 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold text-foreground sm:text-3xl">
              How It Works
            </h2>
            <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {WORKFLOW_STEPS.map((step, index) => (
                <li key={step.title} className="flex flex-col items-center gap-3 text-center">
                  <span
                    className="flex size-10 items-center justify-center rounded-full text-sm font-semibold"
                    style={{ backgroundColor: step.color, color: step.textColor }}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <p className="font-medium text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="relative overflow-hidden bg-black px-4 py-20 text-center text-white sm:px-6">
          <TricolorBar className="absolute top-0 left-0 w-full rounded-none" />
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
            <h2 className="text-3xl font-bold sm:text-4xl">Ready to Start Planning?</h2>
            <p className="text-base text-white/80 sm:text-lg">
              Create your teaching profile and access curriculum-aligned planning tools.
            </p>
            <Button
              size="lg"
              render={<Link href="/register" />}
              nativeButton={false}
              className="h-11 px-6 text-base text-white hover:opacity-90"
              style={{ backgroundColor: GHANA_GREEN }}
            >
              Create account
              <ArrowRight className="size-4" />
            </Button>
            <Link
              href="/login"
              className="rounded-sm text-sm text-white/80 underline underline-offset-4 hover:text-white focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t px-4 py-8 text-center sm:px-6">
        <p className="text-sm font-medium text-foreground">Ghana Curriculum Lesson Planner</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Curriculum-aligned lesson planning for SHS teachers.
        </p>
      </footer>
    </div>
  );
}
