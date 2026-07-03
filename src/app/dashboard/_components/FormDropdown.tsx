"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

export type FormDropdownOption = { value: string; label: string };

const triggerClass =
  "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-left text-[12px] outline-none transition-colors hover:cursor-pointer focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20";

export function FormDropdown({
  options,
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
  className,
  disabled = false,
}: {
  options: FormDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  "aria-label": string;
  className?: string;
  disabled?: boolean;
}) {
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

  const selected = options.find((o) => o.value === value);
  const showPlaceholder = !selected;

  return (
    <div ref={ref} className={clsx("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
        className={clsx(
          triggerClass,
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <span
          className={clsx(
            "min-w-0 flex-1 truncate font-medium",
            showPlaceholder ? "text-[#9aa39a]" : "text-[#1f2b20]",
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={clsx(
            "h-4 w-4 shrink-0 text-[#6b746c] transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="form-dd"
            role="listbox"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-[0_18px_40px_rgba(16,24,16,0.12)]"
          >
            {options.map((o) => {
              const isActive = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={clsx(
                    "flex w-full items-center justify-between px-3 py-2.5 text-left text-[12px] font-semibold hover:cursor-pointer hover:bg-black/5",
                    isActive ? "bg-black/[0.04] text-[#1f2b20]" : "text-[#1f2b20]",
                  )}
                >
                  <span className="min-w-0 truncate">{o.label}</span>
                  {isActive ? (
                    <span className="shrink-0 text-[11px] font-semibold text-[#214e3a]">✓</span>
                  ) : null}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
