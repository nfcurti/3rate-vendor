"use client";

import { ArrowLeft, Bell, CircleHelp } from "lucide-react";
import Link from "next/link";

export function DashboardViewHeader({
  title,
  backHref,
  backAriaLabel = "Torna indietro",
  rightExtra,
  className = "",
}: {
  title: React.ReactNode;
  backHref?: string;
  backAriaLabel?: string;
  rightExtra?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="bg-white">
      <header
        className={`mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 pr-16 sm:pr-4 lg:px-8 ${className}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
              aria-label={backAriaLabel}
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
            </Link>
          ) : null}
          <h1 className="min-w-0 flex-1 truncate whitespace-nowrap text-lg font-semibold tracking-tight text-[#111827] sm:text-xl">
            {title}
          </h1>
        </div>

        <div className="flex items-center justify-end gap-3">
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/dashboard/notifiche"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
              aria-label="Notifiche"
            >
              <Bell className="h-[18px] w-[18px]" />
            </Link>

            <Link
              href="/dashboard/centro-assistenza"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#F3F5F7] px-4 text-[12px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
              aria-label="Aiuto"
            >
              <CircleHelp className="h-[16px] w-[16px] text-[#6b746c]" />
              Aiuto
            </Link>
          </div>
          {rightExtra}
        </div>
      </header>
    </div>
  );
}
