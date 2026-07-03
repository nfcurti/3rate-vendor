"use client";

import { Loader2, Plus, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { formatApiErrorMessage } from "@/lib/business-auth";
import {
  articleToProductRow,
  businessArticlesApi,
  computeInventoryStats,
  formatArticleDate,
  formatEuro,
  getShippingOptions,
  getVariationCounts,
  type ArticleListing,
  type ArticleReview,
} from "@/lib/business-articles";
import type { ProductCategory } from "@/lib/business-info";
import { DashboardViewHeader } from "../_components/DashboardViewHeader";
import { FormDropdown } from "../_components/FormDropdown";
import { ProductsTable, type ProductRow } from "../_components/ProductsTable";
import { Sidebar } from "../_components/Sidebar";
import { ViewTransition } from "../_components/ViewTransition";

function formatInventoryValue(value: number) {
  if (value >= 1000) {
    return `€${(value / 1000).toFixed(1)}K`;
  }
  return formatEuro(value);
}

export default function MagazzinoPage() {
  const [articles, setArticles] = useState<ArticleListing[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [reviews, setReviews] = useState<ArticleReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);

  const [inventoryCategory, setInventoryCategory] = useState("all");
  const [inventoryStatus, setInventoryStatus] = useState("all");
  const [inventoryStock, setInventoryStock] = useState("all");
  const [selectedRows, setSelectedRows] = useState<ProductRow[]>([]);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      const [listings, categoriesPayload, reviewsPayload] = await Promise.all([
        businessArticlesApi.getListings(),
        businessArticlesApi.getCategories(),
        businessArticlesApi.seeReviews(),
      ]);

      setArticles(listings);
      setCategories(categoriesPayload);
      setReviews(reviewsPayload);
      setSelectedRows([]);
    } catch (error) {
      setStatusMessage({
        message: formatApiErrorMessage(error),
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const stats = useMemo(() => computeInventoryStats(articles), [articles]);

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "Tutte le categorie" },
      ...categories.map((category) => ({
        value: category._id ?? "",
        label: category.name || "Categoria",
      })),
    ],
    [categories]
  );

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      if (
        inventoryCategory !== "all" &&
        !article.categoryIds.includes(inventoryCategory)
      ) {
        return false;
      }

      if (inventoryStatus === "attivo" && !article.isActive) return false;
      if (inventoryStatus === "pausa" && article.isActive) return false;
      if (inventoryStatus === "esaurito" && article.availableStock > 0) return false;

      if (inventoryStock === "in" && article.availableStock <= 0) return false;
      if (inventoryStock === "low" && (article.availableStock <= 0 || article.availableStock > 5)) {
        return false;
      }
      if (inventoryStock === "out" && article.availableStock > 0) return false;

      return true;
    });
  }, [articles, inventoryCategory, inventoryStatus, inventoryStock]);

  const variationCounts = useMemo(() => getVariationCounts(articles), [articles]);

  const tableRows = useMemo(
    () => filteredArticles.map((article) => articleToProductRow(article, variationCounts)),
    [filteredArticles, variationCounts]
  );

  const articlesById = useMemo(() => {
    const map = new Map<string, ArticleListing>();
    articles.forEach((article) => {
      if (article._id) map.set(article._id, article);
    });
    return map;
  }, [articles]);

  const selectedArticleIds = useMemo(
    () => selectedRows.map((row) => row.sku).filter(Boolean),
    [selectedRows]
  );

  const batchHref = useMemo(() => {
    if (selectedArticleIds.length === 0) return "";
    return `/dashboard/magazzino/gestione?mode=batch&ids=${encodeURIComponent(selectedArticleIds.join(","))}`;
  }, [selectedArticleIds]);

  async function handleBulkPause() {
    if (selectedArticleIds.length === 0) return;
    setActionLoading(true);
    setStatusMessage(null);
    try {
      await Promise.all(
        selectedArticleIds.map((id) => businessArticlesApi.pauseListing(id))
      );
      await loadInventory();
      setStatusMessage({
        message: `${selectedArticleIds.length} prodotti messi in pausa.`,
        tone: "success",
      });
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkRemove() {
    if (selectedArticleIds.length === 0) return;
    if (!window.confirm(`Eliminare ${selectedArticleIds.length} prodotti selezionati?`)) return;

    setActionLoading(true);
    setStatusMessage(null);
    try {
      await Promise.all(
        selectedArticleIds.map((id) => businessArticlesApi.removeListing(id))
      );
      await loadInventory();
      setStatusMessage({
        message: `${selectedArticleIds.length} prodotti eliminati.`,
        tone: "success",
      });
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGroupVariants() {
    if (selectedArticleIds.length < 2) {
      setStatusMessage({
        message: "Seleziona almeno 2 prodotti per raggrupparli come varianti.",
        tone: "error",
      });
      return;
    }

    setActionLoading(true);
    setStatusMessage(null);
    try {
      await businessArticlesApi.updateConnectedArticles(selectedArticleIds);
      await loadInventory();
      setStatusMessage({
        message: "Varianti raggruppate correttamente.",
        tone: "success",
      });
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemoveReview(reviewId: string) {
    setActionLoading(true);
    setStatusMessage(null);
    try {
      await businessArticlesApi.removeReview(reviewId);
      setReviews((prev) => prev.filter((review) => review._id !== reviewId));
      setStatusMessage({ message: "Recensione rimossa.", tone: "success" });
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setActionLoading(false);
    }
  }

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

              <div className="mt-4 rounded-2xl border border-[#16A34A]/15 bg-[#ecfce7] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] font-semibold text-[#1f2b20]">
                    Prodotti selezionati: {selectedRows.length}
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
                    rows={tableRows}
                    title=""
                    selectable
                    onSelectionChange={setSelectedRows}
                    rowActionHrefBuilder={(row) =>
                      row.action === "Rifornisci"
                        ? `/dashboard/magazzino/gestione?mode=restock&id=${encodeURIComponent(row.sku)}`
                        : `/dashboard/magazzino/gestione?mode=edit&id=${encodeURIComponent(row.sku)}`
                    }
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
