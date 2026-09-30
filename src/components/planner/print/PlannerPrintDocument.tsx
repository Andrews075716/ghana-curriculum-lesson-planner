import { DIFFERENTIATION_FIELDS, DOK_LEVEL_OPTIONS, TERM_OPTIONS } from "@/lib/constants/planner-wizard";
import type { PlannerPrintView } from "@/server/repositories/planner.repository";

export interface PlannerPrintDocumentProps {
  data: PlannerPrintView;
}

const STAGE_LABELS: Record<string, string> = {
  STARTER: "Starter",
  INTRODUCTORY: "Introduction",
  ACTIVITY: "Activity",
  ASSESSMENT: "Assessment",
  CLOSURE: "Lesson Closure",
};

/**
 * Section content is deliberately allowed to flow across a page break — a
 * long "Lesson Planning" section forced to stay whole would either leave a
 * large blank gap on the previous page or, once taller than one page,
 * overflow anyway. Only the heading is pinned to its first line of content
 * (`break-after-avoid`, no orphaned headings); the atomic units worth
 * protecting from a mid-item split are the individual blocks and table
 * rows inside, each marked `break-inside-avoid` below.
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="break-after-avoid border-b border-black pb-1 text-[13px] font-bold uppercase tracking-wide">
        {title}
      </h2>
      <div className="mt-2 flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <td className="border border-gray-400 p-1.5 align-top">
      <div className="text-[9px] font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </div>
      <div className="text-[12px]">{value || "—"}</div>
    </td>
  );
}

function LabeledBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="break-inside-avoid">
      <div className="text-[9px] font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </div>
      <div className="text-[12px]">{value || "—"}</div>
    </div>
  );
}

function ListBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="break-inside-avoid">
      <div className="text-[9px] font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </div>
      {items.length === 0 ? (
        <div className="text-[12px]">—</div>
      ) : (
        <ul className="list-disc pl-4 text-[12px]">
          {items.map((item, i) => (
            <li key={i} className="break-inside-avoid">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A formal, printable rendering of one lesson planner — A4-ready, no app chrome. */
export function PlannerPrintDocument({ data }: PlannerPrintDocumentProps) {
  const termLabel = TERM_OPTIONS.find((t) => t.value === data.term)?.label ?? "—";
  const reflectionFields: Array<{ label: string; value: string | null }> = [
    { label: "What went well?", value: data.lesson?.reflection?.whatWentWell ?? null },
    {
      label: "Were different learner groups catered for?",
      value: data.lesson?.reflection?.subgroupsCatered ?? null,
    },
    { label: "What difficulties occurred?", value: data.lesson?.reflection?.difficulties ?? null },
    {
      label: "Which learning indicators were achieved?",
      value: data.lesson?.reflection?.indicatorsAchieved ?? null,
    },
    { label: "What needs reteaching?", value: data.lesson?.reflection?.reteachingNeeded ?? null },
    {
      label: "What should change next lesson?",
      value: data.lesson?.reflection?.nextLessonChanges ?? null,
    },
    { label: "Additional remarks", value: data.lesson?.reflection?.remarks ?? null },
  ];

  return (
    <div className="print-page mx-auto max-w-[850px] border border-gray-300 bg-white p-8 font-serif text-black shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none">
      <header className="border-b-2 border-black pb-3 text-center">
        <h1 className="text-lg font-bold tracking-wide uppercase">Lesson Plan</h1>
        <p className="text-[11px] text-gray-600">Ghana Curriculum Lesson Planner</p>
      </header>

      <table className="mt-4 w-full border-collapse border border-gray-400 break-inside-avoid">
        <tbody>
          <tr>
            <InfoCell label="School" value={data.school} />
            <InfoCell label="Teacher" value={data.teacherName} />
          </tr>
          <tr>
            <InfoCell label="Subject" value={data.subject} />
            <InfoCell label="Form" value={data.form} />
          </tr>
          <tr>
            <InfoCell label="Term" value={termLabel} />
            <InfoCell label="Week" value={data.weekNumber} />
          </tr>
          <tr>
            <InfoCell
              label="Duration"
              value={data.durationMinutes ? `${data.durationMinutes} minutes` : null}
            />
            <InfoCell label="Lesson Date" value={data.lesson?.date} />
          </tr>
        </tbody>
      </table>

      <Section title="Curriculum Alignment">
        <LabeledBlock label="Strand" value={data.strand} />
        <LabeledBlock label="Sub-Strand" value={data.subStrand} />
        <LabeledBlock label="Content Standard" value={data.contentStandard} />
        <LabeledBlock label="Learning Outcome(s)" value={data.learningOutcome} />
        <LabeledBlock label="Learning Indicator(s)" value={data.learningIndicator} />
      </Section>

      <Section title="Lesson Planning">
        <ListBlock label="Essential Questions" items={data.essentialQuestions} />

        <div>
          <div className="break-after-avoid text-[9px] font-semibold uppercase tracking-wide text-gray-600">
            Cross-Cutting Themes
          </div>
          {data.crossCuttingThemes.length === 0 ? (
            <div className="text-[12px]">—</div>
          ) : (
            <ul className="flex flex-col gap-1 text-[12px]">
              {data.crossCuttingThemes.map((theme) => (
                <li key={theme.label} className="break-inside-avoid">
                  <span className="font-semibold">{theme.label}:</span>{" "}
                  {theme.explanation || "—"}
                </li>
              ))}
            </ul>
          )}
        </div>

        <ListBlock label="Pedagogical Strategies" items={data.pedagogicalStrategies} />
        <ListBlock label="Teaching & Learning Resources" items={data.teachingLearningResources} />

        <div>
          <div className="break-after-avoid text-[9px] font-semibold uppercase tracking-wide text-gray-600">
            Differentiation
          </div>
          <ul className="flex flex-col gap-1 text-[12px]">
            {DIFFERENTIATION_FIELDS.map((field) => (
              <li key={field.key} className="break-inside-avoid">
                <span className="font-semibold">{field.label}:</span>{" "}
                {data.differentiation[field.key] || "—"}
              </li>
            ))}
          </ul>
        </div>

        <ListBlock label="Learning Tasks" items={data.learningTasks} />
        <ListBlock label="Pedagogical Exemplars" items={data.pedagogicalExemplars} />
        <LabeledBlock
          label="Keywords"
          value={data.keywords.length > 0 ? data.keywords.join(", ") : null}
        />
      </Section>

      <Section title="Main Lesson">
        {data.lesson && data.lesson.mainActivities.length > 0 ? (
          <table className="w-full border-collapse border border-gray-400 text-[11px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-1.5 text-left font-semibold">
                  Time
                </th>
                <th className="border border-gray-400 p-1.5 text-left font-semibold">
                  Stage
                </th>
                <th className="border border-gray-400 p-1.5 text-left font-semibold">
                  Teacher Activity
                </th>
                <th className="border border-gray-400 p-1.5 text-left font-semibold">
                  Learner Activity
                </th>
              </tr>
            </thead>
            <tbody>
              {data.lesson.mainActivities.map((activity) => (
                <tr key={`${activity.stage}-${activity.sequence}`} className="break-inside-avoid">
                  <td className="border border-gray-400 p-1.5 align-top whitespace-nowrap">
                    {activity.durationMinutes} min
                  </td>
                  <td className="border border-gray-400 p-1.5 align-top">
                    {STAGE_LABELS[activity.stage] ?? activity.stage}
                    {activity.label ? (
                      <div className="text-[10px] text-gray-600">{activity.label}</div>
                    ) : null}
                  </td>
                  <td className="border border-gray-400 p-1.5 align-top">
                    {activity.teacherActivity}
                  </td>
                  <td className="border border-gray-400 p-1.5 align-top">
                    {activity.learnerActivity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-[12px]">No lesson activities recorded.</p>
        )}
      </Section>

      <Section title="Assessment">
        {data.lesson && data.lesson.assessments.length > 0 ? (
          <table className="w-full border-collapse border border-gray-400 text-[11px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="w-32 border border-gray-400 p-1.5 text-left font-semibold">
                  DoK Level
                </th>
                <th className="border border-gray-400 p-1.5 text-left font-semibold">
                  Assessment
                </th>
              </tr>
            </thead>
            <tbody>
              {data.lesson.assessments.map((assessment) => (
                <tr key={assessment.sequence} className="break-inside-avoid">
                  <td className="border border-gray-400 p-1.5 align-top whitespace-nowrap">
                    {DOK_LEVEL_OPTIONS.find((d) => d.value === assessment.dokLevel)?.label ??
                      assessment.dokLevel}
                  </td>
                  <td className="border border-gray-400 p-1.5 align-top">
                    {assessment.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-[12px]">No assessments recorded.</p>
        )}
      </Section>

      <Section title="Lesson Closure">
        {data.lesson?.closure ? (
          <div className="grid grid-cols-2 gap-3">
            <LabeledBlock label="Teacher Activity" value={data.lesson.closure.teacherActivity} />
            <LabeledBlock label="Learner Activity" value={data.lesson.closure.learnerActivity} />
            <LabeledBlock label="Duration" value={`${data.lesson.closure.durationMinutes} min`} />
          </div>
        ) : (
          <p className="text-[12px]">No lesson closure recorded.</p>
        )}
      </Section>

      <Section title="Reflection & Remarks">
        <p className="text-[10px] text-gray-600">
          Completed by the teacher during or after the lesson.
        </p>
        <div className="flex flex-col gap-3">
          {reflectionFields.map((field) => (
            <div key={field.label} className="break-inside-avoid">
              <div className="text-[9px] font-semibold uppercase tracking-wide text-gray-600">
                {field.label}
              </div>
              {field.value ? (
                <div className="text-[12px]">{field.value}</div>
              ) : (
                <div className="mt-1.5 flex flex-col gap-3">
                  <div className="border-b border-gray-400" />
                  <div className="border-b border-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      <footer className="mt-6 flex items-center justify-between border-t border-gray-300 pt-2 text-[9px] text-gray-500">
        <span>Status: {data.status === "PUBLISHED" ? "Published" : "Draft"}</span>
        <span>Generated by Ghana Curriculum Lesson Planner</span>
      </footer>
    </div>
  );
}
