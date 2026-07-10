"use client";

import { Loader2, Plus, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import clsx from "clsx";
import { formatArticleDate, formatEuro } from "@/lib/business-articles";
import { DashboardViewHeader } from "../_components/DashboardViewHeader";
import { FormDropdown } from "../_components/FormDropdown";
import { ProductsTable } from "../_components/ProductsTable";
import { Sidebar } from "../_components/Sidebar";
import { ViewTransition } from "../_components/ViewTransition";
import {
  MAGAZZINO_PREVIEW_LIMIT,
  useMagazzinoInventory,
} from "./useMagazzinoInventory";

function formatInventoryValue(value: number) {
  if (value >= 1000) {
    return `€${(value / 1000).toFixed(1)}K`;
  }
  return formatEuro(value);
}

export default function MagazzinoPage() {
  const {
    actionLoading,
    articlesById,
    categoryOptions,
    handleRemoveReview,
    inventoryCategory,
    inventoryStatus,
    inventoryStock,
    loading,
    reviews,
    setInventoryCategory,
    setInventoryStatus,
    setInventoryStock,
    stats,
    statusMessage,
    tableRows,
  } = useMagazzinoInventory();

  const previewRows = useMemo(
    () => tableRows.slice(0, MAGAZZINO_PREVIEW_LIMIT),
    [tableRows]
  );

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
              title="Magazzino"
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

              <section className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                {[
                  { label: "Prodotti totali", value: String(stats.total) },
                  { label: "Prodotti attivi", value: String(stats.active) },
                  { label: "Esauriti", value: String(stats.outOfStock) },
                  { label: "Scorte basse", value: String(stats.lowStock) },
                  {
                    label: "Valore inventario",
                    value: formatInventoryValue(stats.inventoryValue),
                  },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="rounded-2xl bg-white px-5 py-4 shadow-[0_12px_28px_rgba(16,24,16,0.06)]"
                  >
                    <div className="text-[10px] font-semibold tracking-wide text-[#9aa39a]">
                      {c.label}
                    </div>
                    <div className="mt-1 text-[20px] font-semibold leading-tight text-[#1f2b20]">
                      {loading ? "—" : c.value}
                    </div>
                  </div>
                ))}
              </section>

              <div className="mt-4 rounded-2xl bg-white p-3 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <FormDropdown
                    options={categoryOptions}
                    value={inventoryCategory}
                    onChange={setInventoryCategory}
                    placeholder="Tutte le categorie"
                    aria-label="Filtro categoria magazzino"
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
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-[#6b7280]">
                  Anteprima catalogo · {previewRows.length} di {tableRows.length} prodotti
                </p>
                {tableRows.length > MAGAZZINO_PREVIEW_LIMIT ? (
                  <Link
                    href="/dashboard/magazzino/catalogo"
                    className="text-[11px] font-semibold text-[#16A34A] hover:cursor-pointer hover:underline"
                  >
                    Apri catalogo completo
                  </Link>
                ) : null}
              </div>

              <div className="mt-2">
                {loading ? (
                  <div className="flex items-center justify-center rounded-3xl bg-white py-16 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                    <Loader2 className="h-6 w-6 animate-spin text-[#214e3a]" />
                  </div>
                ) : tableRows.length === 0 ? (
                  <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                    <p className="text-[13px] font-semibold text-[#1f2b20]">
                      Nessun prodotto nel magazzino
                    </p>
                    <p className="mt-2 text-[12px] text-[#6b7280]">
                      Aggiungi il tuo primo articolo per iniziare a vendere.
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
                    rows={previewRows}
                    footerHref="/dashboard/magazzino/catalogo"
                    footerLabel="Visualizza tutto il magazzino"
                    showFooterLink={tableRows.length > MAGAZZINO_PREVIEW_LIMIT}
                    rowActionHrefBuilder={rowActionHrefBuilder}
                  />
                )}
              </div>

              <section className="mt-6 rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[16px] font-semibold tracking-tight text-[#111827]">
                    Recensioni prodotti
                  </h2>
                  <span className="text-[11px] font-semibold text-[#9aa39a]">
                    {reviews.length} totali
                  </span>
                </div>

                {reviews.length === 0 ? (
                  <p className="mt-4 text-[12px] text-[#6b7280]">
                    Nessuna recensione sui tuoi prodotti.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {reviews.map((review) => {
                      const article = articlesById.get(review.articleId);
                      return (
                        <div
                          key={review._id}
                          className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-[#f8faf8] p-4 ring-1 ring-black/5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5 text-[#f59e0b]">
                                {Array.from({ length: 5 }).map((_, index) => (
                                  <Star
                                    key={index}
                                    className={clsx(
                                      "h-3.5 w-3.5",
                                      index < review.rating
                                        ? "fill-current"
                                        : "text-[#d1d5db]"
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="text-[11px] font-semibold text-[#6b7280]">
                                {formatArticleDate(review.createdAt)}
                              </span>
                            </div>
                            <div className="mt-1 text-[13px] font-semibold text-[#111827]">
                              {review.title || "Recensione"}
                            </div>
                            <div className="mt-1 text-[12px] text-[#6b7280]">
                              {review.description || "—"}
                            </div>
                            <div className="mt-2 text-[10px] font-semibold text-[#9aa39a]">
                              Prodotto: {article?.description || review.articleId}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={actionLoading || !review._id}
                            onClick={() => review._id && void handleRemoveReview(review._id)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-black/10 bg-white px-3 text-[11px] font-semibold text-[#b42318] hover:cursor-pointer hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Rimuovi
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
