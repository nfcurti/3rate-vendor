"use client";

import { Loader2, Package, ReceiptText, Truck } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { formatApiErrorMessage } from "@/lib/business-auth";
import {
  businessOrdersApi,
  formatEuro,
  formatOrderDate,
  getArticlePrice,
  getOrderTotal,
  getShippingStatusById,
  getShippingStatuses,
  SHIPPING_STATUS_TAB_MAP,
  type BusinessArticle,
  type BusinessOrder,
  type ShippingStatus,
} from "@/lib/business-orders";
import { DashboardViewHeader } from "../../../_components/DashboardViewHeader";
import { Sidebar } from "../../../_components/Sidebar";
import { ViewTransition } from "../../../_components/ViewTransition";

export default function OrdineDettaglioPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = decodeURIComponent(params.orderId);

  const [order, setOrder] = useState<BusinessOrder | null>(null);
  const [statuses, setStatuses] = useState<ShippingStatus[]>([]);
  const [articlesById, setArticlesById] = useState<Map<string, BusinessArticle>>(new Map());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setStatusMessage(null);

      try {
        const [ordersPayload, statusesPayload, articlesPayload] = await Promise.all([
          businessOrdersApi.getAll(),
          getShippingStatuses(),
          businessOrdersApi.getListings(),
        ]);

        if (cancelled) return;

        const articleMap = new Map<string, BusinessArticle>();
        articlesPayload.forEach((article) => {
          if (article._id) articleMap.set(article._id, article);
        });

        const foundOrder = ordersPayload.find((item) => item._id === orderId) ?? null;
        setOrder(foundOrder);
        setStatuses(statusesPayload);
        setArticlesById(articleMap);

        if (!foundOrder) {
          setStatusMessage({ message: "Ordine non trovato.", tone: "error" });
        }
      } catch (error) {
        if (!cancelled) {
          setStatusMessage({
            message: formatApiErrorMessage(error),
            tone: "error",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const shippingStatus = useMemo(
    () => getShippingStatusById(statuses, order?.shippingStatusId),
    [order?.shippingStatusId, statuses]
  );

  const uiStatus =
    (shippingStatus && SHIPPING_STATUS_TAB_MAP[shippingStatus.code]) || "Sconosciuto";
  const total = order ? getOrderTotal(order, articlesById) : 0;

  async function reloadOrder() {
    const [ordersPayload, statusesPayload] = await Promise.all([
      businessOrdersApi.getAll(),
      getShippingStatuses(),
    ]);
    setStatuses(statusesPayload);
    setOrder(ordersPayload.find((item) => item._id === orderId) ?? null);
  }

  async function handleMarkReceived() {
    if (!order?._id) return;
    setActionLoading(true);
    setStatusMessage(null);
    try {
      await businessOrdersApi.markAsReceived(order._id);
      await reloadOrder();
      setStatusMessage({ message: "Ordine segnato come consegnato.", tone: "success" });
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
              title={`Dettagli ordine ${order?.orderNumber ?? ""}`}
              backHref="/dashboard/ordini"
              backAriaLabel="Torna agli ordini"
            />

            <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-7 lg:px-8">
              {statusMessage ? (
                <p
                  className={clsx(
                    "text-xs font-semibold",
                    statusMessage.tone === "success" ? "text-[#2f6b3c]" : "text-red-600"
                  )}
                >
                  {statusMessage.message}
                </p>
              ) : null}

              {loading ? (
                <div className="flex items-center justify-center rounded-3xl bg-white py-16 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                  <Loader2 className="h-6 w-6 animate-spin text-[#214e3a]" />
                </div>
              ) : order ? (
                <>
                  <section className="rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="rounded-xl bg-[#f8faf8] p-4 ring-1 ring-black/5">
                        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#1f2b20]">
                          <Package className="h-4 w-4 text-[#214e3a]" />
                          Stato ordine
                        </div>
                        <div className="mt-2 inline-flex rounded-full bg-[#e7f6ea] px-3 py-1 text-[11px] font-semibold text-[#2f6b3c]">
                          {shippingStatus?.message || uiStatus}
                        </div>
                      </div>
                      <div className="rounded-xl bg-[#f8faf8] p-4 ring-1 ring-black/5">
                        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#1f2b20]">
                          <Truck className="h-4 w-4 text-[#214e3a]" />
                          Spedizione
                        </div>
                        <div className="mt-2 text-[12px] font-semibold text-[#111827]">
                          {order.trackingId ? "Tracking registrato" : "Nessun tracking"}
                        </div>
                        <div className="text-[11px] text-[#6b7280]">
                          Opzione #{order.shippingOptionId.slice(-6)}
                        </div>
                      </div>
                      <div className="rounded-xl bg-[#f8faf8] p-4 ring-1 ring-black/5">
                        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#1f2b20]">
                          <ReceiptText className="h-4 w-4 text-[#214e3a]" />
                          Totale
                        </div>
                        <div className="mt-2 text-[16px] font-bold text-[#111827]">
                          {formatEuro(total)}
                        </div>
                        <div className="text-[11px] text-[#6b7280]">
                          Creato il {formatOrderDate(order.createdAt)}
                        </div>
                      </div>
                    </div>

                    {shippingStatus?.code === "sent" ? (
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => void handleMarkReceived()}
                          className="inline-flex h-10 items-center rounded-xl bg-[#214e3a] px-4 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading ? "Aggiornamento..." : "Segna come consegnato"}
                        </button>
                      </div>
                    ) : null}
                  </section>

                  <section className="rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                    <h2 className="text-[16px] font-semibold tracking-tight text-[#111827]">
                      Dettagli cliente
                    </h2>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-[#f8faf8] p-4 ring-1 ring-black/5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9aa39a]">
                          Cliente
                        </div>
                        <div className="mt-1 text-[13px] font-semibold text-[#111827]">
                          {order.clientAccountId}
                        </div>
                      </div>
                      <div className="rounded-xl bg-[#f8faf8] p-4 ring-1 ring-black/5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9aa39a]">
                          Indirizzo spedizione
                        </div>
                        <div className="mt-1 text-[13px] font-semibold text-[#111827]">
                          {order.clientShippingAddressId}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                    <h2 className="text-[16px] font-semibold tracking-tight text-[#111827]">
                      Prodotti ordine
                    </h2>
                    <div className="mt-4 space-y-3">
                      {order.orderItems.map((item) => {
                        const article = articlesById.get(item.articleId);
                        const price = getArticlePrice(article);
                        return (
                          <div
                            key={`${order._id}-${item.articleId}`}
                            className="flex items-center justify-between rounded-xl bg-[#f8faf8] px-4 py-3 ring-1 ring-black/5"
                          >
                            <div>
                              <div className="text-[13px] font-semibold text-[#111827]">
                                {article?.description || "Prodotto"}
                              </div>
                              <div className="text-[11px] text-[#6b7280]">
                                Qtà: {item.quantity}
                              </div>
                            </div>
                            <div className="text-[13px] font-semibold text-[#111827]">
                              {formatEuro(price * item.quantity)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </>
              ) : null}
            </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
