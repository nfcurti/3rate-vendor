"use client";

import { Loader2, Package, ReceiptText, Truck, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { formatApiErrorMessage } from "@/lib/business-auth";
import {
  businessOrdersApi,
  formatEuro,
  formatOrderDate,
  formatShippingAddress,
  getArticlePrice,
  getClientDisplayName,
  getOrderTotal,
  getShippingStatusByCode,
  getShippingStatusById,
  getShippingStatuses,
  SHIPPING_STATUS_TAB_MAP,
  type BusinessArticle,
  type BusinessOrder,
  type EnrichedOrderDetail,
  type ShippingStatus,
  type TrackingProvider,
} from "@/lib/business-orders";
import { DashboardViewHeader } from "../../../_components/DashboardViewHeader";
import { Sidebar } from "../../../_components/Sidebar";
import { ViewTransition } from "../../../_components/ViewTransition";

type UiOrderStatus = "Attesa ritiro" | "Da spedire" | "In transito" | "Consegnati" | "Annullato";

function getUiStatus(order: BusinessOrder, statuses: ShippingStatus[]): UiOrderStatus {
  const status = getShippingStatusById(statuses, order.shippingStatusId);
  return (status && SHIPPING_STATUS_TAB_MAP[status.code]) || "Annullato";
}

export default function OrdineDettaglioPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = decodeURIComponent(params.orderId);

  const [orderDetail, setOrderDetail] = useState<EnrichedOrderDetail | null>(null);
  const [statuses, setStatuses] = useState<ShippingStatus[]>([]);
  const [articlesById, setArticlesById] = useState<Map<string, BusinessArticle>>(new Map());
  const [trackingProviders, setTrackingProviders] = useState<TrackingProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingForm, setTrackingForm] = useState({
    trackingProviderId: "",
    trackingNumber: "",
    shippingDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setStatusMessage(null);

      try {
        const [orderPayload, statusesPayload, articlesPayload, providersPayload] =
          await Promise.all([
            businessOrdersApi.getOne(orderId),
            getShippingStatuses(),
            businessOrdersApi.getListings(),
            businessOrdersApi.getTrackingProviders(),
          ]);

        if (cancelled) return;

        const articleMap = new Map<string, BusinessArticle>();
        articlesPayload.forEach((article) => {
          if (article._id) articleMap.set(article._id, article);
        });

        setOrderDetail(orderPayload ?? null);
        setStatuses(statusesPayload);
        setArticlesById(articleMap);
        setTrackingProviders(providersPayload);

        if (!orderPayload?.order) {
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

  const order = orderDetail?.order ?? null;

  const shippingStatus = useMemo(
    () => getShippingStatusById(statuses, order?.shippingStatusId),
    [order?.shippingStatusId, statuses]
  );

  const uiStatus = order ? getUiStatus(order, statuses) : "Annullato";
  const total = order ? getOrderTotal(order, articlesById) : 0;

  async function reloadOrder() {
    const [orderPayload, statusesPayload] = await Promise.all([
      businessOrdersApi.getOne(orderId),
      getShippingStatuses(),
    ]);
    setStatuses(statusesPayload);
    setOrderDetail(orderPayload ?? null);
  }

  async function handlePrepare() {
    if (!order?._id) return;
    const preparingStatus = getShippingStatusByCode(statuses, "preparing");
    if (!preparingStatus?._id) throw new Error("Stato preparazione non disponibile.");
    await businessOrdersApi.updateShippingStatus(order._id, preparingStatus._id);
  }

  async function handleMarkReceived() {
    if (!order?._id) return;
    await businessOrdersApi.markAsReceived(order._id);
  }

  async function submitTracking() {
    if (!order?._id) return;
    if (!trackingForm.trackingProviderId || !trackingForm.trackingNumber.trim()) {
      setStatusMessage({
        message: "Seleziona corriere e inserisci il numero tracking.",
        tone: "error",
      });
      return;
    }

    setActionLoading(true);
    setStatusMessage(null);

    try {
      await businessOrdersApi.updateTracking({
        orderId: order._id,
        trackingProviderId: trackingForm.trackingProviderId,
        trackingNumber: trackingForm.trackingNumber.trim(),
        shippingDate: trackingForm.shippingDate,
      });
      setShowTrackingModal(false);
      setTrackingForm({
        trackingProviderId: "",
        trackingNumber: "",
        shippingDate: new Date().toISOString().slice(0, 10),
      });
      await reloadOrder();
      setStatusMessage({ message: "Tracking aggiunto e ordine spedito.", tone: "success" });
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleElabora() {
    if (!order?._id) return;
    setActionLoading(true);
    setStatusMessage(null);
    try {
      await handlePrepare();
      await reloadOrder();
      setStatusMessage({ message: "Ordine messo in preparazione.", tone: "success" });
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  function handleSpedisci() {
    setTrackingForm({
      trackingProviderId: trackingProviders[0]?._id ?? "",
      trackingNumber: "",
      shippingDate: new Date().toISOString().slice(0, 10),
    });
    setShowTrackingModal(true);
  }

  async function handleConsegnato() {
    if (!order?._id) return;
    setActionLoading(true);
    setStatusMessage(null);
    try {
      await handleMarkReceived();
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

                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      {uiStatus === "Attesa ritiro" ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => void handleElabora()}
                          className="inline-flex h-10 items-center rounded-xl bg-[#214e3a] px-4 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading ? "Aggiornamento..." : "Elabora"}
                        </button>
                      ) : null}
                      {uiStatus === "Da spedire" ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={handleSpedisci}
                          className="inline-flex h-10 items-center rounded-xl bg-[#214e3a] px-4 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Spedisci
                        </button>
                      ) : null}
                      {uiStatus === "In transito" ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => void handleConsegnato()}
                          className="inline-flex h-10 items-center rounded-xl border border-black/10 bg-white px-4 text-[12px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading ? "Aggiornamento..." : "Segna come consegnato"}
                        </button>
                      ) : null}
                    </div>
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
                          {getClientDisplayName(orderDetail?.client)}
                        </div>
                        <div className="mt-1 text-[11px] text-[#6b7280]">
                          {orderDetail?.client?.account?.email ?? "—"}
                        </div>
                      </div>
                      <div className="rounded-xl bg-[#f8faf8] p-4 ring-1 ring-black/5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9aa39a]">
                          Indirizzo spedizione
                        </div>
                        <div className="mt-1 text-[13px] font-semibold text-[#111827]">
                          {formatShippingAddress(orderDetail?.shippingAddress)}
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

      {showTrackingModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-bold text-[#111827]">Aggiungi tracking</h3>
                <p className="mt-1 text-[12px] text-[#6b7280]">
                  Inserisci i dati di spedizione per aggiornare lo stato ordine.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTrackingModal(false)}
                className="rounded-lg p-1 text-[#6b7280] hover:cursor-pointer hover:bg-black/5"
                aria-label="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                  Corriere
                </label>
                <select
                  value={trackingForm.trackingProviderId}
                  onChange={(event) =>
                    setTrackingForm((prev) => ({
                      ...prev,
                      trackingProviderId: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                >
                  <option value="">Seleziona corriere</option>
                  {trackingProviders.map((provider) => (
                    <option key={provider._id} value={provider._id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                  Numero tracking
                </label>
                <input
                  value={trackingForm.trackingNumber}
                  onChange={(event) =>
                    setTrackingForm((prev) => ({
                      ...prev,
                      trackingNumber: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                  placeholder="Es. 1Y265789012345678"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                  Data spedizione
                </label>
                <input
                  type="date"
                  value={trackingForm.shippingDate}
                  onChange={(event) =>
                    setTrackingForm((prev) => ({
                      ...prev,
                      shippingDate: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTrackingModal(false)}
                className="inline-flex h-10 items-center rounded-xl border border-black/10 bg-white px-4 text-[12px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void submitTracking()}
                className="inline-flex h-10 items-center rounded-xl bg-[#214e3a] px-4 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? "Salvataggio..." : "Conferma spedizione"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
