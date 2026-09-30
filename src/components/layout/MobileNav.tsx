"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ADMIN_NAV_ITEM, NAV_ITEMS, getActiveNavHref } from "@/lib/constants/navigation";
import { NavLink } from "./NavLink";
import type { CurrentUser } from "@/server/auth/session";

export function MobileNav({ user }: { user: CurrentUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = user.role === "CURRICULUM_ADMIN" ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
  const activeHref = getActiveNavHref(pathname, items);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader className="border-b">
            <SheetTitle className="flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" aria-hidden="true" />
              Ghana Curriculum Planner
            </SheetTitle>
          </SheetHeader>
          <nav aria-label="Main" className="flex flex-col gap-1 overflow-y-auto p-3">
            {items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={item.href === activeHref}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
