import { GraduationCap } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { Breadcrumbs } from "./Breadcrumbs";
import { UserMenu } from "./UserMenu";
import type { CurrentUser } from "@/server/auth/session";

export function Header({ user }: { user: CurrentUser }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 lg:px-6">
      <MobileNav user={user} />
      <div className="flex items-center gap-2 lg:hidden">
        <GraduationCap className="size-5 text-primary" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>
      <UserMenu user={user} />
    </header>
  );
}
