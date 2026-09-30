import Link from "next/link";
import { BookMarked, GraduationCap, Layers, Upload } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  listSubjectsAdmin,
  listClassLevelsAdmin,
  listCurriculumVersionsAdmin,
} from "@/server/services/curriculum-admin.service";

const SECTIONS = [
  {
    href: "/admin/curriculum/subjects",
    title: "Subjects",
    icon: BookMarked,
    description: "The subjects taught across the curriculum (e.g. Computing, Mathematics).",
  },
  {
    href: "/admin/curriculum/class-levels",
    title: "Class Levels",
    icon: GraduationCap,
    description: "Forms/grades (e.g. Form 1, Form 2) and their ordering.",
  },
  {
    href: "/admin/curriculum/versions",
    title: "Curriculum Versions",
    icon: Layers,
    description: "Draft, active, and archived curriculum releases.",
  },
  {
    href: "/admin/curriculum/tree",
    title: "Strands & Indicators",
    icon: Layers,
    description: "Strand -> Sub-strand -> Content Standard -> Outcome -> Indicator hierarchy.",
  },
  {
    href: "/admin/curriculum/import",
    title: "Import",
    icon: Upload,
    description: "Bulk-import curriculum data from CSV or JSON, with validation and preview.",
  },
];

export default async function AdminCurriculumPage() {
  const [subjects, classLevels, versions] = await Promise.all([
    listSubjectsAdmin(),
    listClassLevelsAdmin(),
    listCurriculumVersionsAdmin(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Curriculum Administration</h1>
        <p className="text-sm text-muted-foreground">
          {subjects.length} subject(s), {classLevels.length} class level(s), {versions.length} curriculum
          version(s).
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader>
                <section.icon className="size-5 text-primary" aria-hidden="true" />
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
