"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Sidebar } from "../_components/Sidebar";
import { DashboardViewHeader } from "../_components/DashboardViewHeader";
import { ViewTransition } from "../_components/ViewTransition";

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
        className={`text-[10px] font-semibold tracking-wide ${
          isFilled ? "text-white/70" : "text-[#9aa39a]"
        }`}
      >
        {label}
      </div>
      <div className="mt-1 text-[20px] font-semibold leading-tight">{value}</div>
    </div>
  );
}

function EarningsChart({ data }: { data: { label: string; value: number }[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-full w-full" aria-hidden />;

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
      <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#9aa39a", fontSize: 10, fontWeight: 600 }}
          tickLine={false}
          axisLine={{ stroke: "rgba(0,0,0,0.10)" }}
        />
        <YAxis
          tick={{ fill: "#9aa39a", fontSize: 10, fontWeight: 600 }}
          tickLine={false}
          axisLine={false}
          width={36}
          tickFormatter={(v) => `${v}k`}
        />
        <Tooltip
          cursor={{ stroke: "rgba(0,0,0,0.08)" }}
          contentStyle={{
            borderRadius: 16,
            border: "1px solid rgba(0,0,0,0.10)",
            boxShadow: "0 18px 40px rgba(16,24,16,0.12)",
          }}
          labelStyle={{ fontWeight: 700, color: "#1f2b20" }}
          formatter={(v) => [`€${v}k`, "Guadagni"]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#214e3a"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

type TxnStatus = "Completato" | "Rimborsato";

function TxnStatusPill({ status }: { status: TxnStatus }) {
  const cls =
    status === "Completato"
      ? "bg-[#ecfce7] text-[#166534]"
      : "bg-[#fee2e2] text-[#b42318]";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold ${cls}`}>
      {status}
    </span>
  );
}

export default function PagamentiPage() {
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement | null>(null);
  const [earningsRange, setEarningsRange] = useState<"12m" | "6m" | "30d">("12m");
  const [txnPage, setTxnPage] = useState(1);
  const [openTxnMenuId, setOpenTxnMenuId] = useState<string | null>(null);
  const [freqModalOpen, setFreqModalOpen] = useState(false);
  const [payFrequency, setPayFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [payDay, setPayDay] = useState("venerdi");
  const [payCutoffHour, setPayCutoffHour] = useState("18:00");

  const transactions = useMemo(
    () => [
      {
        id: "#3R-8841Q205",
        date: ["12 Dic 2024", "12:32"],
        client: { initials: "MR", name: "Marco Rossi" },
        product: "Cuffie Wireless Pro",
        amount: "€149.99",
        status: "Completato" as const,
      },
      {
        id: "#3R-8841Q199",
        date: ["12 Dic 2024", "11:05"],
        client: { initials: "GB", name: "Giulia Bianchi" },
        product: "Smart Watch Extreme",
        amount: "€89.20",
        status: "Completato" as const,
      },
      {
        id: "#3R-8841Q156",
        date: ["11 Dic 2024", "16:18"],
        client: { initials: "LV", name: "Luca Verdi" },
        product: "Speaker Bluetooth",
        amount: "€59.99",
        status: "Completato" as const,
      },
      {
        id: "#3R-8841Q132",
        date: ["10 Dic 2024", "15:23"],
        client: { initials: "SF", name: "Sara Ferrari" },
        product: "Tablet 10\" Multimediale",
        amount: "€129.00",
        status: "Completato" as const,
      },
      {
        id: "#3R-8841Q098",
        date: ["09 Dic 2024", "20:31"],
        client: { initials: "AC", name: "Andrea Conti" },
        product: "Mouse Gaming Wireless",
        amount: "€79.99",
        status: "Rimborsato" as const,
      },
      {
        id: "#3R-8841Q067",
        date: ["08 Dic 2024", "18:11"],
        client: { initials: "EM", name: "Elena Marino" },
        product: "Webcam HD 1080p",
        amount: "€49.90",
        status: "Completato" as const,
      },
    ],
    [],
  );

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      const el = helpRef.current;
      if (el && !el.contains(target)) setHelpOpen(false);
      if (target instanceof Element && !target.closest("[data-txn-menu-root]")) {
        setOpenTxnMenuId(null);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setHelpOpen(false);
        setOpenTxnMenuId(null);
        setFreqModalOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
          <DashboardViewHeader title="Pagamenti & guadagni" />

          <div className="mx-auto w-full max-w-6xl px-4 py-7 lg:px-8">
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Saldo disponibile" value="€24,856.40" variant="filled" />
              <KpiCard label="Pagamenti in sospeso" value="€8,420.15" />
              <KpiCard label="Guadagni mensili" value="€45,320.80" />
              <KpiCard label="Valore medio ordine" value="€117.05" />
            </section>

            <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_2fr]">
              <div className="rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <div className="flex flex-col items-start justify-between ">
                  
                    <div className="flex w-full items-center justify-between">
                        <div className="text-lg font-semibold tracking-tight text-[#1f2b20]">
                          Calendario pagamenti  
                        </div>

                      <Link
                        href="/dashboard/pagamenti/storico"
                        className="text-[10px] font-semibold text-[#16A34A] hover:cursor-pointer hover:underline"
                      >
                        Vedi tutti
                      </Link>
                    </div>
                    <div className="mt-1 text-xs font-regular text-[#9aa39a]">
                      Prossimi bonifici programmati
                    </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-[#eff6ff] p-4 ring-1 ring-black/5">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full bg-[#dbeafe] px-2 py-1 text-[9px] font-semibold leading-none text-[#3b5bcc]">
                        IN ARRIVO
                      </div>
                      <div className="inline-flex items-center rounded-full bg-[#dbeafe] px-2 py-1 text-[9px] font-semibold leading-none text-[#3b5bcc]">
                        Domani
                      </div>
                    </div>
                    <div className="mt-2 text-md font-semibold text-[#1f2b20]">
                      €4,420.15
                    </div>
                    <div className="mt-1 text-xs font-regular text-[#9aa39a]">
                      Data prevista: 30 Dicembre 2024
                    </div>
                    <div className="mt-2 text-xs font-regular text-[#9aa39a]">
                      Intesa Sanpaolo • 3456
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full bg-[#f2f4f2] px-2 py-1 text-[9px] font-semibold leading-none text-[#6b746c]">
                        PROGRAMMATO
                      </div>
                      <div className="inline-flex items-center rounded-full bg-[#f2f4f2] px-2 py-1 text-[9px] font-semibold leading-none text-[#6b746c]">
                        22 Dicembre
                      </div>
                    </div>
                    <div className="mt-2 text-md font-semibold text-[#1f2b20]">
                      €400.00
                    </div>
                    <div className="mt-1 text-xs font-regular text-[#9aa39a]">
                      Data prevista: 22 Dicembre 2024
                    </div>
                    <div className="mt-2 text-xs font-regular text-[#9aa39a]">
                      Intesa Sanpaolo • 3456
                    </div>
                  </div>
                </div>
                    <hr className="mt-4 border-0 h-[1px] bg-[#F3F4F6] " style={{ backgroundColor: "#F3F4F6" }} />
                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#6b746c]">
                      Frequenza pagamenti
                    </div>
                    <div className="mt-1 text-xs font-regular text-[#9aa39a]">
                      Settimanale • Ogni Venerdì
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFreqModalOpen(true)}
                    className="text-[10px] font-semibold text-[#16A34A] hover:cursor-pointer hover:underline"
                  >
                    Modifica
                  </button>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-lg font-semibold tracking-tight text-[#1f2b20]">
                    Andamento guadagni
                  </div>
                  <div className="flex items-center gap-2">
                    {[
                      { k: "12m", label: "12 Mesi" },
                      { k: "6m", label: "6 Mesi" },
                      { k: "30d", label: "30 Giorni" },
                    ].map((x) => {
                      const isActive = earningsRange === (x.k as typeof earningsRange);
                      return (
                        <button
                          key={x.k}
                          type="button"
                          onClick={() => setEarningsRange(x.k as typeof earningsRange)}
                          className={`inline-flex h-8 items-center justify-center rounded-lg px-3 text-[10px] font-semibold hover:cursor-pointer ${
                            isActive
                              ? "bg-[#214e3a] text-white"
                              : "border border-black/5 bg-[#F3F5F7] text-[#1f2b20] hover:bg-black/5"
                          }`}
                        >
                          {x.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 h-[220px] w-full">
                  <EarningsChart
                    data={
                      earningsRange === "12m"
                        ? [
                            { label: "Gen", value: 10 },
                            { label: "Feb", value: 12 },
                            { label: "Mar", value: 11 },
                            { label: "Apr", value: 13 },
                            { label: "Mag", value: 14 },
                            { label: "Giu", value: 13 },
                            { label: "Lug", value: 15 },
                            { label: "Ago", value: 16 },
                            { label: "Set", value: 15 },
                            { label: "Ott", value: 17 },
                            { label: "Nov", value: 18 },
                            { label: "Dic", value: 19 },
                          ]
                        : earningsRange === "6m"
                          ? [
                              { label: "Lug", value: 15 },
                              { label: "Ago", value: 16 },
                              { label: "Set", value: 15 },
                              { label: "Ott", value: 17 },
                              { label: "Nov", value: 18 },
                              { label: "Dic", value: 19 },
                            ]
                          : [
                              { label: "1", value: 11 },
                              { label: "6", value: 12 },
                              { label: "12", value: 13 },
                              { label: "18", value: 14 },
                              { label: "24", value: 15 },
                              { label: "30", value: 16 },
                            ]
                    }
                  />
                </div>
              </div>
            </section>

            <section className="mt-4 overflow-hidden rounded-3xl bg-white shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
              <div className="px-6 pt-6">
                <div className="text-lg font-semibold tracking-tight text-[#1f2b20]">
                  Storico transazioni
                </div>
              </div>
              <div className="mt-4 h-px w-full bg-[#eef1ef]" />

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left">
                  <thead className="bg-[#f6f7f6] text-[10px] font-semibold tracking-wide text-[#9aa39a]">
                    <tr className="border-b border-black/5">
                      <th className="px-6 py-4">ID TRANSAZIONE</th>
                      <th className="py-4 pr-4">DATA</th>
                      <th className="py-4 pr-4">CLIENTE</th>
                      <th className="py-4 pr-4">PRODOTTO</th>
                      <th className="py-4 pr-4">IMPORTO</th>
                      <th className="py-4 pr-4">STATO</th>
                      <th className="py-4 pr-6 text-right">AZIONI</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] text-[#1f2b20]">
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b border-black/5">
                        <td className="px-6 py-5 align-top text-[11px] font-semibold text-[#1f2b20]">
                          {t.id}
                        </td>
                        <td className="py-5 pr-4 align-top">
                          <div className="text-[10px] font-regular text-[#1f2b20]">
                            {t.date[0]}
                          </div>
                          <div className="mt-1 text-[10px] font-semibold text-[#9aa39a]">
                            {t.date[1]}
                          </div>
                        </td>
                        <td className="py-5 pr-4 align-top">
                          <div className="flex items-center gap-3">
                            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#ecfce7] text-[10px] font-bold text-[#166534] ring-1 ring-[#16A34A]/15">
                              {t.client.initials}
                            </div>
                            <div className="text-[11px] font-semibold text-[#1f2b20]">
                              {t.client.name}
                            </div>
                          </div>
                        </td>
                        <td className="py-5 pr-4 align-top text-[11px] font-regular text-[#1f2b20]">
                          {t.product}
                        </td>
                        <td className="py-5 pr-4 align-top text-[11px] font-semibold text-[#1f2b20]">
                          {t.amount}
                        </td>
                        <td className="py-5 pr-4 align-top">
                          <TxnStatusPill status={t.status} />
                        </td>
                        <td className="py-5 pr-6 align-top text-right">
                          <div className="relative inline-flex" data-txn-menu-root>
                            <button
                              type="button"
                              onClick={() =>
                                setOpenTxnMenuId((v) => (v === t.id ? null : t.id))
                              }
                              className="inline-flex items-center justify-center p-0 text-[#1f2b20] hover:cursor-pointer"
                              aria-label="Azioni"
                              aria-expanded={openTxnMenuId === t.id}
                              aria-haspopup="menu"
                            >
                              <MoreVertical className="h-4 w-4" strokeWidth={2.5} />
                            </button>

                            <AnimatePresence>
                              {openTxnMenuId === t.id ? (
                                <motion.div
                                  key={`txn-menu-${t.id}`}
                                  role="menu"
                                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                  transition={{ duration: 0.14, ease: "easeOut" }}
                                  className="absolute right-0 top-6 z-20 w-32 overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-[0_18px_40px_rgba(16,24,16,0.12)]"
                                >
                                  <button
                                    type="button"
                                    role="menuitem"
                                    className="flex w-full items-center px-3 py-2 text-left text-[12px] font-semibold text-[#b42318] hover:cursor-pointer hover:bg-[#fff5f5]"
                                  >
                                    Rimuovi
                                  </button>
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-6 bg-[#f6f7f6]">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setTxnPage((p) => Math.max(1, p - 1))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg   text-[#6b746c] hover:cursor-pointer hover:bg-black/5"
                    aria-label="Pagina precedente"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                  </button>

                  {[1, 2, 3].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTxnPage(p)}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-semibold hover:cursor-pointer ${
                        txnPage === p
                          ? "bg-[#214e3a] text-white"
                          : "border border-black/10  text-[#1f2b20] hover:bg-black/5"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <div className="px-1 text-[12px] font-semibold text-[#9aa39a]">…</div>

                  <button
                    type="button"
                    onClick={() => setTxnPage(370)}
                    className={`inline-flex h-9 w-12 items-center justify-center rounded-lg text-[11px] font-semibold hover:cursor-pointer ${
                      txnPage === 370
                        ? "bg-[#214e3a] text-white"
                        : "border border-black/10  text-[#1f2b20] hover:bg-black/5"
                    }`}
                  >
                    370
                  </button>

                  <button
                    type="button"
                    onClick={() => setTxnPage((p) => Math.min(370, p + 1))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl   text-[#6b746c] hover:cursor-pointer hover:bg-black/5"
                    aria-label="Pagina successiva"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)] ring-1 ring-black/5">
                <div className="text-lg font-semibold tracking-tight text-[#1f2b20]">
                  Commissioni &amp; costi
                </div>
                <div className="mt-1 text-xs font-regular text-[#9aa39a]">
                  Breakdown mensile
                </div>

                <div className="mt-5 space-y-2">
                  {[
                    {
                      label: "Commissioni Klarna",
                      caption: "2.5% per transazione",
                      value: "€1,133.02",
                    },
                    {
                      label: "Commissioni Gateway",
                      caption: "1.2% per transazione",
                      value: "€428.23",
                    },
                    {
                      label: "Costi spedizione",
                      caption: "Spedizione standard",
                      value: "€312.48",
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-4 rounded-xl bg-[#F9FAFB] px-4 py-3 "
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#1f2b20]">
                          {row.label}
                        </div>
                        <div className="mt-0.5 text-xs font-regular text-[#9aa39a]">
                          {row.caption}
                        </div>
                      </div>
                      <div className="shrink-0 text-[sm] font-bold tabular-nums text-[#1f2b20]">
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-xl border-2 border-[#76C043] bg-[#76C043]/10 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-[#166534]">
                        Totale Costi
                      </div>
                      <div className="mt-0.5 text-xs font-regular text-[#9aa39a]">
                        Questo mese
                      </div>
                    </div>
                    <div className="shrink-0 text-[sm] font-bold tabular-nums text-[#1f2b20]">
                      €1,873.73
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)] ring-1 ring-black/5">
                <div className="text-lg font-semibold tracking-tight text-[#1f2b20]">
                  Metodi di pagamento
                </div>
                <div className="mt-1 text-xs font-regular text-[#9aa39a]">
                  Gestisci i tuoi conti bancari
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-[#16A34A]/35 bg-[#f3faef] px-4 py-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#16A34A]">
                        <Building2 className="h-6 w-6 text-white" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[12px] font-semibold text-[#1f2b20]">
                              Intesa Sanpaolo
                            </div>
                            <div className="mt-1 truncate font-mono text-[10px] font-medium text-[#9aa39a]">
                              IBAN: IT60 X054 2811 1010 0000 0123 456
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#16A34A]">
                                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                Verificato
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#9aa39a]">
                                <Calendar className="h-3.5 w-3.5" />
                                Aggiunto il 15 Gen 2024
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-3">
                            <div className="flex items-center gap-1">
                              <Link
                                href="/dashboard/pagamenti/conto/intesa-sanpaolo/modifica"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#4b5563] hover:cursor-pointer hover:bg-[#e5e7eb]"
                                aria-label="Modifica"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                              <Link
                                href="/dashboard/pagamenti/conto/intesa-sanpaolo/rimuovi"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#4b5563] hover:cursor-pointer hover:bg-[#e5e7eb]"
                                aria-label="Elimina"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Link>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-3 py-1 text-[9px] font-semibold text-[#166534] ring-1 ring-[#16A34A]/25">
                              Principale
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white px-4 py-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#16A34A]">
                        <Building2 className="h-6 w-6 text-white" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[12px] font-semibold text-[#1f2b20]">
                              UniCredit
                            </div>
                            <div className="mt-1 truncate font-mono text-[10px] font-medium text-[#9aa39a]">
                              IBAN: IT23 Y030 0203 2800 0000 0123 456
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#16A34A]">
                                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                Verificato
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#9aa39a]">
                                <Calendar className="h-3.5 w-3.5" />
                                Aggiunto il 15 Gen 2024
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Link
                              href="/dashboard/pagamenti/conto/unicredit/modifica"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#4b5563] hover:cursor-pointer hover:bg-[#e5e7eb]"
                              aria-label="Modifica"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <Link
                              href="/dashboard/pagamenti/conto/unicredit/rimuovi"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#4b5563] hover:cursor-pointer hover:bg-[#e5e7eb]"
                              aria-label="Elimina"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  href="/dashboard/pagamenti/conto/nuovo"
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#214e3a] text-[11px] font-semibold text-white hover:cursor-pointer hover:bg-[#1c4332]"
                >
                  Aggiungi conto
                </Link>
              </div>
            </section>
          </div>

          <AnimatePresence>
            {freqModalOpen ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4"
                onClick={() => setFreqModalOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-5 shadow-[0_24px_60px_rgba(16,24,16,0.2)]"
                  onClick={(e) => e.stopPropagation()}
                  data-payment-frequency-modal
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[16px] font-semibold tracking-tight text-[#111827]">
                      Modifica frequenza pagamenti
                    </h3>
                    <button
                      type="button"
                      onClick={() => setFreqModalOpen(false)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] hover:cursor-pointer hover:bg-black/5"
                      aria-label="Chiudi modal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-1 text-[12px] text-[#6b7280]">
                    Configura quando vuoi ricevere gli accrediti.
                  </p>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                        Frequenza
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { k: "weekly", l: "Settimanale" },
                          { k: "biweekly", l: "Quindicinale" },
                          { k: "monthly", l: "Mensile" },
                        ].map((opt) => {
                          const active = payFrequency === opt.k;
                          return (
                            <button
                              key={opt.k}
                              type="button"
                              onClick={() =>
                                setPayFrequency(opt.k as "weekly" | "biweekly" | "monthly")
                              }
                              className={`inline-flex h-10 items-center justify-center rounded-xl border text-[11px] font-semibold transition-colors ${
                                active
                                  ? "border-[#214e3a] bg-[#214e3a] text-white"
                                  : "border-black/10 bg-[#F9FAFB] text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
                              }`}
                            >
                              {opt.l}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                          Giorno pagamento
                        </label>
                        <select
                          value={payDay}
                          onChange={(e) => setPayDay(e.target.value)}
                          className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] text-[#1f2b20] outline-none focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                        >
                          <option value="lunedi">Lunedì</option>
                          <option value="mercoledi">Mercoledì</option>
                          <option value="venerdi">Venerdì</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                          Cut-off ordini
                        </label>
                        <input
                          value={payCutoffHour}
                          onChange={(e) => setPayCutoffHour(e.target.value)}
                          className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] text-[#1f2b20] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setFreqModalOpen(false)}
                      className="inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-[12px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
                    >
                      Annulla
                    </button>
                    <button
                      type="button"
                      onClick={() => setFreqModalOpen(false)}
                      className="inline-flex h-10 items-center rounded-xl bg-[#214e3a] px-4 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e]"
                    >
                      Salva impostazioni
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
