/* eslint-disable @next/next/no-img-element */

"use client";

import clsx from "clsx";
import {
  Bell,
  CircleHelp,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = {
  href: string;
  label: string;
};

const primary: NavItem[] = [
  { href: "/dashboard", label: "Panoramica" },
  { href: "/dashboard/magazzino", label: "Magazzino" },
  { href: "/dashboard/ordini", label: "Ordini" },
  { href: "/dashboard/pagamenti", label: "Pagamenti & guadagni" },
];

const operations: NavItem[] = [
  { href: "/dashboard/scansiona", label: "Scansiona & aggiungi" },
];

const support: NavItem[] = [
  { href: "/dashboard/centro-assistenza", label: "Centro Assistenza" },
  { href: "/dashboard/impostazioni", label: "Impostazioni" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pb-2 text-[10px] font-semibold tracking-wide text-[#5DBE54]">
      {children}
    </div>
  );
}

function SidebarItem({ href, label }: NavItem) {
  const pathname = usePathname();
  const isActive =
    href !== "#" &&
    (href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <a
      href={href}
      className={clsx(
        "group relative block overflow-hidden rounded-md transition-colors hover:cursor-pointer",
        isActive ? "bg-[#425f50]" : "text-white/80 hover:bg-white/10 hover:text-white",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {isActive && (
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-[5px] rounded-l-xl bg-[#76C043]"
        />
      )}

      <div
        className={clsx(
          "flex items-center",
          isActive ? "px-4 py-3 pl-[22px]" : "px-4 py-3",
        )}
      >
        <span
          className={clsx(
            "truncate font-medium",
            isActive ? "text-[13px] text-white" : "text-[13px]",
          )}
        >
          {label}
        </span>
      </div>
    </a>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarBody = (
    <div className="flex h-full flex-col bg-[#214e3a] text-white">
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <img src="/brand/logo.svg" alt="3rate" className="h-9 w-auto" />
          <span className="rounded-full bg-[#5DBE54] px-2 py-1 text-[10px] font-semibold text-[#14311f]">
            VENDITORE
          </span>
        </div>
      </div>

      <nav className="px-4 pb-6">
        <SectionLabel>PRINCIPALE</SectionLabel>
        <div className="space-y-1.5">
          {primary.map((it) => (
            <SidebarItem key={it.label} {...it} />
          ))}
        </div>

        <div className="mt-6">
          <SectionLabel>OPERAZIONI</SectionLabel>
          <div className="space-y-1.5">
            {operations.map((it) => (
              <SidebarItem key={it.label} {...it} />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <SectionLabel>SUPPORTO</SectionLabel>
          <div className="space-y-1.5">
            {support.map((it) => (
              <SidebarItem key={it.label} {...it} />
            ))}
          </div>
        </div>
      </nav>

      <div className="px-4 pb-6 lg:hidden">
        <SectionLabel>RAPIDO</SectionLabel>
        <div className="space-y-1.5">
          <a
            href="/dashboard/notifiche"
            className="group relative block overflow-hidden rounded-md px-4 py-3 text-white/80 transition-colors hover:cursor-pointer hover:bg-white/10 hover:text-white"
          >
            <span className="flex items-center gap-2 text-[13px] font-medium">
              <Bell className="h-4 w-4" />
              Notifiche
            </span>
          </a>
          <a
            href="/dashboard/centro-assistenza"
            className="group relative block overflow-hidden rounded-md px-4 py-3 text-white/80 transition-colors hover:cursor-pointer hover:bg-white/10 hover:text-white"
          >
            <span className="flex items-center gap-2 text-[13px] font-medium">
              <CircleHelp className="h-4 w-4" />
              Aiuto
            </span>
          </a>
        </div>
      </div>

      <div className="mt-auto px-4 pb-5">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/15 px-3 py-3 ring-1 ring-white/10">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#5DBE54]/25 ring-1 ring-white/15" />
            <div className="min-w-0">
              <div className="truncate text-[11px] font-semibold">
                Tech Store Milano
              </div>
              <div className="text-[10px] text-white/70">ID: 8832901</div>
            </div>
          </div>

          <a
            href="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 hover:cursor-pointer hover:bg-white/15"
            aria-label="Esci"
          >
            <LogOut className="h-4 w-4 text-white/80" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed right-4 top-4 z-50 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#214e3a] text-white shadow-[0_10px_20px_rgba(16,24,16,0.18)] hover:cursor-pointer hover:bg-[#1a3f2e]"
          aria-label="Apri menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 hover:cursor-pointer"
            aria-label="Chiudi menu"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="relative h-full w-[288px] max-w-[82vw] shadow-[0_24px_60px_rgba(16,24,16,0.28)]">
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 hover:cursor-pointer hover:bg-white/15"
                aria-label="Chiudi menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebarBody}
          </aside>
        </div>
      ) : null}

      <aside className="hidden lg:block">
        {sidebarBody}
      </aside>
    </>
  );
}
