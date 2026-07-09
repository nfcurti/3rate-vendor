import { buildQuery, type PaginatedResult, unwrapPaginated } from "./api-pagination";
import { formatApiErrorMessage, getBusinessAuthToken, payohRequest } from "./business-auth";
import type { ArticleListing } from "./business-articles";

export type BusinessArticle = ArticleListing;

export type BusinessOrderItem = {
  articleId: string;
  quantity: number;
};

export type BusinessOrder = {
  _id?: string;
  clientAccountId: string;
  businessAccountId: string;
  orderItems: BusinessOrderItem[];
  orderNumber: string;
  shippingStatusId: string;
  trackingId?: string | null;
  clientShippingAddressId: string;
  shippingOptionId: string;
  paymentOrderId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ShippingAddress = {
  _id?: string;
  fullAddress?: string;
  cap?: string;
  city?: string;
  province?: string;
  region?: string;
};

export type EnrichedOrderClient = {
  displayName?: string;
  account?: { email?: string };
  info?: { name?: string; lastName?: string };
};

export type EnrichedOrderListItem = {
  order: BusinessOrder;
  client?: EnrichedOrderClient | null;
  shippingAddress?: ShippingAddress | null;
  shippingStatus?: ShippingStatus | null;
};

export type EnrichedOrderDetail = EnrichedOrderListItem & {
  tracking?: Record<string, unknown> | null;
  paymentOrder?: Record<string, unknown> | null;
  transactions?: Record<string, unknown>[];
  articles?: BusinessArticle[];
};

export type BusinessReturnRecord = {
  return: Record<string, unknown>;
  order?: BusinessOrder | null;
  articles?: BusinessArticle[];
};

export type ShippingStatus = {
  _id?: string;
  name: string;
  code: string;
  message: string;
};

export type TrackingProvider = {
  _id?: string;
  name: string;
  code: string;
};

export type UpdateTrackingInput = {
  orderId: string;
  trackingProviderId: string;
  trackingNumber: string;
  shippingDate: string;
};

const withToken = () => {
  const token = getBusinessAuthToken();
  if (!token) throw new Error("Sessione scaduta. Accedi di nuovo.");
  return token;
};

export const SHIPPING_STATUS_TAB_MAP: Record<
  string,
  | "Attesa ritiro"
  | "Da spedire"
  | "In transito"
  | "Consegnati"
  | null
> = {
  waiting: "Attesa ritiro",
  preparing: "Da spedire",
  sent: "In transito",
  received: "Consegnati",
};

export const businessOrdersApi = {
  getAll: async (params?: { page?: number; limit?: number }, token?: string) => {
    const payload = await payohRequest<PaginatedResult<EnrichedOrderListItem>>(
      `/business/order/get_all${buildQuery({
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
      })}`,
      undefined,
      token ?? withToken(),
      "GET"
    );
    return unwrapPaginated(payload);
  },
  getOne: (orderId: string, token?: string) =>
    payohRequest<EnrichedOrderDetail>(
      `/business/order/get_one?orderId=${encodeURIComponent(orderId)}`,
      undefined,
      token ?? withToken(),
      "GET"
    ),
  getReturns: async (params?: { page?: number; limit?: number }, token?: string) => {
    const payload = await payohRequest<BusinessReturnRecord[] | PaginatedResult<BusinessReturnRecord>>(
      `/business/order/get_returns${buildQuery({
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
      })}`,
      undefined,
      token ?? withToken(),
      "GET"
    );
    return unwrapPaginated(payload);
  },
  createReturn: (
    input: { orderId: string; items: Array<Record<string, unknown>>; reason?: string },
    token?: string
  ) =>
    payohRequest<Record<string, unknown>>(
      "/business/order/create_return",
      input,
      token ?? withToken()
    ),
  updateShippingStatus: (
    orderId: string,
    shippingStatusId: string,
    token?: string
  ) =>
    payohRequest<BusinessOrder>(
      "/business/order/update_shipping_status",
      { orderId, shippingStatusId },
      token ?? withToken()
    ),
  updateTracking: (input: UpdateTrackingInput, token?: string) =>
    payohRequest<{ order: BusinessOrder }>(
      "/business/order/update_tracking",
      input,
      token ?? withToken()
    ),
  markAsReceived: (orderId: string, token?: string) =>
    payohRequest<BusinessOrder>(
      "/business/order/update_shipping_status_as_received",
      { orderId },
      token ?? withToken()
    ),
  getTrackingProviders: (token?: string) =>
    payohRequest<TrackingProvider[]>(
      "/business/trackingprovider/get",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  getListings: (token?: string) =>
    payohRequest<BusinessArticle[]>(
      "/business/article/get_listings",
      undefined,
      token ?? withToken(),
      "GET"
    ),
};

export async function getShippingStatuses(): Promise<ShippingStatus[]> {
  const token = withToken();

  try {
    return await payohRequest<ShippingStatus[]>(
      "/business/shipping_statuses",
      undefined,
      token,
      "GET"
    );
  } catch {
    const response = await fetch("/api/business/shipping-statuses", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      payload?: ShippingStatus[];
    };

    if (!response.ok || data.error) {
      throw new Error(formatApiErrorMessage(new Error(data.error ?? "STATUSES_FAILED")));
    }

    return Array.isArray(data.payload) ? data.payload : [];
  }
}

export function extractOrdersFromList(items: EnrichedOrderListItem[]): BusinessOrder[] {
  return items.map((item) => item.order).filter(Boolean);
}

export function getClientDisplayName(
  client?: EnrichedOrderClient | null,
  fallback = "Cliente"
) {
  if (!client) return fallback;
  if (client.displayName?.trim()) return client.displayName;
  if (client.account?.email) return client.account.email;
  return fallback;
}

export function formatShippingAddress(address?: ShippingAddress | null) {
  if (!address) return "—";
  const line = [address.fullAddress, address.cap, address.city, address.province]
    .filter(Boolean)
    .join(", ");
  return line || "—";
}

export function getShippingStatusById(
  statuses: ShippingStatus[],
  statusId?: string | null
) {
  if (!statusId) return undefined;
  return statuses.find((status) => status._id === statusId);
}

export function getShippingStatusByCode(statuses: ShippingStatus[], code: string) {
  return statuses.find((status) => status.code === code);
}

export function formatOrderDate(value?: string) {
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

export function getArticlePrice(article?: BusinessArticle) {
  if (!article) return 0;
  return article.discountedPrice ?? article.originalPrice ?? 0;
}

export function getOrderTotal(
  order: BusinessOrder,
  articlesById: Map<string, BusinessArticle>
) {
  return order.orderItems.reduce((sum, item) => {
    const article = articlesById.get(item.articleId);
    return sum + getArticlePrice(article) * item.quantity;
  }, 0);
}

export type OrderDashboardStats = {
  toShip: number;
  forPickup: number;
  inTransit: number;
  delivered: number;
  shippedLast7Days: number;
};

export function computeOrderDashboardStats(
  orders: BusinessOrder[],
  statuses: ShippingStatus[]
): OrderDashboardStats {
  const statusById = new Map(
    statuses.flatMap((status) => (status._id ? [[status._id, status.code] as const] : []))
  );

  const getCode = (order: BusinessOrder) => statusById.get(order.shippingStatusId);
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const isWithinLast7Days = (order: BusinessOrder) => {
    const timestamp = order.updatedAt ?? order.createdAt;
    if (!timestamp) return false;
    return new Date(timestamp).getTime() >= sevenDaysAgo;
  };

  return {
    toShip: orders.filter((order) => getCode(order) === "preparing").length,
    forPickup: orders.filter((order) => getCode(order) === "waiting").length,
    inTransit: orders.filter((order) => getCode(order) === "sent").length,
    delivered: orders.filter((order) => getCode(order) === "received").length,
    shippedLast7Days: orders.filter((order) => {
      const code = getCode(order);
      return (code === "sent" || code === "received") && isWithinLast7Days(order);
    }).length,
  };
}
