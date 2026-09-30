import {
  LayoutDashboard,
  NotebookPen,
  BookOpen,
  Library,
  Users,
  FolderKanban,
  ClipboardCheck,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Primary navigation, shared by the desktop sidebar, mobile nav drawer,
 * and breadcrumb label lookup — a single source of truth for route labels.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Create Planner", href: "/planners/new", icon: NotebookPen },
  { label: "My Planners", href: "/planners", icon: BookOpen },
  { label: "Curriculum", href: "/curriculum", icon: Library },
  { label: "Classes", href: "/classes", icon: Users },
  { label: "Resources", href: "/resources", icon: FolderKanban },
  { label: "Assessments", href: "/assessments", icon: ClipboardCheck },
  { label: "Settings", href: "/settings/profile", icon: Settings },
];

/**
 * Only shown to `CURRICULUM_ADMIN` accounts — kept separate from
 * `NAV_ITEMS` (rather than always in that array) so teacher accounts see
 * no change at all, in code or in the rendered nav.
 */
export const ADMIN_NAV_ITEM: NavItem = {
  label: "Admin",
  href: "/admin/curriculum",
  icon: ShieldCheck,
};

/**
 * The active nav item is the one whose href is the longest matching prefix
 * of the current path, so e.g. "/planners/new" resolves to "Create Planner"
 * rather than also lighting up "My Planners".
 */
export function getActiveNavHref(pathname: string, items: NavItem[] = NAV_ITEMS): string | null {
  let bestMatch: string | null = null;

  for (const item of items) {
    const matches =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (matches && (bestMatch === null || item.href.length > bestMatch.length)) {
      bestMatch = item.href;
    }
  }

  return bestMatch;
}
