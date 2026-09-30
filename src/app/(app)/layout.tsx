import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { verifySession, getCurrentUser } from "@/server/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Redirects to /login if there's no valid session — the real
  // server-side gate; src/proxy.ts's redirect is only an optimistic
  // fast-path in front of this.
  await verifySession();
  const user = await getCurrentUser();
  // A valid session whose user row no longer exists (e.g. deleted account) — treat as signed out.
  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
