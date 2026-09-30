import { FlatCrudManager } from "@/components/admin/FlatCrudManager";
import { listSubjectsAdmin } from "@/server/services/curriculum-admin.service";

export default async function AdminSubjectsPage() {
  const subjects = await listSubjectsAdmin();

  return (
    <FlatCrudManager
      title="Subjects"
      apiPath="/api/admin/curriculum/subjects"
      initialItems={subjects}
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
      ]}
      fields={[
        { key: "code", label: "Code", type: "text", required: true },
        { key: "name", label: "Name", type: "text", required: true },
      ]}
      rowLabelKey="name"
    />
  );
}
