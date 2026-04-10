"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, CircleHelp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

export function DashboardHelpMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (ref.current && !ref.current.contains(t)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#F3F5F7] px-4 text-[12px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
      >
        <CircleHelp className="h-[16px] w-[16px] text-[#6b746c]" />
        Aiuto
        <ChevronDown
          className={clsx("h-[18px] w-[18px] text-[#6b746c] transition-transform", open && "rotate-180")}
        />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="dashboard-help-menu"
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-black/10 bg-white p-2 shadow-[0_18px_40px_rgba(16,24,16,0.12)]"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
            >
              Chat supporto
              <span className="text-[11px] text-[#6b746c]">↗</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
            >
              Guide & FAQ
              <span className="text-[11px] text-[#6b746c]">↗</span>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
