"use client";

/**
 * Stable page wrapper for dashboard views.
 * Previously used framer-motion AnimatePresence mode="wait", which caused
 * hydration mismatches and blank / stuck screens on browser back.
 */
export function ViewTransition({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full bg-[#f3f5f2]">{children}</div>;
}
