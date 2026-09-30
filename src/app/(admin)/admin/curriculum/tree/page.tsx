import { CurriculumTreeEditor } from "@/components/admin/CurriculumTreeEditor";
import {
  listSubjectsAdmin,
  listClassLevelsAdmin,
  listCurriculumVersionsAdmin,
} from "@/server/services/curriculum-admin.service";

export default async function AdminCurriculumTreePage() {
  const [subjects, classLevels, versions] = await Promise.all([
    listSubjectsAdmin(),
    listClassLevelsAdmin(),
    listCurriculumVersionsAdmin(),
  ]);

  return <CurriculumTreeEditor subjects={subjects} classLevels={classLevels} versions={versions} />;
}
