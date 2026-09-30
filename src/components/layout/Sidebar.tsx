"use client";

import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { ADMIN_NAV_ITEM, NAV_ITEMS, getActiveNavHref } from "@/lib/constants/navigation";
import { NavLink } from "./NavLink";
import type { CurrentUser } from "@/server/auth/session";

export function Sidebar({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const items = user.role === "CURRICULUM_ADMIN" ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
  const activeHref = getActiveNavHref(pathname, items);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background lg:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <GraduationCap className="size-5 text-primary" aria-hidden="true" />
        <span className="truncate text-sm font-semibold text-foreground">
          Ghana Curriculum Planner
        </span>
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink key={item.href} item={item} active={item.href === activeHref} />
        ))}
      </nav>
    </aside>
  );
}
