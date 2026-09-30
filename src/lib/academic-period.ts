import type { Term } from "@prisma/client";

export interface AcademicPeriod {
  term: Term;
  academicYear: string;
}

export const TERM_ORDER: Term[] = ["TERM_1", "TERM_2", "TERM_3"];

/** Terms chronologically at or after `term` within the same academic year. */
export function termsAtOrAfter(term: Term): Term[] {
  return TERM_ORDER.slice(TERM_ORDER.indexOf(term));
}

/**
 * Approximates the current GES academic term/year from a calendar date, so
 * "this term" stats have a real definition to query against. Ghana's school
 * year typically runs Sept-Jul across three terms; exact term boundaries
 * vary school-to-school, so this is a reasonable default, not an official
 * calendar. Replace with a real AcademicTerm table (with start/end dates)
 * once that's needed for scheduling.
 */
export function getCurrentAcademicPeriod(now = new Date()): AcademicPeriod {
  const month = now.getMonth(); // 0-indexed: 0 = Jan, 8 = Sep
  const calendarYear = now.getFullYear();

  // Academic year starts in September and runs into the following year.
  const startYear = month >= 8 ? calendarYear : calendarYear - 1;
  const academicYear = `${startYear}/${startYear + 1}`;

  let term: Term;
  if (month >= 8 || month === 0) {
    // Sep - Jan: Term 1
    term = "TERM_1";
  } else if (month >= 1 && month <= 3) {
    // Feb - Apr: Term 2
    term = "TERM_2";
  } else {
    // May - Aug: Term 3
    term = "TERM_3";
  }

  return { term, academicYear };
}
