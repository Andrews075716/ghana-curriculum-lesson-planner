import { FlatCrudManager } from "@/components/admin/FlatCrudManager";
import { listCurriculumVersionsAdmin } from "@/server/services/curriculum-admin.service";

export default async function AdminCurriculumVersionsPage() {
  const versions = await listCurriculumVersionsAdmin();

  return (
    <FlatCrudManager
      title="Curriculum Versions"
      apiPath="/api/admin/curriculum/versions"
      initialItems={versions}
      columns={[
        { key: "name", label: "Name" },
        { key: "year", label: "Year" },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { key: "name", label: "Name", type: "text", required: true },
        { key: "year", label: "Year (optional)", type: "number" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "DRAFT", label: "Draft" },
            { value: "ACTIVE", label: "Active" },
            { value: "ARCHIVED", label: "Archived" },
          ],
        },
      ]}
      rowLabelKey="name"
    />
  );
}
