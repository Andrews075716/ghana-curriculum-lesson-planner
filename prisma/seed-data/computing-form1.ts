import type { CurriculumTreeInput } from "../seed/curriculum-types";

/**
 * Computing, Form 1 — curriculum tree for development seeding.
 *
 * Source: docs/lesson plan.docx (the only curriculum reference available in
 * this project). This covers weeks 1-16 of that document — the two strands
 * (four sub-strands) for which the document gives a complete, unambiguous
 * Strand -> Sub-Strand -> Content Standard -> Learning Outcome -> Learning
 * Indicator chain. Weeks 17-24 (Sub-Strands "App Development" and
 * "Web Technologies and Databases") are visible in the source but were not
 * transcribed in full here; add them the same way once transcribed, rather
 * than inventing their content.
 *
 * Every description below is the source text, normalized only for casing
 * and stray whitespace — no wording, standard, outcome, or indicator was
 * invented. Where the same indicator text repeats across consecutive weeks
 * in the source (e.g. weeks 11-12, 13-14, 15-16 continue the same
 * indicator), it is recorded once here rather than duplicated.
 *
 * `code` values are a synthetic, internal identification scheme
 * (SUBJECT-CLASSLEVEL-STRAND-SUBSTRAND-STANDARD-INDICATOR) used to make
 * imports idempotent and give every node a stable reference. The source
 * document does not include official GES curriculum codes.
 */
export const computingForm1: CurriculumTreeInput = {
  subject: {
    code: "COMP",
    name: "Computing",
  },
  classLevel: {
    name: "SHS 1",
    sequence: 1,
  },
  curriculumVersion: {
    name: "Reference Sample - Computing (docs/lesson plan.docx)",
    status: "DRAFT",
  },
  strands: [
    {
      code: "COMP-F1-STR-01",
      name: "Computer Architecture and Organisation",
      sequence: 1,
      subStrands: [
        {
          code: "COMP-F1-STR-01-SS-01",
          name: "Data Storage and Manipulation",
          sequence: 1,
          contentStandards: [
            {
              code: "COMP-F1-STR-01-SS-01-CS-01",
              description:
                "Demonstrate knowledge and understanding of data representation and data manipulation.",
              sequence: 1,
              outcomes: [
                {
                  description:
                    "Apply computer architecture concepts related to the design of modern processors, memories, input and output to manipulate data.",
                  sequence: 1,
                  indicators: [
                    {
                      code: "COMP-F1-STR-01-SS-01-CS-01-LI-01",
                      description: "Describe data as bit patterns.",
                      sequence: 1,
                    },
                  ],
                },
                {
                  description:
                    "Explain how binary sequences are used to represent digital data.",
                  sequence: 2,
                  indicators: [
                    {
                      code: "COMP-F1-STR-01-SS-01-CS-01-LI-02",
                      description: "Bits and their storage.",
                      sequence: 1,
                    },
                    {
                      code: "COMP-F1-STR-01-SS-01-CS-01-LI-03",
                      description: "Bits manipulation.",
                      sequence: 2,
                    },
                    {
                      code: "COMP-F1-STR-01-SS-01-CS-01-LI-04",
                      description: "Central Processing Unit (CPU) basics.",
                      sequence: 3,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          code: "COMP-F1-STR-01-SS-02",
          name: "Computer Hardware and Software",
          sequence: 2,
          contentStandards: [
            {
              code: "COMP-F1-STR-01-SS-02-CS-01",
              description:
                "Demonstrate knowledge and understanding of components of computer hardware and types of software.",
              sequence: 1,
              outcomes: [
                {
                  description:
                    "Explain the relationships between the components of a computer and how data is transferred among the components.",
                  sequence: 1,
                  indicators: [
                    {
                      code: "COMP-F1-STR-01-SS-02-CS-01-LI-01",
                      description:
                        "Description of the categories of computer hardware.",
                      sequence: 1,
                    },
                    {
                      code: "COMP-F1-STR-01-SS-02-CS-01-LI-02",
                      description:
                        "Description of the categories of computer hardware (continued).",
                      sequence: 2,
                    },
                    {
                      code: "COMP-F1-STR-01-SS-02-CS-01-LI-03",
                      description:
                        "Features of the hardware components of a computer.",
                      sequence: 3,
                    },
                  ],
                },
                {
                  description: "Explain the types of software and their functions.",
                  sequence: 2,
                  indicators: [
                    {
                      code: "COMP-F1-STR-01-SS-02-CS-01-LI-04",
                      description:
                        "Explain the types of software and their functions.",
                      sequence: 1,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          code: "COMP-F1-STR-01-SS-03",
          name: "Data Communication and Network Systems",
          sequence: 3,
          contentStandards: [
            {
              code: "COMP-F1-STR-01-SS-03-CS-01",
              description:
                "Demonstrate knowledge and understanding of network design.",
              sequence: 1,
              outcomes: [
                {
                  description:
                    "Use skills and knowledge to identify and differentiate between the different types of network systems.",
                  sequence: 1,
                  indicators: [
                    {
                      code: "COMP-F1-STR-01-SS-03-CS-01-LI-01",
                      description:
                        "Explain computer networks and how they work.",
                      sequence: 1,
                    },
                    {
                      code: "COMP-F1-STR-01-SS-03-CS-01-LI-02",
                      description:
                        "Identify at least 3 types of network systems.",
                      sequence: 2,
                    },
                    {
                      code: "COMP-F1-STR-01-SS-03-CS-01-LI-03",
                      description:
                        "Differentiate among 3 types of network systems.",
                      sequence: 3,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      code: "COMP-F1-STR-02",
      name: "Computational Thinking (Programming Logic)",
      sequence: 2,
      subStrands: [
        {
          code: "COMP-F1-STR-02-SS-01",
          name: "Algorithm and Data Structure",
          sequence: 1,
          contentStandards: [
            {
              code: "COMP-F1-STR-02-SS-01-CS-01",
              description:
                "Demonstrate knowledge and understanding of data structures.",
              sequence: 1,
              outcomes: [
                {
                  description:
                    "Apply knowledge of data structures to explain their real-life applications effectively.",
                  sequence: 1,
                  indicators: [
                    {
                      code: "COMP-F1-STR-02-SS-01-CS-01-LI-01",
                      description:
                        "Explain in detail the concepts of data structures and their importance in organising and manipulating data efficiently.",
                      sequence: 1,
                    },
                    {
                      code: "COMP-F1-STR-02-SS-01-CS-01-LI-02",
                      description:
                        "Differentiate between the types of data structures.",
                      sequence: 2,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
