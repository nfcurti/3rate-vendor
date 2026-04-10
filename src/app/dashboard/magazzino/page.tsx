"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardViewHeader } from "../_components/DashboardViewHeader";
import { Sidebar } from "../_components/Sidebar";
import { FormDropdown } from "../_components/FormDropdown";
import { demoProductsRows, ProductsTable } from "../_components/ProductsTable";
import { ViewTransition } from "../_components/ViewTransition";

export default function MagazzinoPage() {
  const [inventoryCategory, setInventoryCategory] = useState("all");
  const [inventoryStatus, setInventoryStatus] = useState("all");
  const [inventoryStock, setInventoryStock] = useState("all");
  const [extraFilter, setExtraFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<(typeof demoProductsRows)[number][]>([]);
  const inventoryRows = useMemo(() => [...demoProductsRows, ...demoProductsRows], []);

  const batchHref = useMemo(() => {
    const skus = selectedRows.map((row) => row.sku);
    if (skus.length === 0) return "";
    return `/dashboard/magazzino/gestione?mode=batch&skus=${encodeURIComponent(skus.join(","))}`;
  }, [selectedRows]);

  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
          <DashboardViewHeader title="Magazzino" />

          <div className="mx-auto w-full max-w-6xl px-4 py-7 lg:px-8">
            <section className="grid grid-cols-1 gap-3 lg:grid-cols-5">
              {[
                { label: "Prodotti totali", value: "342" },
                { label: "Prodotti attivi", value: "318" },
                { label: "Esauriti", value: "12" },
                { label: "Scorte basse", value: "11" },
                { label: "Valore inventario", value: "€89.2K" },
              ].map((c) => (
                <div
                  key={c.label}
                  className="rounded-2xl bg-white px-5 py-4 shadow-[0_12px_28px_rgba(16,24,16,0.06)]"
                >
                  <div className="text-[10px] font-semibold tracking-wide text-[#9aa39a]">
                    {c.label}
                  </div>
                  <div className="mt-1 text-[20px] font-semibold leading-tight text-[#1f2b20]">
                    {c.value}
                  </div>
                </div>
              ))}
            </section>

            <div className="mt-4 rounded-2xl bg-white p-3 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <FormDropdown
                  options={[
                    { value: "all", label: "Tutte le categorie" },
                    { value: "elettronica", label: "Elettronica" },
                    { value: "casa", label: "Casa" },
                  ]}
                  value={inventoryCategory}
                  onChange={setInventoryCategory}
                  placeholder="Tutte le categorie"
                  aria-label="Filtro categoria magazzino"
                />
                <FormDropdown
                  options={[
                    { value: "all", label: "Tutti gli stati" },
                    { value: "attivo", label: "Attivo" },
                    { value: "esaurito", label: "Esaurito" },
                  ]}
                  value={inventoryStatus}
                  onChange={setInventoryStatus}
                  placeholder="Tutti gli stati"
                  aria-label="Filtro stato magazzino"
                />
                <FormDropdown
                  options={[
                    { value: "all", label: "Disponibilità Stock" },
                    { value: "in", label: "In stock" },
                    { value: "low", label: "Scorte basse" },
                    { value: "out", label: "Esauriti" },
                  ]}
                  value={inventoryStock}
                  onChange={setInventoryStock}
                  placeholder="Disponibilità Stock"
                  aria-label="Filtro disponibilità magazzino"
                />
                <FormDropdown
                  options={[
                    { value: "all", label: "Altri filtri" },
                    { value: "high_value", label: "Alto valore" },
                    { value: "recent", label: "Aggiunti di recente" },
                  ]}
                  value={extraFilter}
                  onChange={setExtraFilter}
                  placeholder="Altri filtri"
                  aria-label="Altri filtri magazzino"
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#16A34A]/15 bg-[#ecfce7] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] font-semibold text-[#1f2b20]">
                  Prodotti selezionati: {selectedRows.length}
                </div>

                <div className="flex items-center gap-2">
                  {batchHref ? (
                    <Link
                      href={batchHref}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-black/5 bg-[#F3F5F7] px-4 text-[11px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
                    >
                      Modifica in blocco
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-black/5 bg-[#F3F5F7] px-4 text-[11px] font-semibold text-[#9aa39a]"
                    >
                      Modifica in blocco
                    </button>
                  )}
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-black/5 bg-[#F3F5F7] px-4 text-[11px] font-semibold text-[#b42318] hover:cursor-pointer hover:bg-black/5"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <ProductsTable
                rows={inventoryRows}
                title=""
                selectable
                pagination={{ totalPages: 43 }}
                onSelectionChange={setSelectedRows}
                rowActionHrefBuilder={(row) =>
                  row.action === "Rifornisci"
                    ? `/dashboard/magazzino/gestione?mode=restock&sku=${encodeURIComponent(row.sku)}`
                    : `/dashboard/magazzino/gestione?mode=edit&sku=${encodeURIComponent(row.sku)}`
                }
              />
            </div>
          </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
