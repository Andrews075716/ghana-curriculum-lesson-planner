import { FlatCrudManager } from "@/components/admin/FlatCrudManager";
import { listClassLevelsAdmin } from "@/server/services/curriculum-admin.service";

export default async function AdminClassLevelsPage() {
  const classLevels = await listClassLevelsAdmin();

  return (
    <FlatCrudManager
      title="Class Levels"
      apiPath="/api/admin/curriculum/class-levels"
      initialItems={classLevels}
      columns={[
        { key: "name", label: "Name" },
        { key: "sequence", label: "Sequence" },
      ]}
      fields={[
        { key: "name", label: "Name", type: "text", required: true },
        { key: "sequence", label: "Sequence", type: "number", required: true },
      ]}
      rowLabelKey="name"
    />
  );
}
