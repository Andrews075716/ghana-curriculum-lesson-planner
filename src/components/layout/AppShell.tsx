import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import type { CurrentUser } from "@/server/auth/session";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: CurrentUser;
}) {
  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      <div className="print:hidden">
        <Sidebar user={user} />
      </div>
      <div className="flex min-h-screen flex-col lg:pl-64 print:pl-0">
        <div className="print:hidden">
          <Header user={user} />
        </div>
        <main className="flex-1 p-4 lg:p-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
