// Ghana flag colours and shared visual building blocks for the public
// authentication experience (/login, /register, /forgot-password,
// /reset-password). Matches the landing page's visual identity
// (src/app/(marketing)/page.tsx) — applied directly here rather than
// through the shared (grayscale) theme tokens, so only this auth
// experience and the marketing page carry them.
export const GHANA_GREEN = "#006B3F";
export const GHANA_GOLD = "#FCD116";
export const GHANA_RED = "#CE1126";

export function TricolorBar({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-1 overflow-hidden rounded-full ${className}`} aria-hidden="true">
      <div className="flex-1" style={{ backgroundColor: GHANA_RED }} />
      <div className="flex-1" style={{ backgroundColor: GHANA_GOLD }} />
      <div className="flex-1" style={{ backgroundColor: GHANA_GREEN }} />
    </div>
  );
}

// Translucent "glass" card so the Ghana-inspired background stays subtly
// visible behind the authentication forms, instead of sitting on an
// isolated opaque white panel.
export const AUTH_CARD_CLASSNAME =
  "border border-white/60 bg-white/60 shadow-xl shadow-black/5 ring-1 ring-white/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50";

// Inputs stay legible against the glass card while still reading as part
// of the same translucent surface.
export const AUTH_INPUT_CLASSNAME =
  "border-black/10 bg-white/70 focus-visible:border-[#006B3F] focus-visible:ring-[#006B3F]/30";
