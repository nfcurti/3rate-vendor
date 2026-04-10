"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown, CircleHelp, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardViewHeader } from "../_components/DashboardViewHeader";
import { FormDropdown } from "../_components/FormDropdown";
import { Sidebar } from "../_components/Sidebar";
import { ViewTransition } from "../_components/ViewTransition";

type OrderStatus =
  | "Attesa ritiro"
  | "Da spedire"
  | "In transito"
  | "Consegnati"
  | "Annullato";

function StatusPill({ status }: { status: OrderStatus }) {
  const cls =
    status === "Attesa ritiro"
      ? "bg-[#eef2ff] text-[#3b5bcc]"
      : status === "Da spedire"
        ? "bg-[#e7f6ea] text-[#2f6b3c]"
        : status === "In transito"
          ? "bg-[#fff7ed] text-[#b45309]"
          : status === "Consegnati"
            ? "bg-[#ecfce7] text-[#166534]"
            : "bg-[#fee2e2] text-[#b42318]";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold ${cls}`}>
      {status}
    </span>
  );
}

export default function OrdiniPage() {
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<
    "Tutti gli Ordini" | "Attesa ritiro" | "Da spedire" | "In transito" | "Consegnati" | "Resi/Annullati"
  >("Tutti gli Ordini");

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

  const tabs = useMemo(() => {
    const list: Array<{
      key:
        | "Tutti gli Ordini"
        | "Attesa ritiro"
        | "Da spedire"
        | "In transito"
        | "Consegnati"
        | "Resi/Annullati";
      label: string;
      count: string;
      tone?: string;
    }> = [
      { key: "Tutti gli Ordini", label: "Tutti gli Ordini", count: "1,847" },
      { key: "Attesa ritiro", label: "Attesa ritiro", count: "23", tone: "text-[#3b5bcc] bg-[#eef2ff]" },
      { key: "Da spedire", label: "Da spedire", count: "18", tone: "text-[#1E3A8A] bg-[#EFF6FF]" },
      { key: "In transito", label: "In transito", count: "67", tone: "text-[##A16207] bg-[#FCFCDC]" },
      { key: "Consegnati", label: "Consegnati", count: "1,742", tone: "text-[#166534] bg-[#ecfce7]" },
      { key: "Resi/Annullati", label: "Resi/Annullati", count: "15", tone: "text-[#b42318] bg-[#fee2e2]" },
    ];
    return list;
  }, []);

  const orders = useMemo(
    () => [
      {
        id: "#3R-40281",
        when: ["RIF. ORD - 2024-1867", "15 Mag 2024 14:30 PM"],
        client: { name: "Marco Rossi", email: "marco.rossi@email.it", city: "Milano, IT" },
        products: [
          { name: "Cuffie Wireless Pro", sku: "3R-9921-BLK", price: "€79.00" },
          { name: "Auricolari Air Buds", sku: "3R-5582-WHT", price: "€258.00" },
        ],
        status: "Attesa ritiro" as const,
        total: "€341.99",
        actions: ["Elabora", "Dettagli"] as const,
      },
      {
        id: "#3R-40280",
        when: ["RIF. ORD - 2024-1867", "15 Mag 2024 14:30 PM"],
        client: { name: "Giulio Bianchi", email: "g.bianchi@email.it", city: "Roma, IT" },
        products: [{ name: "Smart Watch Ultra", sku: "3R-8402-ORG", price: "€249.00" }],
        status: "In transito" as const,
        total: "€258.99",
        actions: ["Dettagli"] as const,
      },
      {
        id: "#3R-40279",
        when: ["RIF. ORD - 2024-1867", "15 Mag 2024 14:30 PM"],
        client: { name: "Luca Ferrari", email: "luca.ferrari.it", city: "Torino, IT" },
        products: [{ name: "Macchina Caffè Barista Pro", sku: "3R-1120-SS", price: "€1,099.00" }],
        status: "Consegnati" as const,
        total: "€1,118.99",
        actions: ["Dettagli"] as const,
      },
      {
        id: "#3R-40278",
        when: ["RIF. ORD - 2024-1867", "15 Mag 2024 14:30 PM"],
        client: { name: "Sofia Conti", email: "sofia.c@email.it", city: "Napoli, IT" },
        products: [{ name: "Cuffie Wireless Pro", sku: "3R-9921-BLK", price: "€237.00" }],
        status: "Da spedire" as const,
        total: "€237.00",
        actions: ["Spedisci", "Dettagli"] as const,
      },
      {
        id: "#3R-40277",
        when: ["RIF. ORD - 2024-1867", "15 Mag 2024 14:30 PM"],
        client: { name: "Alessandro Moretti", email: "a.moretti@email.it", city: "Firenze, IT" },
        products: [{ name: "Auricolari Air Buds", sku: "3R-5582-WHT", price: "€129.00" }],
        status: "Annullato" as const,
        total: "€133.99",
        actions: ["Dettagli"] as const,
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
          <DashboardViewHeader title="Ordini" />

          <div className="mx-auto w-full max-w-6xl px-4 py-7 lg:px-8">
            <div className="rounded-xl bg-white p-3 shadow-[0_12px_28px_rgba(16,24,16,0.06)] ring-1 ring-black/5 lg:hidden">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9aa39a]">
                Filtra ordini
              </div>
              <div className="mt-2">
                <FormDropdown
                  aria-label="Seleziona tab ordini"
                  placeholder="Seleziona stato ordini"
                  options={tabs.map((t) => ({
                    value: t.key,
                    label: `${t.label} (${t.count})`,
                  }))}
                  value={activeTab}
                  onChange={(value) =>
                    setActiveTab(
                      value as
                        | "Tutti gli Ordini"
                        | "Attesa ritiro"
                        | "Da spedire"
                        | "In transito"
                        | "Consegnati"
                        | "Resi/Annullati",
                    )
                  }
                />
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#f6f7f6] px-3 py-1.5">
                <span className="text-[11px] font-semibold text-[#1f2b20]">
                  {tabs.find((t) => t.key === activeTab)?.label}
                </span>
                <span
                  className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${
                    tabs.find((t) => t.key === activeTab)?.tone ?? "text-[#1f2b20]"
                  }`}
                >
                  {tabs.find((t) => t.key === activeTab)?.count}
                </span>
              </div>
            </div>

            <div className="hidden rounded-xl bg-white px-3 shadow-[0_12px_28px_rgba(16,24,16,0.06)] ring-1 ring-black/5 lg:block">
              <div className="flex flex-nowrap items-stretch gap-2 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {tabs.map((t) => {
                  const isActive = activeTab === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setActiveTab(t.key)}
                      className={`inline-flex shrink-0 items-center gap-2 px-4 py-2 text-[11px] font-semibold hover:cursor-pointer border-b-2 ${
                        isActive
                          ? " text-[#1f2b20]"
                          : "border-transparent text-[#6b746c] hover:bg-black/5"
                      }`}
                    >
                      {t.label}
                      <span
                        className={`inline-flex items-center justify-center rounded-full   px-2 py-1 text-[10px] font-semibold leading-none ${t.tone ?? "text-[#1f2b20]"}`}
                      >
                        {t.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#16A34A]/15 bg-[#ecfce7] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-[11px] font-semibold text-[#1f2b20]">
                  <input type="checkbox" className="h-4 w-4 rounded border-black/20 bg-white" />
                  Seleziona tutti gli ordini visibili
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  {["Segna come spedito", "Segna come ritirato", "Invia Email"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-black/5 bg-[#F3F5F7] px-4 text-[11px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <section className="mt-4 overflow-hidden rounded-3xl bg-white shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] text-left">
                  <thead className="bg-[#f6f7f6] text-[10px] font-semibold tracking-wide text-[#9aa39a]">
                    <tr className="border-b border-black/5">
                      <th className="w-[44px] px-6 py-4">
                        <input type="checkbox" className="h-4 w-4 rounded border-black/10" />
                      </th>
                      <th className="py-4 pr-4">DETTAGLI</th>
                      <th className="py-4 pr-4">CLIENTE</th>
                      <th className="py-4 pr-4">PRODOTTI</th>
                      <th className="py-4 pr-4">STATO</th>
                      <th className="py-4 pr-4">TOTALE</th>
                      <th className="py-4 pr-6 text-right">AZIONI</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] text-[#1f2b20]">
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-black/5">
                        <td className="w-[44px] px-6 py-6 align-top">
                          <input type="checkbox" className="h-4 w-4 rounded border-black/10" />
                        </td>

                        <td className="py-6 pr-4 align-top">
                          <div className="text-[12px] font-semibold text-[#1f2b20]">{o.id}</div>
                          <div className="mt-2 space-y-1 text-[10px] font-semibold text-[#9aa39a]">
                            <div>{o.when[0]}</div>
                            <div>{o.when[1]}</div>
                          </div>
                        </td>

                        <td className="py-6 pr-4 align-top">
                          <div className="text-[12px] font-semibold text-[#1f2b20]">{o.client.name}</div>
                          <div className="mt-1 text-[10px] font-semibold text-[#9aa39a]">{o.client.email}</div>
                          <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[#9aa39a]">
                            <MapPin className="h-3.5 w-3.5 text-[#c0c6c0]" />
                            {o.client.city}
                          </div>
                        </td>

                        <td className="py-6 pr-4 align-top">
                          <div className="space-y-3">
                            {o.products.map((p) => (
                              <div key={`${o.id}-${p.sku}`} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-9 w-9 rounded-xl bg-[#f2f4f2] ring-1 ring-black/5" />
                                  <div className="min-w-0">
                                    <div className="truncate text-[11px] font-semibold text-[#1f2b20]">
                                      {p.name}
                                    </div>
                                    <div className="text-[10px] font-semibold text-[#9aa39a]">
                                      SKU: {p.sku}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-[11px] font-semibold text-[#1f2b20]">{p.price}</div>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="py-6 pr-4 align-top">
                          <StatusPill status={o.status} />
                          {o.status === "In transito" ? (
                            <div className="mt-2 text-[10px] font-semibold text-[#9aa39a]">Track: 1Y2657…</div>
                          ) : null}
                        </td>

                        <td className="py-6 pr-4 align-top">
                          <div className="text-[12px] font-semibold text-[#1f2b20]">{o.total}</div>
                        </td>

                        <td className="py-6 pr-6 align-top text-right">
                          <div className="flex flex-col items-end gap-2">
                            {o.actions.map((a) => (
                              a === "Dettagli" ? (
                                <Link
                                  key={`${o.id}-${a}`}
                                  href={`/dashboard/ordini/dettagli/${encodeURIComponent(o.id.replace("#", ""))}`}
                                  className="inline-flex h-7 items-center justify-center rounded-lg border border-black/10 bg-white px-3 text-[11px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
                                >
                                  {a}
                                </Link>
                              ) : (
                                <button
                                  key={`${o.id}-${a}`}
                                  type="button"
                                  className="inline-flex h-7 items-center justify-center rounded-lg bg-[#214e3a] px-3 text-[11px] font-semibold text-white hover:cursor-pointer hover:bg-[#1c4332]"
                                >
                                  {a}
                                </button>
                              )
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-6">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-[#6b746c] hover:cursor-pointer hover:bg-black/5"
                    aria-label="Pagina precedente"
                  >
                    ‹
                  </button>

                  {[1, 2, 3].map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-[11px] font-semibold hover:cursor-pointer ${
                        p === 1
                          ? "bg-[#214e3a] text-white"
                          : "border border-black/10 bg-white text-[#1f2b20] hover:bg-black/5"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <div className="px-1 text-[12px] font-semibold text-[#9aa39a]">…</div>

                  <button
                    type="button"
                    className="inline-flex h-9 w-12 items-center justify-center rounded-xl border border-black/10 bg-white text-[11px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
                  >
                    370
                  </button>

                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-[#6b746c] hover:cursor-pointer hover:bg-black/5"
                    aria-label="Pagina successiva"
                  >
                    ›
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
