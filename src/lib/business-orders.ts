import { getBusinessAuthToken, payohRequest } from "./business-auth";
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
  getAll: (token?: string) =>
    payohRequest<BusinessOrder[]>(
      "/business/order/get_all",
      undefined,
      token ?? withToken(),
      "GET"
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
  const token = getBusinessAuthToken();
  if (!token) throw new Error("Sessione scaduta. Accedi di nuovo.");

  const response = await fetch("/api/business/shipping-statuses", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as {
    result?: boolean;
    payload?: ShippingStatus[];
    error?: string;
  };

  if (!response.ok || data.error || !data.payload) {
    throw new Error(data.error || "Impossibile caricare gli stati spedizione.");
  }

  return data.payload;
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
