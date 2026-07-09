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
import clsx from "clsx";
import { formatApiErrorMessage } from "@/lib/business-auth";
import { formatOrderDate } from "@/lib/business-orders";
import {
  businessPaymentsApi,
  formatPayoutDateShort,
  formatPayoutMoney,
  payoutRelativeLabel,
  type BankAccount,
  type PaymentTransactionRow,
  type PaymentsSummary,
  type Payout,
} from "@/lib/business-payments";
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
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [apiTransactions, setApiTransactions] = useState<PaymentTransactionRow[]>([]);
  const [txnPagination, setTxnPagination] = useState({ page: 1, totalPages: 1 });
  const [fees, setFees] = useState<Record<string, unknown> | null>(null);
  const [timeseries, setTimeseries] = useState<Array<{ month: string; sales: number; earnings: number }>>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  function formatMoney(value: unknown) {
    if (typeof value === "number") {
      return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
    }
    if (typeof value === "string" && value.trim()) return value;
    return "—";
  }

  const transactions = useMemo(() => {
    if (!apiTransactions.length) return [];
    return apiTransactions.flatMap((row, idx) => {
      const order = (row as { order?: { orderNumber?: string } }).order;
      const txs = Array.isArray((row as { transactions?: unknown[] }).transactions)
        ? ((row as { transactions: unknown[] }).transactions as Record<string, unknown>[])
        : [row];

      return txs.map((t, tIdx) => {
        const id =
          (typeof t._id === "string" && t._id) ||
          (typeof t.id === "string" && t.id) ||
          `txn-${idx}-${tIdx}`;
        const createdAt = t.createdAt || t.date || t.timestamp;
        const dateStr = typeof createdAt === "string" ? createdAt : "";
        const amount = t.valueInEur ?? t.amount ?? t.net ?? t.gross ?? t.total;
        const status = (t.status as string) || "";

        return {
          id: String(id),
          date: dateStr ? [formatOrderDate(dateStr), ""] : ["—", ""],
          client: {
            initials: "—",
            name: order?.orderNumber || "—",
          },
          product: order?.orderNumber || "Pagamento ordine",
          amount: formatMoney(amount),
          status: (status.toLowerCase().includes("refund") || status.toLowerCase().includes("rimb"))
            ? ("Rimborsato" as const)
            : ("Completato" as const),
        };
      });
    });
  }, [apiTransactions]);

  const earningsChartData = useMemo(() => {
    const points = timeseries.map((point) => {
      const [, monthNum] = point.month.split("-");
      const label = monthNum
        ? new Intl.DateTimeFormat("it-IT", { month: "short" }).format(
            new Date(2024, Number(monthNum) - 1, 1)
          )
        : point.month;
      return { label, value: Math.round((point.earnings || 0) / 1000) };
    });
    if (earningsRange === "6m") return points.slice(-6);
    if (earningsRange === "30d") return points.slice(-1);
    return points.slice(-12);
  }, [timeseries, earningsRange]);

  const feeRows = useMemo(() => {
    if (!fees) return [];
    const percent = fees.platformFeePercent;
    return [
      {
        label: "Commissioni piattaforma",
        caption: typeof percent === "number" ? `${percent}% sulle vendite` : "Commissione piattaforma",
        value: formatMoney(fees.platformFees),
      },
      {
        label: "Commissioni in sospeso",
        caption: "Da fatturare",
        value: formatMoney(fees.commissionDue),
      },
      {
        label: "Costi Stripe",
        caption: "Gateway di pagamento",
        value: formatMoney(fees.stripeFees ?? 0),
      },
    ];
  }, [fees]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setStatusMessage(null);
      try {
        const [summaryPayload, payoutsPayload, txPayload, feesPayload, tsPayload, banksPayload] =
          await Promise.all([
          businessPaymentsApi.getSummary(),
          businessPaymentsApi.getPayouts(),
          businessPaymentsApi.getTransactions({ page: txnPage, limit: 20 }),
          businessPaymentsApi.getFees(),
          businessPaymentsApi.getTimeseries(),
          businessPaymentsApi.getBankAccounts(),
        ]);
        if (cancelled) return;
        setSummary(summaryPayload);
        setPayouts(Array.isArray(payoutsPayload) ? payoutsPayload : []);
        setApiTransactions(txPayload.items);
        setTxnPagination({
          page: txPayload.pagination.page,
          totalPages: txPayload.pagination.totalPages,
        });
        setFees(feesPayload);
        setTimeseries(Array.isArray(tsPayload.timeseries) ? tsPayload.timeseries : []);
        setBankAccounts(Array.isArray(banksPayload) ? banksPayload : []);
      } catch (error) {
        if (!cancelled) {
          setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [txnPage]);

  async function handleSavePayoutSchedule() {
    setScheduleSaving(true);
    setStatusMessage(null);
    try {
      const interval =
        payFrequency === "monthly"
          ? "monthly"
          : payFrequency === "biweekly"
            ? "biweekly"
            : "weekly";
      await businessPaymentsApi.updatePayoutSchedule({ interval });
      setStatusMessage({ message: "Frequenza pagamenti aggiornata.", tone: "success" });
      setFreqModalOpen(false);
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setScheduleSaving(false);
    }
  }

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
            {statusMessage ? (
              <p
                className={clsx(
                  "mb-4 text-xs font-semibold",
                  statusMessage.tone === "success" ? "text-[#2f6b3c]" : "text-red-600"
                )}
              >
                {statusMessage.message}
              </p>
            ) : null}
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Saldo disponibile"
                value={formatMoney(
                  (summary as { balance?: { available?: number } })?.balance?.available ??
                    (summary as { totalEarnings?: number })?.totalEarnings
                )}
                variant="filled"
              />
              <KpiCard
                label="Vendite totali"
                value={formatMoney((summary as { totalSales?: number })?.totalSales)}
              />
              <KpiCard
                label="Guadagni netti"
                value={formatMoney((summary as { totalEarnings?: number })?.totalEarnings)}
              />
              <KpiCard
                label="Commissioni dovute"
                value={formatMoney((summary as { commissionDue?: number })?.commissionDue)}
              />
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
                  {payouts[0] ? (
                  <div className="rounded-2xl bg-[#eff6ff] p-4 ring-1 ring-black/5">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full bg-[#dbeafe] px-2 py-1 text-[9px] font-semibold leading-none text-[#3b5bcc]">
                        IN ARRIVO
                      </div>
                      <div className="inline-flex items-center rounded-full bg-[#dbeafe] px-2 py-1 text-[9px] font-semibold leading-none text-[#3b5bcc]">
                        {payoutRelativeLabel(payouts[0].arrivalDate)}
                      </div>
                    </div>
                    <div className="mt-2 text-md font-semibold text-[#1f2b20]">
                      {formatPayoutMoney(payouts[0].amount)}
                    </div>
                    <div className="mt-1 text-xs font-regular text-[#9aa39a]">
                      Data prevista: {formatPayoutDateShort(payouts[0].arrivalDate)}
                    </div>
                  </div>
                  ) : (
                    <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
                      <div className="text-xs font-semibold text-[#6b746c]">
                        Nessun bonifico programmato.
                      </div>
                    </div>
                  )}

                  {payouts[1] ? (
                  <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full bg-[#f2f4f2] px-2 py-1 text-[9px] font-semibold leading-none text-[#6b746c]">
                        PROGRAMMATO
                      </div>
                      <div className="inline-flex items-center rounded-full bg-[#f2f4f2] px-2 py-1 text-[9px] font-semibold leading-none text-[#6b746c]">
                        {formatPayoutDateShort(payouts[1].arrivalDate)}
                      </div>
                    </div>
                    <div className="mt-2 text-md font-semibold text-[#1f2b20]">
                      {formatPayoutMoney(payouts[1].amount)}
                    </div>
                    <div className="mt-1 text-xs font-regular text-[#9aa39a]">
                      Data prevista: {formatPayoutDateShort(payouts[1].arrivalDate)}
                    </div>
                  </div>
                  ) : null}
                </div>
                    <hr className="mt-4 border-0 h-[1px] bg-[#F3F4F6] " style={{ backgroundColor: "#F3F4F6" }} />
                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#6b746c]">
                      Frequenza pagamenti
                    </div>
                    <div className="mt-1 text-xs font-regular text-[#9aa39a]">
                      {payFrequency === "weekly"
                        ? "Settimanale"
                        : payFrequency === "biweekly"
                          ? "Bisettimanale"
                          : "Mensile"}{" "}
                      • {payDay ? `Ogni ${payDay}` : ""} • cutoff {payCutoffHour}
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
                  <EarningsChart data={earningsChartData.length ? earningsChartData : [{ label: "—", value: 0 }]} />
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
                    disabled={txnPage <= 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#6b746c] hover:cursor-pointer hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Pagina precedente"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <span className="px-2 text-[12px] font-semibold text-[#6b746c]">
                    Pagina {txnPage} di {txnPagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTxnPage((p) => Math.min(txnPagination.totalPages, p + 1))}
                    disabled={txnPage >= txnPagination.totalPages}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#6b746c] hover:cursor-pointer hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
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
                  {(feeRows.length ? feeRows : [{ label: "Nessun dato", caption: "—", value: "—" }]).map((row) => (
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
                      {formatMoney(fees?.totalCosts)}
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
                  {bankAccounts.length ? (
                    bankAccounts.map((account) => (
                      <div
                        key={account._id}
                        className={`rounded-2xl border px-4 py-5 ${
                          account.isDefault
                            ? "border-[#16A34A]/35 bg-[#f3faef]"
                            : "border-black/10 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#16A34A]">
                            <Building2 className="h-6 w-6 text-white" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-[12px] font-semibold text-[#1f2b20]">
                                  {account.bankName || "Conto bancario"}
                                </div>
                                <div className="mt-1 truncate font-mono text-[10px] font-medium text-[#9aa39a]">
                                  IBAN: {account.iban || "—"}
                                </div>
                                <div className="mt-1 text-[10px] font-semibold text-[#9aa39a]">
                                  {account.accountHolder || "—"}
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                {account._id ? (
                                  <>
                                    <Link
                                      href={`/dashboard/pagamenti/conto/${account._id}/modifica`}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#4b5563] hover:cursor-pointer hover:bg-[#e5e7eb]"
                                      aria-label="Modifica"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Link>
                                    <Link
                                      href={`/dashboard/pagamenti/conto/${account._id}/rimuovi`}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#4b5563] hover:cursor-pointer hover:bg-[#e5e7eb]"
                                      aria-label="Elimina"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Link>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-[#F9FAFB] px-4 py-6 text-center text-[12px] text-[#6b7280]">
                      Nessun conto bancario registrato.
                    </div>
                  )}
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
                      disabled={scheduleSaving}
                      onClick={() => void handleSavePayoutSchedule()}
                      className="inline-flex h-10 items-center rounded-xl bg-[#214e3a] px-4 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {scheduleSaving ? "Salvataggio..." : "Salva impostazioni"}
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
