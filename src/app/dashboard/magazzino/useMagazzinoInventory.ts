"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatApiErrorMessage } from "@/lib/business-auth";
import {
  articleToProductRow,
  buildCategoryNameMap,
  businessArticlesApi,
  computeInventoryStats,
  getVariationCounts,
  type ArticleAnalyticsEntry,
  type ArticleListing,
  type ArticleReview,
} from "@/lib/business-articles";
import type { ProductCategory } from "@/lib/business-info";
import type { ProductRow } from "../_components/ProductsTable";

export const MAGAZZINO_PREVIEW_LIMIT = 8;
export const MAGAZZINO_CATALOG_PAGE_SIZE = 20;

export function filterMagazzinoArticles(
  articles: ArticleListing[],
  inventoryCategory: string,
  inventoryStatus: string,
  inventoryStock: string
) {
  return articles.filter((article) => {
    if (inventoryCategory !== "all" && !article.categoryIds.includes(inventoryCategory)) {
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
}

export function useMagazzinoInventory() {
  const [articles, setArticles] = useState<ArticleListing[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [reviews, setReviews] = useState<ArticleReview[]>([]);
  const [analyticsByArticleId, setAnalyticsByArticleId] = useState<
    Record<string, ArticleAnalyticsEntry>
  >({});
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
      const [listings, categoriesPayload, reviewsPayload, analyticsPayload] = await Promise.all([
        businessArticlesApi.getListings(),
        businessArticlesApi.getCategories(),
        businessArticlesApi.seeReviews(),
        businessArticlesApi.getAnalytics(),
      ]);

      setArticles(listings);
      setCategories(categoriesPayload);
      setReviews(reviewsPayload);
      setAnalyticsByArticleId(
        (analyticsPayload as { byArticleId?: Record<string, ArticleAnalyticsEntry> }).byArticleId ??
          {}
      );
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

  const filteredArticles = useMemo(
    () =>
      filterMagazzinoArticles(articles, inventoryCategory, inventoryStatus, inventoryStock),
    [articles, inventoryCategory, inventoryStatus, inventoryStock]
  );

  const variationCounts = useMemo(() => getVariationCounts(articles), [articles]);

  const categoryNamesById = useMemo(() => buildCategoryNameMap(categories), [categories]);

  const tableRows = useMemo(
    () =>
      filteredArticles.map((article) =>
        articleToProductRow(article, variationCounts, analyticsByArticleId, categoryNamesById)
      ),
    [filteredArticles, variationCounts, analyticsByArticleId, categoryNamesById]
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

  return {
    articles,
    articlesById,
    actionLoading,
    analyticsByArticleId,
    batchHref,
    categoryOptions,
    filteredArticles,
    handleBulkPause,
    handleBulkRemove,
    handleGroupVariants,
    handleRemoveReview,
    inventoryCategory,
    inventoryStatus,
    inventoryStock,
    loadInventory,
    loading,
    reviews,
    selectedArticleIds,
    selectedRows,
    setInventoryCategory,
    setInventoryStatus,
    setInventoryStock,
    setSelectedRows,
    stats,
    statusMessage,
    tableRows,
  };
}
