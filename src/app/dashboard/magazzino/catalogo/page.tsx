"use client";

import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { DashboardViewHeader } from "../../_components/DashboardViewHeader";
import { FormDropdown } from "../../_components/FormDropdown";
import { ProductsTable } from "../../_components/ProductsTable";
import { Sidebar } from "../../_components/Sidebar";
import { ViewTransition } from "../../_components/ViewTransition";
import {
  MAGAZZINO_CATALOG_PAGE_SIZE,
  useMagazzinoInventory,
} from "../useMagazzinoInventory";

function MagazzinoCatalogoContent() {
  const {
    actionLoading,
    batchHref,
    categoryOptions,
    handleBulkPause,
    handleBulkRemove,
    handleGroupVariants,
    inventoryCategory,
    inventoryStatus,
    inventoryStock,
    loading,
    reviews,
    selectedArticleIds,
    setInventoryCategory,
    setInventoryStatus,
    setInventoryStock,
    setSelectedRows,
    statusMessage,
    tableRows,
  } = useMagazzinoInventory();

  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(tableRows.length / MAGAZZINO_CATALOG_PAGE_SIZE));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [inventoryCategory, inventoryStatus, inventoryStock]);

  const rowActionHrefBuilder = useMemo(
    () => (row: { action: string; sku: string }) =>
      row.action === "Rifornisci"
        ? `/dashboard/magazzino/gestione?mode=restock&id=${encodeURIComponent(row.sku)}`
        : `/dashboard/magazzino/gestione?mode=edit&id=${encodeURIComponent(row.sku)}`,
    []
  );

  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
            <DashboardViewHeader
              title="Catalogo magazzino"
              backHref="/dashboard/magazzino"
              backAriaLabel="Torna al magazzino"
              rightExtra={
                <Link
                  href="/dashboard/magazzino/gestione?mode=create"
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#214e3a] px-4 text-[11px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e]"
                >
                  <Plus className="h-4 w-4" />
                  Nuovo prodotto
                </Link>
              }
            />

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

              <div className="rounded-2xl bg-white p-3 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <FormDropdown
                    options={categoryOptions}
                    value={inventoryCategory}
                    onChange={setInventoryCategory}
                    placeholder="Tutte le categorie"
                    aria-label="Filtro categoria catalogo"
                  />
                  <FormDropdown
                    options={[
                      { value: "all", label: "Tutti gli stati" },
                      { value: "attivo", label: "Attivo" },
                      { value: "pausa", label: "In pausa" },
                      { value: "esaurito", label: "Esaurito" },
                    ]}
                    value={inventoryStatus}
                    onChange={setInventoryStatus}
                    placeholder="Tutti gli stati"
                    aria-label="Filtro stato catalogo"
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
                    aria-label="Filtro disponibilità catalogo"
                  />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#16A34A]/15 bg-[#ecfce7] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] font-semibold text-[#1f2b20]">
                    Prodotti selezionati: {selectedArticleIds.length}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
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
                      disabled={selectedArticleIds.length < 2 || actionLoading}
                      onClick={() => void handleGroupVariants()}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-black/5 bg-[#F3F5F7] px-4 text-[11px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Raggruppa varianti
                    </button>
                    <button
                      type="button"
                      disabled={selectedArticleIds.length === 0 || actionLoading}
                      onClick={() => void handleBulkPause()}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-black/5 bg-[#F3F5F7] px-4 text-[11px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Metti in pausa
                    </button>
                    <button
                      type="button"
                      disabled={selectedArticleIds.length === 0 || actionLoading}
                      onClick={() => void handleBulkRemove()}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-black/5 bg-[#F3F5F7] px-4 text-[11px] font-semibold text-[#b42318] hover:cursor-pointer hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {loading ? (
                  <div className="flex items-center justify-center rounded-3xl bg-white py-16 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                    <Loader2 className="h-6 w-6 animate-spin text-[#214e3a]" />
                  </div>
                ) : tableRows.length === 0 ? (
                  <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                    <p className="text-[13px] font-semibold text-[#1f2b20]">
                      Nessun prodotto trovato
                    </p>
                    <p className="mt-2 text-[12px] text-[#6b7280]">
                      Modifica i filtri o aggiungi un nuovo articolo.
                    </p>
                    <Link
                      href="/dashboard/magazzino/gestione?mode=create"
                      className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#214e3a] px-5 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e]"
                    >
                      <Plus className="h-4 w-4" />
                      Nuovo prodotto
                    </Link>
                  </div>
                ) : (
                  <ProductsTable
                    rows={tableRows}
                    selectable
                    onSelectionChange={setSelectedRows}
                    rowActionHrefBuilder={rowActionHrefBuilder}
                    pagination={{
                      page,
                      pageSize: MAGAZZINO_CATALOG_PAGE_SIZE,
                      totalItems: tableRows.length,
                      onPageChange: setPage,
                    }}
                  />
                )}
              </div>

              {reviews.length > 0 ? (
                <section className="mt-6 rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[16px] font-semibold tracking-tight text-[#111827]">
                      Recensioni prodotti
                    </h2>
                    <Link
                      href="/dashboard/magazzino"
                      className="text-[11px] font-semibold text-[#16A34A] hover:cursor-pointer hover:underline"
                    >
                      Vai al magazzino
                    </Link>
                  </div>
                  <p className="mt-2 text-[12px] text-[#6b7280]">
                    {reviews.length} recensioni totali nel magazzino.
                  </p>
                </section>
              ) : null}
            </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}

export default function MagazzinoCatalogoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f5f2]" />}>
      <MagazzinoCatalogoContent />
    </Suspense>
  );
}
