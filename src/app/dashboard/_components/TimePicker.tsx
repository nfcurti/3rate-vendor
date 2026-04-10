"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, useState } from "react";

function parseHHmm(s: string): { h12: number; m: number; ampm: "AM" | "PM" } {
  const [hh, mm] = s.split(":").map((x) => parseInt(x, 10));
  const h24 = Number.isFinite(hh) ? Math.min(23, Math.max(0, hh)) : 9;
  const m = Number.isFinite(mm) ? Math.min(59, Math.max(0, mm)) : 0;
  const ampm: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return { h12, m, ampm };
}

function toHHmm(h12: number, m: number, ampm: "AM" | "PM"): string {
  let h24 = h12 % 12;
  if (ampm === "PM") h24 += 12;
  if (ampm === "AM" && h12 === 12) h24 = 0;
  return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDisplay(h12: number, m: number, ampm: "AM" | "PM"): string {
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

type TimePickerProps = {
  value: string;
  onChange: (hhmm: string) => void;
  disabled?: boolean;
  id?: string;
};

export function TimePicker({ value, onChange, disabled, id }: TimePickerProps) {
  const autoId = useId();
  const panelId = `${id ?? autoId}-panel`;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const parsed = parseHHmm(value);
  const [draft, setDraft] = useState(parsed);

  useEffect(() => {
    if (open) setDraft(parseHHmm(value));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (wrapRef.current && !wrapRef.current.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function apply(next: { h12: number; m: number; ampm: "AM" | "PM" }) {
    setDraft(next);
    onChange(toHHmm(next.h12, next.m, next.ampm));
  }

  return (
    <div ref={wrapRef} className="relative inline-block min-w-[7.5rem]">
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={clsx(
          "flex h-9 w-full min-w-[7.5rem] items-center justify-center rounded-lg border border-black/10 bg-[#F9FAFB] px-3 text-center text-[12px] font-medium tabular-nums text-[#111827] outline-none transition-colors",
          !disabled && "hover:cursor-pointer hover:border-[#214e3a]/25",
          disabled && "cursor-not-allowed opacity-50",
          open && !disabled && "border-[#214e3a]/35 ring-1 ring-[#214e3a]/20",
        )}
      >
        {formatDisplay(parsed.h12, parsed.m, parsed.ampm)}
      </button>

      {open && !disabled ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Seleziona orario"
          className="absolute right-0 top-full z-50 mt-1 w-[min(100vw-2rem,17rem)] rounded-xl border border-black/10 bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
        >
          <div className="text-center text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
            Ora
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1">
            {HOURS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => apply({ ...draft, h12: h })}
                className={clsx(
                  "rounded-lg py-2 text-[12px] font-semibold tabular-nums hover:cursor-pointer",
                  draft.h12 === h
                    ? "bg-[#214e3a] text-white"
                    : "bg-[#f3f5f2] text-[#111827] hover:bg-[#e8ebe6]",
                )}
              >
                {h}
              </button>
            ))}
          </div>

          <div className="mt-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
            Minuti
          </div>
          <div className="mt-2 max-h-[132px] overflow-y-auto overscroll-contain rounded-lg border border-black/[0.06] bg-[#fafafa] p-1.5">
            <div className="grid grid-cols-6 gap-1">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => apply({ ...draft, m })}
                  className={clsx(
                    "rounded-md py-1.5 text-[10px] font-semibold tabular-nums hover:cursor-pointer",
                    draft.m === m
                      ? "bg-[#76C043] text-white"
                      : "bg-white text-[#111827] shadow-sm ring-1 ring-black/[0.04] hover:bg-[#f3f5f2]",
                  )}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            {(["AM", "PM"] as const).map((ap) => (
              <button
                key={ap}
                type="button"
                onClick={() => apply({ ...draft, ampm: ap })}
                className={clsx(
                  "flex-1 rounded-lg py-2 text-[12px] font-semibold hover:cursor-pointer",
                  draft.ampm === ap
                    ? "bg-[#214e3a] text-white"
                    : "border border-black/10 bg-white text-[#374151] hover:bg-[#f9fafb]",
                )}
              >
                {ap}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 w-full rounded-lg bg-[#f3f5f2] py-2 text-[12px] font-semibold text-[#214e3a] hover:cursor-pointer hover:bg-[#e8ebe6]"
          >
            Chiudi
          </button>
        </div>
      ) : null}
    </div>
  );
}
