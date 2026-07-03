"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatApiErrorMessage } from "@/lib/business-auth";
import {
  articleToProductRow,
  businessArticlesApi,
  getVariationCounts,
} from "@/lib/business-articles";
import {
  businessOrdersApi,
  computeOrderDashboardStats,
  getShippingStatuses,
} from "@/lib/business-orders";
import { DashboardViewHeader } from "./_components/DashboardViewHeader";
import { ProductsTable } from "./_components/ProductsTable";
import { Sidebar } from "./_components/Sidebar";
import { ViewTransition } from "./_components/ViewTransition";

function SalesChart({ data }: { data: { day: string; value: number }[] }) {
  // Recharts' ResponsiveContainer can emit size warnings during static generation.
  // Rendering only on the client avoids the build-time width/height (-1) state.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-full w-full" aria-hidden />;

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
      <BarChart data={data} margin={{ top: 10, right: 18, left: 8, bottom: 0 }}>
        <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: "#6b746c", fontSize: 12, fontWeight: 600 }}
          tickLine={false}
          axisLine={{ stroke: "rgba(0,0,0,0.12)" }}
        />
        <YAxis
          tick={{ fill: "#6b746c", fontSize: 12, fontWeight: 600 }}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(v) => `€${v}`}
          domain={[0, "dataMax"]}
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.03)" }}
          contentStyle={{
            borderRadius: 20,
            border: "1px solid rgba(0,0,0,0.10)",
            boxShadow: "0 18px 40px rgba(16,24,16,0.12)",
          }}
          labelStyle={{ fontWeight: 700, color: "#1f2b20" }}
          formatter={(v) => [`€${v}`, "Vendite"]}
        />
        <Bar dataKey="value" fill="#214e3a" radius={[6, 6, 0, 0]} maxBarSize={54} />
      </BarChart>
    </ResponsiveContainer>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
};

function MetricCard({ label, value, loading }: MetricCardProps & { loading?: boolean }) {
  return (
    <div className="rounded-lg  bg-white px-5 py-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
      <div className="text-xs font-medium tracking-wide text-[#6B7280]">
        {label}
      </div>
      <div className="mt-1 text-3xl font-bold leading-tight text-[#1f2b20]">
        {loading ? (
          <Loader2 className="h-7 w-7 animate-spin text-[#214e3a]" />
        ) : (
          value
        )}
      </div>
    </div>
  );
}

type StatusPillProps = {
  children: React.ReactNode;
  tone?: "green" | "red" | "gray";
};

function StatusPill({ children, tone = "green" }: StatusPillProps) {
  const cls =
    tone === "green"
      ? "bg-[#e7f6ea] text-[#2f6b3c]"
      : tone === "red"
        ? "bg-[#fdecec] text-[#b42318]"
        : "bg-[#f2f4f2] text-[#6b746c]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}

export default function DashboardPage() {
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement | null>(null);
  const [rangeOpen, setRangeOpen] = useState(false);
  const rangeRef = useRef<HTMLDivElement | null>(null);
  const [salesRangeDays, setSalesRangeDays] = useState<7 | 30 | 90>(30);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [orderStats, setOrderStats] = useState({
    toShip: 0,
    forPickup: 0,
    inTransit: 0,
    delivered: 0,
    shippedLast7Days: 0,
  });
  const [activeListingsCount, setActiveListingsCount] = useState(0);
  const [productRows, setProductRows] = useState<ReturnType<typeof articleToProductRow>[]>([]);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);

    try {
      const [orders, statuses, articles] = await Promise.all([
        businessOrdersApi.getAll(),
        getShippingStatuses(),
        businessArticlesApi.getListings(),
      ]);

      setOrderStats(computeOrderDashboardStats(orders, statuses));

      const activeArticles = articles.filter((article) => article.isActive);
      setActiveListingsCount(activeArticles.length);

      const variationCounts = getVariationCounts(articles);
      setProductRows(
        activeArticles
          .slice(0, 4)
          .map((article) => articleToProductRow(article, variationCounts))
      );
    } catch (error) {
      console.error("[dashboard]", formatApiErrorMessage(error));
      setOrderStats({
        toShip: 0,
        forPickup: 0,
        inTransit: 0,
        delivered: 0,
        shippedLast7Days: 0,
      });
      setActiveListingsCount(0);
      setProductRows([]);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const orderSummaryRows = useMemo(
    () => [
      { label: "In attesa di spedizione", value: String(orderStats.toShip) },
      { label: "In attesa di ritiro", value: String(orderStats.forPickup) },
      { label: "Spediti (ultimi 7gg)", value: String(orderStats.shippedLast7Days) },
      { label: "Richieste di reso", value: "0" },
    ],
    [orderStats]
  );

  const salesData = useMemo(() => {
    // Placeholder data until wired to real metrics.
    const base = [
      { day: "Lun", value: 1200 },
      { day: "Mar", value: 1900 },
      { day: "Mer", value: 1500 },
      { day: "Gio", value: 2200 },
      { day: "Ven", value: 1800 },
      { day: "Sab", value: 2800 },
      { day: "Dom", value: 2400 },
    ];

    if (salesRangeDays === 7) return base;
    if (salesRangeDays === 30) return base;
    return base;
  }, [salesRangeDays]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;

      const helpEl = helpRef.current;
      if (helpEl && !helpEl.contains(target)) setHelpOpen(false);

      const rangeEl = rangeRef.current;
      if (rangeEl && !rangeEl.contains(target)) setRangeOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setHelpOpen(false);
        setRangeOpen(false);
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
          <DashboardViewHeader title="Panoramica" />

          <div className="mx-auto w-full max-w-6xl px-4 py-7 lg:px-8">

          <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Guadagno totale" value="—" loading={dashboardLoading} />
            <MetricCard
              label="Ordini da spedire"
              value={String(orderStats.toShip)}
              loading={dashboardLoading}
            />
            <MetricCard
              label="Ordini per ritiro"
              value={String(orderStats.forPickup)}
              loading={dashboardLoading}
            />
            <MetricCard
              label="Articoli in vendita"
              value={String(activeListingsCount)}
              loading={dashboardLoading}
            />
          </section>

          <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1.15fr_1fr_1fr]">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
              <div className="flex items-center justify-between">
                <div className="text-md font-semibold text-[#1f2b20]">
                  I tuoi ordini
                </div>
                <Link
                  href="/dashboard/ordini"
                  className="text-xs font-semibold text-[#2f6b3c] hover:cursor-pointer hover:underline"
                >
                  Gestisci ordini
                </Link>
              </div>
              <hr className="mt-2 border-0 h-[1px] bg-[#F3F4F6]" style={{ backgroundColor: "#F3F4F6" }} />
              <div className="mt-4 space-y-3 text-sm">
                {dashboardLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-[#214e3a]" />
                  </div>
                ) : (
                  orderSummaryRows.map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between text-[#6b746c]"
                  >
                    <span>{r.label}</span>
                    <span className="font-semibold text-[#1f2b20]">
                      {r.value}
                    </span>
                  </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
              <div className="flex items-center justify-between">
                <div className="text-md font-semibold text-[#1f2b20]">
                  Novità 3Rate
                </div>
                <a
                  href="https://3rate.net/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#2f6b3c] hover:cursor-pointer hover:underline"
                >
                  &gt;
                </a>
              </div>
                <hr className="mt-2 border-0 h-[1px] bg-[#F3F4F6]" style={{ backgroundColor: "#F3F4F6" }} />
              <div className="mt-4 space-y-3 text-sm">
                <div className="border-l-2 border-[#76C043] pl-2">
                  <div className="text-xs font-regular text-[#9aa39a]">
                    10 Febbraio 2026
                  </div>
                  <div className="mt-1 text-sm font-medium leading-snug text-[#1f2b20]">
                    Aggiornamento commissioni per la categoria Elettronica a partire
                    da Marzo.
                  </div>
                </div>
                <div className="border-l-2 border-[#76C043] pl-2">
                  <div className="text-xs font-regular text-[#9aa39a]">
                    9 Febbraio 2026
                  </div>
                  <div className="mt-1 text-sm font-medium leading-snug text-[#1f2b20]">
                    Aggiornamento documentazione per le categorie Elettronica a
                    partire da Marzo.
                  </div>
                </div>
                <div className="border-l-2 border-[#E5E7EB] pl-2">
                  <div className="text-xs font-regular text-[#9aa39a]">
                    05 Febbraio 2026
                  </div>
                  <div className="mt-1 text-sm font-medium leading-snug text-[#1f2b20]">
                    Nuove funzionalità di spedizione espresso disponibili per tutti
                    i venditori.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
              <div className="flex items-center justify-between">
                <div className="text-md font-semibold text-[#1f2b20]">
                  Ultimi accrediti
                </div>
                <a
                  href="/dashboard/pagamenti/storico"
                  className="text-xs font-semibold text-[#2f6b3c] hover:cursor-pointer hover:underline"
                >
                  Vedi tutti
                </a>
              </div>
              <hr className="mt-2 border-0 h-[1px] bg-[#F3F4F6]" style={{ backgroundColor: "#F3F4F6" }} />
              <div className="mt-4 space-y-3 text-sm">
                {[
                  { name: "Bonifico Klarna", when: "Oggi, 10:30", amount: "+€850.00" },
                  { name: "Bonifico Klarna", when: "Ieri, 14:15", amount: "+€320.50" },
                  { name: "Bonifico Klarna", when: "Ieri, 11:15", amount: "+€170.00" },
                  { name: "Bonifico Klarna", when: "Ieri, 9:15", amount: "+€201.50" },
                ].map((row) => (
                  <div
                    key={`${row.name}-${row.when}`}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DCFCE7] text-[#2f6b3c] ring-1 ring-[#5DBE54]/15">
                        <ChevronDown className="h-4 w-4 text-[#2f6b3c]" />
                   
                      </div>
                      <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs font-semibold text-[#9aa39a]">
                          {row.when}
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold text-[#16A34A]">{row.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1.15fr_1fr_1fr]">
            <div className="rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)] lg:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div className="text-[18px] font-semibold tracking-tight text-[#1f2b20]">
                  Andamento vendite
                </div>

                <div className="relative" ref={rangeRef}>
                  <button
                    type="button"
                    onClick={() => setRangeOpen((v) => !v)}
                    aria-expanded={rangeOpen}
                    aria-haspopup="menu"
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#F3F5F7] px-4 text-[12px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
                  >
                    Ultimi {salesRangeDays} giorni
                    <ChevronDown
                      className={`h-[18px] w-[18px] text-[#6b746c] transition-transform ${rangeOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {rangeOpen ? (
                      <motion.div
                        key="sales-range-menu"
                        role="menu"
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-black/10 bg-white p-2 shadow-[0_18px_40px_rgba(16,24,16,0.12)]"
                      >
                        {([7, 30, 90] as const).map((d) => {
                          const isActive = salesRangeDays === d;
                          return (
                            <button
                              key={d}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setSalesRangeDays(d);
                                setRangeOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12px] font-semibold hover:cursor-pointer hover:bg-black/5 ${isActive ? "bg-black/5 text-[#1f2b20]" : "text-[#1f2b20]"}`}
                            >
                              Ultimi {d} giorni
                              {isActive ? (
                                <span className="text-[11px] text-[#6b746c]">✓</span>
                              ) : null}
                            </button>
                          );
                        })}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>

              <div className="mt-5 h-[280px] w-full">
                <SalesChart data={salesData} />
              </div>
            </div>

            <div className="rounded-2xl bg-[#214e3a] p-5 text-white shadow-[0_12px_28px_rgba(16,24,16,0.08)]">
              <div className="text-lg font-semibold tracking-tight">
                Aggiungi prodotto
              </div>
              <p className="mt-2 text-sm leading-snug text-white/75">
                Scansiona il codice a barre o il QR code del prodotto per
                aggiungerlo immediatamente al tuo inventario.
              </p>

              <div className=" flex items-center justify-center rounded-2xl  ">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl " />
                  <img
                    src="/dashboard/qr.png"
                    alt="QR"
                    className="size-70 object-contain"
                  />
                </div>
              </div>

              <button
                type="button"
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#5DBE54] text-sm font-semibold text-[#14311f] shadow-[0_10px_20px_rgba(0,0,0,0.18)] hover:cursor-pointer hover:bg-[#56b14f] active:translate-y-px"
              >
                Avvia scanner
              </button>
            </div>
          </section>

          <div className="mt-4">
            {dashboardLoading ? (
              <div className="flex items-center justify-center rounded-3xl bg-white py-16 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <Loader2 className="h-6 w-6 animate-spin text-[#214e3a]" />
              </div>
            ) : productRows.length === 0 ? (
              <div className="rounded-3xl bg-white px-6 py-12 text-center shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <p className="text-[13px] font-semibold text-[#1f2b20]">
                  Nessun articolo in vendita
                </p>
                <Link
                  href="/dashboard/magazzino/gestione?mode=create"
                  className="mt-3 inline-flex text-[12px] font-semibold text-[#2f6b3c] hover:cursor-pointer hover:underline"
                >
                  Aggiungi il primo prodotto
                </Link>
              </div>
            ) : (
              <ProductsTable
                rows={productRows}
                footerHref="/dashboard/magazzino"
                rowActionHrefBuilder={(row) =>
                  row.action === "Rifornisci"
                    ? `/dashboard/magazzino/gestione?mode=restock&id=${encodeURIComponent(row.sku)}`
                    : `/dashboard/magazzino/gestione?mode=edit&id=${encodeURIComponent(row.sku)}`
                }
              />
            )}
          </div>

          <section className="mt-4 rounded-2xl bg-[#214e3a] p-5 text-white shadow-[0_12px_28px_rgba(16,24,16,0.08)] sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              <div className="min-w-0">
                <div className="text-xl font-semibold leading-tight sm:text-2xl">
                  Hai bisogno di aiuto con la tua vetrina?
                </div>
                <div className="mt-2 max-w-xl text-sm leading-snug text-white/75 sm:text-base">
                  Il nostro team di supporto venditori è disponibile per aiutarti con
                  configurazioni, pagamenti e gestione ordini.
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 p-1 sm:flex-row lg:w-auto lg:shrink-0 lg:items-center">
                <button
                  type="button"
                  className="inline-flex h-10 w-full items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#214e3a] hover:cursor-pointer hover:bg-white/90 sm:w-auto md:text-base"
                >
                  Chat supporto
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 w-full items-center justify-center rounded-full bg-white/10 px-6 text-sm font-semibold text-white ring-1 ring-white/15 hover:cursor-pointer hover:bg-white/15 sm:w-auto md:text-base"
                >
                  Guide & FAQ
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
