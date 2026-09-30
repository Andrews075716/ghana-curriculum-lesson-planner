import { AppShell } from "@/components/layout/AppShell";
import { requireAdmin } from "@/server/auth/rbac";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Redirects non-admins (including unauthenticated visitors) — the real
  // server-side gate for every page under (admin). API routes and
  // service-layer mutations enforce this independently via
  // requireAdminSession(), since this layout only protects pages.
  const user = await requireAdmin();

  return <AppShell user={user}>{children}</AppShell>;
}
