"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FileDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatApiErrorMessage } from "@/lib/business-auth";
import {
  businessPaymentsApi,
  formatPayoutDateLong,
  formatPayoutMoney,
  parsePayoutDate,
  payoutStatusKind,
  type Payout,
} from "@/lib/business-payments";
import { DashboardViewHeader } from "../../_components/DashboardViewHeader";
import { Sidebar } from "../../_components/Sidebar";
import { ViewTransition } from "../../_components/ViewTransition";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"] as const;
const MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
] as const;

type DayKind = "received" | "incoming" | "scheduled";

type DayMeta = { kind: DayKind; amount: string };

function padMondayStartCells(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const mondayIndex = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];

  for (let i = 0; i < mondayIndex; i++) {
    const d = prevMonthDays - mondayIndex + i + 1;
    cells.push({ date: new Date(year, monthIndex - 1, d), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, monthIndex, d), inMonth: true });
  }
  const tail = cells.length % 7;
  if (tail !== 0) {
    for (let i = 0; i < 7 - tail; i++) {
      cells.push({ date: new Date(year, monthIndex + 1, i + 1), inMonth: false });
    }
  }
  return cells;
}

function KpiCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: "default" | "filled";
}) {
  const isFilled = variant === "filled";
  return (
    <div
      className={`rounded-2xl px-5 py-5 shadow-[0_12px_28px_rgba(16,24,16,0.06)] ${
        isFilled ? "bg-[#214e3a] text-white" : "bg-white text-[#1f2b20]"
      }`}
    >
      <div
        className={`text-[10px] font-medium tracking-wide ${
          isFilled ? "text-white/70" : "text-[#9aa39a]"
        }`}
      >
        {label}
      </div>
      <div className="mt-1 text-[20px] font-semibold leading-tight tabular-nums">{value}</div>
    </div>
  );
}

function splitAccreditoCell(accredito: string) {
  const lastComma = accredito.lastIndexOf(", ");
  if (lastComma === -1) return { dateLine: accredito, time: "" as string };
  const tail = accredito.slice(lastComma + 2).trim();
  if (/^\d{1,2}:\d{2}$/.test(tail)) {
    return { dateLine: accredito.slice(0, lastComma), time: tail };
  }
  return { dateLine: accredito, time: "" };
}

function splitPeriodoCell(periodo: string) {
  const lastComma = periodo.lastIndexOf(", ");
  if (lastComma === -1) return { rangeLine: periodo, detail: "" as string };
  return {
    rangeLine: periodo.slice(0, lastComma).trim(),
    detail: periodo.slice(lastComma + 2).trim(),
  };
}

function ProssimoPagamentoBankIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={12}
      height={12}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5.70642 0.0597656L0.456424 2.30977C0.128299 2.45039 -0.0545136 2.80195 0.0181427 3.14883C0.0907989 3.4957 0.395486 3.74883 0.751736 3.74883V3.93633C0.751736 4.24805 1.00252 4.49883 1.31424 4.49883H10.6892C11.001 4.49883 11.2517 4.24805 11.2517 3.93633V3.74883C11.608 3.74883 11.915 3.49805 11.9853 3.14883C12.0556 2.79961 11.8728 2.44805 11.547 2.30977L6.29705 0.0597656C6.10955 -0.0199219 5.89392 -0.0199219 5.70642 0.0597656ZM3.00174 5.24883H1.50174V9.84961C1.48767 9.85664 1.47361 9.86602 1.45955 9.87539L0.334549 10.6254C0.0603302 10.8082 -0.0638886 11.1504 0.0322052 11.4668C0.18 11.78 0.421268 11.9988 0.751736 11.9988H11.2517C11.5822 11.9988 11.8728 11.7832 11.9689 11.4668C11.55 11.78 11.9431 10.8082 11.6666 10.6254L10.5416 9.87539C10.5275 9.86602 10.5135 9.85898 10.4994 9.84961V5.24883H9.00174V9.74883H8.06424V5.24883H6.56424V9.74883H5.43924V5.24883H3.93924V9.74883H3.00174V5.24883ZM6.00174 1.49883C6.41567 1.49883 6.75174 1.83489 6.75174 2.24883C6.75174 2.66276 6.41567 2.99883 6.00174 2.99883C5.5878 2.99883 5.25174 2.66276 5.25174 2.24883C5.25174 1.83489 5.5878 1.49883 6.00174 1.49883Z"
        fill="#4B5563"
      />
    </svg>
  );
}

function buildMonthEvents(payouts: Payout[], year: number, monthIndex: number) {
  const events: Record<number, DayMeta> = {};
  payouts.forEach((payout) => {
    const date = parsePayoutDate(payout.arrivalDate ?? payout.createdAt);
    if (!date || date.getFullYear() !== year || date.getMonth() !== monthIndex) return;
    events[date.getDate()] = {
      kind: payoutStatusKind(payout.status),
      amount: formatPayoutMoney(payout.amount, payout.currency?.toUpperCase() ?? "EUR"),
    };
  });
  return events;
}

function payoutToTransferRow(payout: Payout, bankLast4?: string) {
  const arrival = payout.arrivalDate ?? payout.createdAt;
  return {
    id: payout.id ? `#${payout.id.slice(-8).toUpperCase()}` : "—",
    accredito: formatPayoutDateLong(arrival),
    periodo: payout.status === "paid" ? "Bonifico completato" : "Bonifico programmato",
    lordo: formatPayoutMoney(payout.amount, payout.currency?.toUpperCase() ?? "EUR"),
    commissioni: "—",
    commissioniPct: "—",
    netto: formatPayoutMoney(payout.amount, payout.currency?.toUpperCase() ?? "EUR"),
    conto: bankLast4 ?? "—",
  };
}

export default function StoricoPagamentiPage() {
  const now = new Date();
  const [view, setView] = useState(() => ({ y: now.getFullYear(), m: now.getMonth() }));
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [bankLast4, setBankLast4] = useState<string | undefined>();
  const perPage = 8;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setStatusMessage(null);
      try {
        const [payoutsPayload, banksPayload] = await Promise.all([
          businessPaymentsApi.getPayouts(),
          businessPaymentsApi.getBankAccounts(),
        ]);
        if (cancelled) return;
        setPayouts(Array.isArray(payoutsPayload) ? payoutsPayload : []);
        const defaultBank = (Array.isArray(banksPayload) ? banksPayload : []).find((b) => b.isDefault)
          ?? (Array.isArray(banksPayload) ? banksPayload[0] : undefined);
        const iban = defaultBank?.iban ?? "";
        setBankLast4(iban.length >= 4 ? iban.slice(-4) : undefined);
      } catch (error) {
        if (!cancelled) setStatusMessage(formatApiErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const transfers = useMemo(
    () =>
      [...payouts]
        .sort((a, b) => {
          const aTime = parsePayoutDate(a.arrivalDate ?? a.createdAt)?.getTime() ?? 0;
          const bTime = parsePayoutDate(b.arrivalDate ?? b.createdAt)?.getTime() ?? 0;
          return bTime - aTime;
        })
        .map((payout) => payoutToTransferRow(payout, bankLast4)),
    [payouts, bankLast4]
  );

  const kpi = useMemo(() => {
    const year = now.getFullYear();
    const yearPayouts = payouts.filter((p) => {
      const date = parsePayoutDate(p.arrivalDate ?? p.createdAt);
      return date?.getFullYear() === year && p.status === "paid";
    });
    const yearTotal = yearPayouts.reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const latest = transfers[0];
    const avg = yearPayouts.length ? yearTotal / yearPayouts.length : 0;
    return {
      yearTotal: formatPayoutMoney(yearTotal),
      latestNet: latest?.netto ?? "—",
      yearCount: String(yearPayouts.length),
      avg: formatPayoutMoney(avg),
    };
  }, [payouts, transfers, now]);

  const filteredTransfers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transfers;
    return transfers.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.accredito.toLowerCase().includes(q) ||
        t.lordo.toLowerCase().includes(q) ||
        t.netto.toLowerCase().includes(q),
    );
  }, [transfers, search]);

  const totalPages = Math.max(1, Math.ceil(filteredTransfers.length / perPage));
  const pageRows = useMemo(() => {
    const start = (historyPage - 1) * perPage;
    return filteredTransfers.slice(start, start + perPage);
  }, [filteredTransfers, historyPage]);

  useEffect(() => {
    setHistoryPage(1);
  }, [search]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      const el = helpRef.current;
      if (el && !el.contains(target)) setHelpOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setHelpOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const cells = useMemo(() => padMondayStartCells(view.y, view.m), [view.y, view.m]);
  const eventsForMonth = useMemo(
    () => buildMonthEvents(payouts, view.y, view.m),
    [payouts, view.y, view.m]
  );

  const isToday = (d: Date) =>
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  function prevMonth() {
    setView((v) => {
      const nm = v.m - 1;
      if (nm < 0) return { y: v.y - 1, m: 11 };
      return { y: v.y, m: nm };
    });
  }

  function nextMonth() {
    setView((v) => {
      const nm = v.m + 1;
      if (nm > 11) return { y: v.y + 1, m: 0 };
      return { y: v.y, m: nm };
    });
  }

  const pageNumbers = useMemo(() => {
    const n = totalPages;
    if (n <= 4) return Array.from({ length: n }, (_, i) => i + 1);
    if (historyPage <= 2) return [1, 2, 3, 4];
    if (historyPage >= n - 1) return [n - 3, n - 2, n - 1, n];
    return [historyPage - 1, historyPage, historyPage + 1, historyPage + 2];
  }, [totalPages, historyPage]);

  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
          <DashboardViewHeader
            title="Storico pagamenti"
            backHref="/dashboard/pagamenti"
            backAriaLabel="Torna a Pagamenti"
          />

          <div className="mx-auto w-full max-w-6xl px-4 py-7 lg:px-8">
            {statusMessage ? (
              <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-700">
                {statusMessage}
              </p>
            ) : null}
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Totale ricevuto annuale" value={loading ? "—" : kpi.yearTotal} variant="filled" />
              <KpiCard label="Ultima bonifica ricevuta" value={loading ? "—" : kpi.latestNet} />
              <KpiCard label="Bonifici ricevuti annuale" value={loading ? "—" : kpi.yearCount} />
              <KpiCard label="Importo medio bonifica" value={loading ? "—" : kpi.avg} />
            </section>

            <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
              <div className="rounded-3xl bg-white p-8 text-[#1f2b20] shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-lg font-semibold tracking-tight">Calendario pagamenti</div>
                    <div className="mt-2 text-xs font-regular text-[#9aa39a]">
                      Bonifici programmati e ricevuti
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl  p-1.5">
                    <button
                      type="button"
                      onClick={prevMonth}
                      className="inline-flex bg-[#f3f5f2] size-6 items-center justify-center rounded-sm text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
                      aria-label="Mese precedente"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="bg-[#f3f5f2] px-4 py-1 rounded-sm text-center text-xs font-semibold">
                      {MONTHS[view.m]} {view.y}
                    </span>
                    <button
                      type="button"
                      onClick={nextMonth}
                      className="bg-[#f3f5f2] inline-flex size-6 items-center justify-center rounded-sm text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
                      aria-label="Mese successivo"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-7 gap-2 text-center text-sm font-semibold text-[#6B7280]">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="py-3">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {cells.map(({ date, inMonth }) => {
                    const meta = inMonth ? eventsForMonth[date.getDate()] : undefined;
                    const todayCell = inMonth && isToday(date);

                    let cellClass =
                      "flex min-h-[100px] flex-col items-center justify-start rounded-2xl p-2.5 text-[15px] transition-colors ";
                    if (!inMonth) {
                      cellClass += "text-[#c5cbc4] opacity-50 ";
                    } else {
                      cellClass += "text-[#1f2b20] ";
                    }

                    if (meta?.kind === "received") {
                      cellClass += "bg-[#E8F5E9] border-2 border-[#76C043] ";
                    } else if (meta?.kind === "incoming") {
                      cellClass += "bg-[#EFF6FF] border-2 border-[#93C5FD] ";
                    } else if (meta?.kind === "scheduled") {
                      cellClass += "border-2 border-dashed border-[#9aa39a]/60 bg-[#fafbfa] ";
                    } else if (inMonth) {
                      cellClass += "bg-[#f6f7f6] ";
                    }

                    if (todayCell) {
                      cellClass += "ring-2 ring-[#1f2b20] ring-offset-2 ring-offset-white ";
                    }

                    return (
                      <div
                        key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                        className={cellClass}
                      >
                        <span className="font-semibold tabular-nums">{date.getDate()}</span>
                        {meta ? (
                          <span className="mt-1.5 text-xs font-semibold tabular-nums leading-tight text-center">
                            {meta.amount}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-[black/5] pt-6 text-xs font-regular text-[#6b746c]">
                  <span className="inline-flex items-center gap-2.5">
                    <span className="h-4 w-4 shrink-0 rounded-sm bg-[#22c55e]" aria-hidden />
                    Pagamento ricevuto
                  </span>
                  <span className="inline-flex items-center gap-2.5">
                    <span className="h-4 w-4 shrink-0 rounded-sm bg-[#3b82f6]" aria-hidden />
                    In arrivo
                  </span>
                  <span className="inline-flex items-center gap-2.5">
                    <span
                      className="h-4 w-4 shrink-0 rounded-sm border-2 border-dashed border-[#9aa39a] bg-[#fafbfa]"
                      aria-hidden
                    />
                    Programmato
                  </span>
                  <span className="inline-flex items-center gap-2.5">
                    <span className="h-4 w-4 shrink-0 rounded-sm ring-2 ring-[#1f2b20]" aria-hidden />
                    Oggi
                  </span>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 text-[#1f2b20] shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <div className="text-lg font-semibold tracking-tight">Prossimi pagamenti</div>
                <div className="mt-1 text-xs font-regular text-[#9aa39a]">Bonifici in arrivo</div>

                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-[#eff6ff] p-4 border-2 border-[#93C5FD] ">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full bg-[#dbeafe] px-2 py-1 text-[9px] font-semibold leading-none text-[#3b5bcc]">
                        IN ARRIVO
                      </div>
                      <div className="inline-flex items-center rounded-full  px-2 py-1 text-xs font-semibold leading-none text-[#3b5bcc]">
                        Tra 2 giorni
                      </div>
                    </div>
                    <div className="mt-2 text-lg font-semibold tabular-nums">€8,420.15</div>
                    <div className="mt-1 text-xs text-[#4B5563]">15 Dicembre 2024</div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-[#4B5563]">
                      <ProssimoPagamentoBankIcon className="shrink-0" />
                      Intesa Sanpaolo •••• 3456
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#f6f7f6] p-4 ring-1 ring-black/5">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full bg-[#e8eae8] px-2 py-1 text-[9px] font-semibold leading-none text-[#6b746c]">
                        PROGRAMMATO
                      </div>
                      <div className="inline-flex items-center rounded-full  px-2 py-1 text-xs font-semibold leading-none text-[#6b746c]">
                        22 Dic
                      </div>
                    </div>
                    <div className="mt-2 text-lg font-semibold tabular-nums">€6,800.00</div>
                    <div className="mt-1 text-xs text-[#4B5563]">Vendite 8-14 Dic</div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-[#4B5563]">
                      <ProssimoPagamentoBankIcon className="shrink-0" />
                      Intesa Sanpaolo •••• 3456
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#f6f7f6] p-4 ring-1 ring-black/5">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full bg-[#e8eae8] px-2 py-1 text-[9px] font-semibold leading-none text-[#6b746c]">
                        PROGRAMMATO
                      </div>
                      <div className="inline-flex items-center rounded-full  px-2 py-1 text-xs font-semibold leading-none text-[#6b746c]">
                        29 Dic
                      </div>
                    </div>
                    <div className="mt-2 text-lg font-semibold tabular-nums">€5,200.00</div>
                    <div className="mt-1 text-xs text-[#4B5563]">Vendite 15-21 Dic</div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-[#4B5563]">
                      <ProssimoPagamentoBankIcon className="shrink-0" />
                      Intesa Sanpaolo •••• 3456
                    </div>
                  </div>
                </div>

                <hr className="mt-4 border-0 h-px bg-[#eef1ef]" />

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#4B5563]">Frequenza</div>
                    <div className="mt-1 text-xs text-[#4B5563]">Settimanale — Ogni Venerdì</div>
                  </div>
                  <button
                    type="button"
                    className="text-[10px] font-semibold text-[#16A34A] hover:cursor-pointer hover:underline"
                  >
                    Modifica
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-4 overflow-hidden rounded-3xl bg-[#fafafa] text-[#1f2b20] shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
              <div className="bg-[#fafafa] px-6 pb-5 pt-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <h2 className="shrink-0 text-lg font-semibold tracking-tight text-[#111827]">
                    Storico bonifici ricevuti
                  </h2>
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:w-auto lg:min-w-0">
                    <div className="relative w-full sm:max-w-[280px] lg:w-64 lg:shrink-0">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cerca per data o importo..."
                        className="h-10 w-full rounded-[10px] border border-[#e5e7eb] bg-[#f3f4f6] py-2 pl-10 pr-3 text-[12px] text-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-[#d1d5db] focus:ring-1 focus:ring-[#d1d5db]"
                      />
                    </div>
                    <div className="relative shrink-0">
                      <select
                        className="h-10 w-full min-w-[148px] cursor-pointer appearance-none rounded-[10px] border border-[#e5e7eb] bg-[#f3f4f6] py-2 pl-3 pr-9 text-center text-[12px] font-medium text-[#111827] outline-none hover:bg-[#eef0f2] sm:w-auto"
                        defaultValue="all"
                        aria-label="Filtra per mese"
                      >
                        <option value="all">Tutti i mesi</option>
                        <option value="12">Dicembre 2024</option>
                        <option value="11">Novembre 2024</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#f3f4f6] px-4 text-[12px] font-medium text-[#111827] hover:cursor-pointer hover:bg-[#eef0f2]"
                    >
                      <SlidersHorizontal className="h-4 w-4 text-[#6b7280]" />
                      Filtri
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-[#eef1ef]" />

              <div className="w-full min-w-0">
                <table className="w-full table-fixed border-collapse text-left">
                  <thead className="bg-[#f6f7f6] text-[9px] font-semibold leading-tight tracking-wide text-[#9aa39a] sm:text-[10px]">
                    <tr className="border-b border-black/5">
                      <th className="w-[11%] px-2 py-3 sm:px-3 lg:px-4">ID BONIFICO</th>
                      <th className="w-[15%] px-0 py-3 pr-2 sm:pr-3">DATA ACCREDITO</th>
                      <th className="w-[15%] px-0 py-3 pr-2 sm:pr-3">PERIODO VENDITE</th>
                      <th className="w-[11%] px-0 py-3 pr-2 sm:pr-3">IMPORTO LORDO</th>
                      <th className="w-[13%] px-0 py-3 pr-2 sm:pr-3">COMMISSIONI</th>
                      <th className="w-[11%] px-0 py-3 pr-2 sm:pr-3">IMPORTO NETTO</th>
                      <th className="w-[12%] px-0 py-3 pr-2 sm:pr-3">CONTO</th>
                      <th className="w-[12%] px-2 py-3 text-right sm:px-3 lg:pr-4">AZIONI</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white text-[10px] text-[#1f2b20] sm:text-[11px]">
                    {pageRows.map((t) => {
                      const { dateLine, time } = splitAccreditoCell(t.accredito);
                      const { rangeLine, detail } = splitPeriodoCell(t.periodo);
                      return (
                      <tr key={t.id} className="border-b border-black/5">
                        <td className="min-w-0 break-words px-2 py-4 align-top font-semibold sm:px-3 lg:px-4">
                          {t.id}
                        </td>
                        <td className="min-w-0 break-words py-4 pr-2 align-top sm:pr-3">
                          <div className="font-medium leading-snug text-[#1f2b20]">{dateLine}</div>
                          {time ? (
                            <div className="mt-1 font-medium tabular-nums text-[#6b7280] sm:text-[10px]">
                              {time}
                            </div>
                          ) : null}
                        </td>
                        <td className="min-w-0 break-words py-4 pr-2 align-top sm:pr-3">
                          <div className="font-medium leading-snug text-[#1f2b20]">{rangeLine}</div>
                          {detail ? (
                            <div className="mt-1 font-medium text-[#6b7280] sm:text-[10px]">
                              {detail}
                            </div>
                          ) : null}
                        </td>
                        <td className="min-w-0 break-words py-4 pr-2 align-top font-semibold tabular-nums sm:pr-3">
                          {t.lordo}
                        </td>
                        <td className="min-w-0 break-words py-4 pr-2 align-top sm:pr-3">
                          <div className="font-semibold tabular-nums text-[#b42318]">{t.commissioni}</div>
                          <div className="mt-1 font-medium tabular-nums text-[#6b7280] sm:text-[10px]">
                            {t.commissioniPct}
                          </div>
                          <div className="mt-1 text-[8px] font-medium leading-tight text-[#9ca3af] sm:text-[9px]">
                            Commissioni %
                          </div>
                        </td>
                        <td className="min-w-0 break-words py-4 pr-2 align-top font-bold tabular-nums sm:pr-3">
                          {t.netto}
                        </td>
                        <td className="min-w-0 break-words py-4 pr-2 align-top sm:pr-3">
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5 font-medium text-[#6b746c]">
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ecfce7] text-[#166534] sm:h-8 sm:w-8">
                              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.75} />
                            </span>
                            <span className="min-w-0 break-words">•••• {t.conto}</span>
                          </div>
                        </td>
                        <td className="min-w-0 px-2 py-4 align-top text-right sm:px-3 lg:pr-4">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-lg p-1.5 text-[#1f2b20] hover:cursor-pointer hover:bg-black/5 sm:p-2"
                            aria-label="Scarica documento"
                          >
                            <FileDown className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between bg-[#FFFFFF]">
                <div className="text-[12px] font-regular text-[#6b746c]">
                  Mostrando {(historyPage - 1) * perPage + 1}-
                  {Math.min(historyPage * perPage, filteredTransfers.length)} di{" "}
                  {filteredTransfers.length} bonifici
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage <= 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#6b746c] hover:cursor-pointer hover:bg-black/5 disabled:pointer-events-none disabled:opacity-40"
                    aria-label="Pagina precedente"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  {pageNumbers.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setHistoryPage(p)}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-semibold hover:cursor-pointer ${
                        historyPage === p
                          ? "bg-[#214e3a] text-white"
                          : "border border-black/10 bg-white text-[#1f2b20] hover:bg-black/5"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                    disabled={historyPage >= totalPages}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#6b746c] hover:cursor-pointer hover:bg-black/5 disabled:pointer-events-none disabled:opacity-40"
                    aria-label="Pagina successiva"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </section>
          </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
