import { Star } from "lucide-react";
import { GHANA_GOLD, GHANA_GREEN, GHANA_RED } from "./auth-theme";

/**
 * One continuous, educational Ghana-inspired backdrop for the public
 * authentication pages. Fixed so it stays behind both the product
 * messaging and the glass form card with no hard boundary between them,
 * built entirely from CSS (gradients/blur) — no image asset exists yet.
 */
export function AuthBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-[#fff8ec] via-background to-[#eafdf4]" />

      <div
        className="absolute -top-28 -left-28 size-[30rem] rounded-full blur-3xl"
        style={{ backgroundColor: GHANA_GOLD, opacity: 0.22 }}
      />
      <div
        className="absolute top-1/4 -right-32 size-[28rem] rounded-full blur-3xl"
        style={{ backgroundColor: GHANA_RED, opacity: 0.12 }}
      />
      <div
        className="absolute -bottom-40 left-1/4 size-[34rem] rounded-full blur-3xl"
        style={{ backgroundColor: GHANA_GREEN, opacity: 0.16 }}
      />
      <div
        className="absolute top-1/2 left-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: GHANA_GOLD, opacity: 0.08 }}
      />

      <Star
        className="absolute top-[16%] right-[10%] size-64 text-black/[0.04] sm:size-80 lg:size-96"
        strokeWidth={1}
      />
    </div>
  );
}
