import { getBusinessAuthToken, payohRequest } from "./business-auth";
import type { ProductCategory } from "./business-info";
import type { ProductRow } from "@/app/dashboard/_components/ProductsTable";

export type ArticleListing = {
  _id?: string;
  imagesUrls: string[];
  categoryIds: string[];
  businessAccountId: string;
  shippingOptionIds: string[];
  description: string;
  originalPrice: number;
  discountedPrice?: number;
  totalStock: number;
  availableStock: number;
  colors: string[];
  size: string;
  isActive: boolean;
  articleWithVariationGroupId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ArticleReview = {
  _id?: string;
  articleId: string;
  clientAccountId: string;
  rating: number;
  title?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ShippingOption = {
  _id?: string;
  name: string;
  code: string;
  extra?: number;
};

export type CreateListingInput = {
  description: string;
  originalPrice: number;
  totalStock: number;
  categoryIds: string[];
  shippingOptionIds: string[];
  discountedPrice?: number;
  imagesUrls?: string[];
  colors?: string[];
  size?: string;
};

export type UpdateListingInput = {
  articleId: string;
  description?: string;
  originalPrice?: number;
  discountedPrice?: number;
  totalStock?: number;
  availableStock?: number;
  categoryIds?: string[];
  shippingOptionIds?: string[];
  imagesUrls?: string[];
  colors?: string[];
  size?: string;
  isActive?: boolean;
};

const withToken = () => {
  const token = getBusinessAuthToken();
  if (!token) throw new Error("Sessione scaduta. Accedi di nuovo.");
  return token;
};

export const businessArticlesApi = {
  getListings: (token?: string) =>
    payohRequest<ArticleListing[]>(
      "/business/article/get_listings",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  getCategories: (token?: string) =>
    payohRequest<ProductCategory[]>(
      "/business/article/get_categories",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  createListing: (input: CreateListingInput, token?: string) =>
    payohRequest<ArticleListing>(
      "/business/article/create_listing",
      input,
      token ?? withToken()
    ),
  updateListing: (input: UpdateListingInput, token?: string) =>
    payohRequest<ArticleListing>(
      "/business/article/update_listing",
      input,
      token ?? withToken()
    ),
  pauseListing: (articleId: string, token?: string) =>
    payohRequest<ArticleListing>(
      "/business/article/pause_listing",
      { articleId },
      token ?? withToken()
    ),
  removeListing: (articleId: string, token?: string) =>
    payohRequest<{ message: string }>(
      "/business/article/remove_listing",
      { articleId },
      token ?? withToken()
    ),
  updateConnectedArticles: (
    articleIds: string[],
    variationGroupId?: string,
    token?: string
  ) =>
    payohRequest<{ variationGroupId: string }>(
      "/business/article/update_connected_articles",
      { articleIds, ...(variationGroupId ? { variationGroupId } : {}) },
      token ?? withToken()
    ),
  seeReviews: (token?: string) =>
    payohRequest<ArticleReview[]>(
      "/business/article/see_reviews",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  removeReview: (reviewId: string, token?: string) =>
    payohRequest<{ message: string }>(
      "/business/article/remove_review",
      { reviewId },
      token ?? withToken()
    ),
};

export async function getShippingOptions(): Promise<ShippingOption[]> {
  const token = getBusinessAuthToken();
  if (!token) throw new Error("Sessione scaduta. Accedi di nuovo.");

  const response = await fetch("/api/business/shipping-options", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as {
    result?: boolean;
    payload?: ShippingOption[];
    error?: string;
  };

  if (!response.ok || data.error || !data.payload) {
    throw new Error(data.error || "Impossibile caricare le opzioni di spedizione.");
  }

  return data.payload;
}

export function formatArticleDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatEuro(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function getArticlePrice(article?: Pick<ArticleListing, "discountedPrice" | "originalPrice">) {
  if (!article) return 0;
  return article.discountedPrice ?? article.originalPrice ?? 0;
}

export function getVariationCounts(articles: ArticleListing[]) {
  const counts = new Map<string, number>();
  articles.forEach((article) => {
    const groupId = article.articleWithVariationGroupId;
    if (!groupId) return;
    counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
  });
  return counts;
}

export function articleToProductRow(
  article: ArticleListing,
  variationCounts: Map<string, number>
): ProductRow {
  const articleId = article._id ?? "";
  const isOutOfStock = article.availableStock <= 0;
  const status = !article.isActive
    ? ({ status: "PAUSA" as const, tone: "red" as const })
    : isOutOfStock
      ? ({ status: "ESAURITO" as const, tone: "red" as const })
      : ({ status: "ATTIVO" as const, tone: "green" as const });

  const groupId = article.articleWithVariationGroupId;
  const variantCount = groupId ? variationCounts.get(groupId) ?? 0 : 0;
  const price = getArticlePrice(article);

  return {
    ...status,
    when: ["Creato:", formatArticleDate(article.createdAt)],
    name: article.description,
    asin: articleId ? articleId.slice(-8).toUpperCase() : "—",
    sku: articleId,
    variants: variantCount > 1 ? `+${variantCount - 1} Varianti` : undefined,
    imageUrl: article.imagesUrls?.[0],
    perf: [
      ["Vendite:", "—"],
      ["Unità vendute:", "—"],
      ["Visualizzazioni:", "—"],
      ["Rank:", "—"],
    ],
    inv: [
      ["Disponibili:", String(article.availableStock)],
      ["Totale stock", String(article.totalStock)],
      ["Taglia", article.size || "—"],
    ],
    ship: [
      ["Prezzo:", formatEuro(price)],
      ["Listino:", formatEuro(article.originalPrice)],
      ["Spedizione:", `${article.shippingOptionIds.length} opz.`],
    ],
    total: ["Totale:", formatEuro(price), "(IVA esclusa)"],
    action: isOutOfStock && article.isActive ? "Rifornisci" : "Modifica",
  };
}

export function computeInventoryStats(articles: ArticleListing[]) {
  const active = articles.filter((a) => a.isActive);
  const outOfStock = articles.filter((a) => a.availableStock <= 0);
  const lowStock = articles.filter(
    (a) => a.isActive && a.availableStock > 0 && a.availableStock <= 5
  );
  const inventoryValue = articles.reduce(
    (sum, article) => sum + getArticlePrice(article) * article.availableStock,
    0
  );

  return {
    total: articles.length,
    active: active.length,
    outOfStock: outOfStock.length,
    lowStock: lowStock.length,
    inventoryValue,
  };
}
