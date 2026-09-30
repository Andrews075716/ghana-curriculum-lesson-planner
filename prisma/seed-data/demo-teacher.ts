/**
 * A single demo account with a real, working password — seeded so local
 * dev and the automated test scripts have a real account to log in as.
 * The password below is a LOCAL DEV FIXTURE ONLY: this seed only ever
 * runs against the local embedded Postgres instance, and the account it
 * creates is not usable anywhere else. Never reuse this password for a
 * real account.
 */
export const demoTeacher = {
  school: {
    name: "Achimota Basic School",
    district: "Accra Metropolitan",
    region: "Greater Accra",
  },
  user: {
    name: "Ama Mensah",
    email: "demo.teacher@example.edu.gh",
    password: "DemoTeacher123!",
  },
  teacherProfile: {
    staffId: "DEMO-0001",
    region: "Greater Accra",
  },
  /** Subject/class-level codes to link, resolved against seeded curriculum data at import time. */
  subjectCodes: ["COMP"],
  classLevelNames: ["SHS 1"],
};
