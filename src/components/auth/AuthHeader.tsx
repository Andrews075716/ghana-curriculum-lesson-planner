"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GHANA_GOLD, GHANA_GREEN } from "./auth-theme";

export function AuthHeader() {
  const pathname = usePathname();
  const isLogin = pathname?.startsWith("/login") ?? false;
  const isRegister = pathname?.startsWith("/register") ?? false;

  return (
    <header
      className="sticky top-0 z-20 border-b-2 bg-white/70 backdrop-blur-md"
      style={{ borderImage: `linear-gradient(to right, ${GHANA_GOLD}, ${GHANA_GREEN}) 1` }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-black"
            aria-hidden="true"
          >
            <Star className="size-4.5" style={{ color: GHANA_GOLD }} fill={GHANA_GOLD} />
          </span>
          <span className="text-sm font-semibold leading-tight text-foreground">
            Ghana Curriculum
            <br />
            Lesson Planner
          </span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Account actions">
          <Button variant="ghost" size="sm" render={<Link href="/" />} nativeButton={false}>
            Home
          </Button>
          <Button
            variant={isRegister ? "default" : "outline"}
            size="sm"
            render={<Link href="/register" />}
            nativeButton={false}
            aria-current={isRegister ? "page" : undefined}
            className={isRegister ? "text-white hover:opacity-90" : undefined}
            style={isRegister ? { backgroundColor: GHANA_GREEN } : undefined}
          >
            Create account
          </Button>
          <Button
            variant={isLogin ? "default" : "outline"}
            size="sm"
            render={<Link href="/login" />}
            nativeButton={false}
            aria-current={isLogin ? "page" : undefined}
            className={isLogin ? "text-white hover:opacity-90" : undefined}
            style={isLogin ? { backgroundColor: GHANA_GREEN } : undefined}
          >
            Sign in
          </Button>
        </nav>
      </div>
    </header>
  );
}
