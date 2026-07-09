"use client";

import { Loader2, MapPin, Package, ReceiptText, Truck, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { formatApiErrorMessage } from "@/lib/business-auth";
import { statusAlertClass } from "@/lib/api-fallback";
import {
  businessOrdersApi,
  extractOrdersFromList,
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
  type BusinessReturnRecord,
  type EnrichedOrderListItem,
  type ShippingStatus,
  type TrackingProvider,
} from "@/lib/business-orders";
import { DashboardViewHeader } from "../_components/DashboardViewHeader";
import { FormDropdown } from "../_components/FormDropdown";
import { Sidebar } from "../_components/Sidebar";
import { ViewTransition } from "../_components/ViewTransition";

type OrderTab =
  | "Tutti gli Ordini"
  | "Attesa ritiro"
  | "Da spedire"
  | "In transito"
  | "Consegnati"
  | "Resi/Annullati";

type UiOrderStatus = "Attesa ritiro" | "Da spedire" | "In transito" | "Consegnati" | "Annullato";

function StatusPill({ status }: { status: UiOrderStatus }) {
  const cls =
    status === "Attesa ritiro"
      ? "bg-[#eef2ff] text-[#3b5bcc]"
      : status === "Da spedire"
        ? "bg-[#e7f6ea] text-[#2f6b3c]"
        : status === "In transito"
          ? "bg-[#fff7ed] text-[#b45309]"
          : status === "Consegnati"
            ? "bg-[#ecfce7] text-[#166534]"
            : "bg-[#fee2e2] text-[#b42318]";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function getUiStatus(
  order: BusinessOrder,
  statuses: ShippingStatus[]
): UiOrderStatus {
  const status = getShippingStatusById(statuses, order.shippingStatusId);
  return (status && SHIPPING_STATUS_TAB_MAP[status.code]) || "Annullato";
}

export default function OrdiniPage() {
  const [activeTab, setActiveTab] = useState<OrderTab>("Tutti gli Ordini");
  const [orders, setOrders] = useState<BusinessOrder[]>([]);
  const [orderEnrichment, setOrderEnrichment] = useState<Map<string, EnrichedOrderListItem>>(new Map());
  const [returns, setReturns] = useState<BusinessReturnRecord[]>([]);
  const [statuses, setStatuses] = useState<ShippingStatus[]>([]);
  const [articlesById, setArticlesById] = useState<Map<string, BusinessArticle>>(new Map());
  const [trackingProviders, setTrackingProviders] = useState<TrackingProvider[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [trackingForm, setTrackingForm] = useState({
    trackingProviderId: "",
    trackingNumber: "",
    shippingDate: new Date().toISOString().slice(0, 10),
  });

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      const [ordersPayload, returnsPayload, statusesPayload, articlesPayload, providersPayload] =
        await Promise.all([
          businessOrdersApi.getAll({ limit: 100 }),
          businessOrdersApi.getReturns({ limit: 100 }),
          getShippingStatuses(),
          businessOrdersApi.getListings(),
          businessOrdersApi.getTrackingProviders(),
        ]);

      const enrichmentMap = new Map<string, EnrichedOrderListItem>();
      ordersPayload.items.forEach((item) => {
        if (item.order?._id) enrichmentMap.set(item.order._id, item);
      });

      const articleMap = new Map<string, BusinessArticle>();
      articlesPayload.forEach((article) => {
        if (article._id) articleMap.set(article._id, article);
      });

      setOrders(extractOrdersFromList(ordersPayload.items));
      setOrderEnrichment(enrichmentMap);
      setReturns(returnsPayload.items);
      setStatuses(statusesPayload);
      setArticlesById(articleMap);
      setTrackingProviders(providersPayload);
      setSelectedIds(new Set());
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
    void loadOrders();
  }, [loadOrders]);

  const tabCounts = useMemo(() => {
    const counts: Record<OrderTab, number> = {
      "Tutti gli Ordini": orders.length,
      "Attesa ritiro": 0,
      "Da spedire": 0,
      "In transito": 0,
      Consegnati: 0,
      "Resi/Annullati": returns.length,
    };

    orders.forEach((order) => {
      const uiStatus = getUiStatus(order, statuses);
      if (uiStatus === "Annullato") return;
      if (counts[uiStatus as OrderTab] !== undefined) {
        counts[uiStatus as OrderTab] += 1;
      }
    });

    return counts;
  }, [orders, statuses, returns.length]);

  const tabs = useMemo(
    () =>
      [
        { key: "Tutti gli Ordini" as const, tone: "text-[#1f2b20]" },
        { key: "Attesa ritiro" as const, tone: "text-[#3b5bcc] bg-[#eef2ff]" },
        { key: "Da spedire" as const, tone: "text-[#1E3A8A] bg-[#EFF6FF]" },
        { key: "In transito" as const, tone: "text-[#A16207] bg-[#FCFCDC]" },
        { key: "Consegnati" as const, tone: "text-[#166534] bg-[#ecfce7]" },
        { key: "Resi/Annullati" as const, tone: "text-[#b42318] bg-[#fee2e2]" },
      ].map((tab) => ({
        ...tab,
        label: tab.key,
        count: String(tabCounts[tab.key]),
      })),
    [tabCounts]
  );

  const filteredOrders = useMemo(() => {
    if (activeTab === "Resi/Annullati") {
      return returns
        .map((item) => item.order)
        .filter((order): order is BusinessOrder => Boolean(order));
    }
    if (activeTab === "Tutti gli Ordini") return orders;
    return orders.filter((order) => getUiStatus(order, statuses) === activeTab);
  }, [activeTab, orders, returns, statuses]);

  const visibleOrderIds = filteredOrders
    .map((order) => order._id)
    .filter((id): id is string => Boolean(id));

  const allVisibleSelected =
    visibleOrderIds.length > 0 && visibleOrderIds.every((id) => selectedIds.has(id));

  function toggleSelectAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleOrderIds.forEach((id) => next.delete(id));
      } else {
        visibleOrderIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleOrderSelection(orderId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  async function runBulkAction(
    action: (orderId: string) => Promise<void>,
    successMessage: string
  ) {
    const ids = [...selectedIds];
    if (!ids.length) {
      setStatusMessage({ message: "Seleziona almeno un ordine.", tone: "error" });
      return;
    }

    setActionLoading(true);
    setStatusMessage(null);

    try {
      for (const orderId of ids) {
        await action(orderId);
      }
      await loadOrders();
      setStatusMessage({ message: successMessage, tone: "success" });
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkAsShipped(orderId: string) {
    const sentStatus = getShippingStatusByCode(statuses, "sent");
    if (!sentStatus?._id) throw new Error("Stato spedizione non disponibile.");
    await businessOrdersApi.updateShippingStatus(orderId, sentStatus._id);
  }

  async function handleMarkAsReceived(orderId: string) {
    await businessOrdersApi.markAsReceived(orderId);
  }

  async function handlePrepare(orderId: string) {
    const preparingStatus = getShippingStatusByCode(statuses, "preparing");
    if (!preparingStatus?._id) throw new Error("Stato preparazione non disponibile.");
    await businessOrdersApi.updateShippingStatus(orderId, preparingStatus._id);
  }

  async function submitTracking() {
    if (!trackingOrderId) return;
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
        orderId: trackingOrderId,
        trackingProviderId: trackingForm.trackingProviderId,
        trackingNumber: trackingForm.trackingNumber.trim(),
        shippingDate: trackingForm.shippingDate,
      });
      setTrackingOrderId(null);
      setTrackingForm({
        trackingProviderId: "",
        trackingNumber: "",
        shippingDate: new Date().toISOString().slice(0, 10),
      });
      await loadOrders();
      setStatusMessage({ message: "Tracking aggiunto e ordine spedito.", tone: "success" });
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  function getOrderActions(order: BusinessOrder) {
    const uiStatus = getUiStatus(order, statuses);
    const actions: Array<{ label: string; type: "primary" | "link" | "secondary" }> = [
      { label: "Dettagli", type: "link" },
    ];

    if (uiStatus === "Attesa ritiro") {
      actions.unshift({ label: "Elabora", type: "primary" });
    }
    if (uiStatus === "Da spedire") {
      actions.unshift({ label: "Spedisci", type: "primary" });
    }
    if (uiStatus === "In transito") {
      actions.push({ label: "Consegnato", type: "secondary" });
    }

    return actions;
  }

  async function handleOrderAction(order: BusinessOrder, label: string) {
    if (!order._id) return;

    setActionLoading(true);
    setStatusMessage(null);

    try {
      if (label === "Elabora") {
        await handlePrepare(order._id);
        await loadOrders();
        setStatusMessage({ message: "Ordine messo in preparazione.", tone: "success" });
        return;
      }

      if (label === "Spedisci") {
        setTrackingOrderId(order._id);
        setTrackingForm({
          trackingProviderId: trackingProviders[0]?._id ?? "",
          trackingNumber: "",
          shippingDate: new Date().toISOString().slice(0, 10),
        });
        return;
      }

      if (label === "Consegnato") {
        await handleMarkAsReceived(order._id);
        await loadOrders();
        setStatusMessage({ message: "Ordine segnato come consegnato.", tone: "success" });
      }
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
            <DashboardViewHeader title="Ordini" />

            <div className="mx-auto w-full max-w-6xl px-4 py-7 lg:px-8">
              {statusMessage ? (
                <p className={clsx("mb-4", statusAlertClass(statusMessage.tone))}>
                  {statusMessage.message}
                </p>
              ) : null}

              <div className="rounded-xl bg-white p-3 shadow-[0_12px_28px_rgba(16,24,16,0.06)] ring-1 ring-black/5 lg:hidden">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9aa39a]">
                  Filtra ordini
                </div>
                <div className="mt-2">
                  <FormDropdown
                    aria-label="Seleziona tab ordini"
                    placeholder="Seleziona stato ordini"
                    options={tabs.map((t) => ({
                      value: t.key,
                      label: `${t.label} (${t.count})`,
                    }))}
                    value={activeTab}
                    onChange={(value) => setActiveTab(value as OrderTab)}
                  />
                </div>
              </div>

              <div className="hidden rounded-xl bg-white px-3 shadow-[0_12px_28px_rgba(16,24,16,0.06)] ring-1 ring-black/5 lg:block">
                <div className="flex flex-nowrap items-stretch gap-2 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {tabs.map((t) => {
                    const isActive = activeTab === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setActiveTab(t.key)}
                        className={clsx(
                          "inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2 text-[11px] font-semibold hover:cursor-pointer",
                          isActive
                            ? "border-[#214e3a] text-[#1f2b20]"
                            : "border-transparent text-[#6b746c] hover:bg-black/5"
                        )}
                      >
                        {t.label}
                        <span
                          className={clsx(
                            "inline-flex items-center justify-center rounded-full px-2 py-1 text-[10px] font-semibold leading-none",
                            t.tone
                          )}
                        >
                          {t.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#16A34A]/15 bg-[#ecfce7] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-[#1f2b20]">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      disabled={loading || actionLoading || !visibleOrderIds.length}
                      className="h-4 w-4 rounded border-black/20 bg-white"
                    />
                    Seleziona tutti gli ordini visibili
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={loading || actionLoading}
                      onClick={() =>
                        void runBulkAction(
                          handleMarkAsShipped,
                          "Ordini segnati come spediti."
                        )
                      }
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-black/5 bg-[#F3F5F7] px-4 text-[11px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Segna come spedito
                    </button>
                    <button
                      type="button"
                      disabled={loading || actionLoading}
                      onClick={() =>
                        void runBulkAction(
                          handleMarkAsReceived,
                          "Ordini segnati come consegnati."
                        )
                      }
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-black/5 bg-[#F3F5F7] px-4 text-[11px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Segna come consegnato
                    </button>
                  </div>
                </div>
              </div>

              <section className="mt-4 overflow-hidden rounded-3xl bg-white shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                {loading ? (
                  <div className="flex items-center justify-center px-6 py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-[#214e3a]" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="px-6 py-16 text-center text-[13px] text-[#6b7280]">
                    Nessun ordine in questa sezione.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1040px] text-left">
                      <thead className="bg-[#f6f7f6] text-[10px] font-semibold tracking-wide text-[#9aa39a]">
                        <tr className="border-b border-black/5">
                          <th className="w-[44px] px-6 py-4">
                            <input
                              type="checkbox"
                              checked={allVisibleSelected}
                              onChange={toggleSelectAllVisible}
                              className="h-4 w-4 rounded border-black/10"
                            />
                          </th>
                          <th className="py-4 pr-4">DETTAGLI</th>
                          <th className="py-4 pr-4">CLIENTE</th>
                          <th className="py-4 pr-4">PRODOTTI</th>
                          <th className="py-4 pr-4">STATO</th>
                          <th className="py-4 pr-4">TOTALE</th>
                          <th className="py-4 pr-6 text-right">AZIONI</th>
                        </tr>
                      </thead>
                      <tbody className="text-[12px] text-[#1f2b20]">
                        {filteredOrders.map((order) => {
                          const orderId = order._id ?? "";
                          const enriched = orderId ? orderEnrichment.get(orderId) : undefined;
                          const uiStatus =
                            activeTab === "Resi/Annullati"
                              ? ("Annullato" as const)
                              : getUiStatus(order, statuses);
                          const total = getOrderTotal(order, articlesById);

                          return (
                            <tr key={orderId || order.orderNumber} className="border-b border-black/5">
                              <td className="w-[44px] px-6 py-6 align-top">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(orderId)}
                                  onChange={() => toggleOrderSelection(orderId)}
                                  disabled={!orderId || actionLoading}
                                  className="h-4 w-4 rounded border-black/10"
                                />
                              </td>

                              <td className="py-6 pr-4 align-top">
                                <div className="text-[12px] font-semibold text-[#1f2b20]">
                                  {order.orderNumber}
                                </div>
                                <div className="mt-2 space-y-1 text-[10px] font-semibold text-[#9aa39a]">
                                  <div>ID {orderId.slice(-8) || "—"}</div>
                                  <div>{formatOrderDate(order.createdAt)}</div>
                                </div>
                              </td>

                              <td className="py-6 pr-4 align-top">
                                <div className="text-[12px] font-semibold text-[#1f2b20]">
                                  {getClientDisplayName(enriched?.client)}
                                </div>
                                <div className="mt-1 text-[10px] font-semibold text-[#9aa39a]">
                                  {enriched?.client?.account?.email ?? order.clientAccountId.slice(-8)}
                                </div>
                                <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[#9aa39a]">
                                  <MapPin className="h-3.5 w-3.5 text-[#c0c6c0]" />
                                  {formatShippingAddress(enriched?.shippingAddress)}
                                </div>
                              </td>

                              <td className="py-6 pr-4 align-top">
                                <div className="space-y-3">
                                  {order.orderItems.map((item) => {
                                    const article = articlesById.get(item.articleId);
                                    const price = getArticlePrice(article);
                                    return (
                                      <div
                                        key={`${orderId}-${item.articleId}`}
                                        className="flex items-center justify-between gap-4"
                                      >
                                        <div className="flex min-w-0 items-center gap-3">
                                          <div className="h-9 w-9 rounded-xl bg-[#f2f4f2] ring-1 ring-black/5" />
                                          <div className="min-w-0">
                                            <div className="truncate text-[11px] font-semibold text-[#1f2b20]">
                                              {article?.description || "Prodotto"}
                                            </div>
                                            <div className="text-[10px] font-semibold text-[#9aa39a]">
                                              Qtà: {item.quantity}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-[11px] font-semibold text-[#1f2b20]">
                                          {formatEuro(price * item.quantity)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>

                              <td className="py-6 pr-4 align-top">
                                <StatusPill status={uiStatus} />
                                {order.trackingId ? (
                                  <div className="mt-2 text-[10px] font-semibold text-[#9aa39a]">
                                    Tracking attivo
                                  </div>
                                ) : null}
                              </td>

                              <td className="py-6 pr-4 align-top">
                                <div className="text-[12px] font-semibold text-[#1f2b20]">
                                  {formatEuro(total)}
                                </div>
                              </td>

                              <td className="py-6 pr-6 align-top text-right">
                                <div className="flex flex-col items-end gap-2">
                                  {getOrderActions(order).map((action) =>
                                    action.label === "Dettagli" ? (
                                      <Link
                                        key={`${orderId}-${action.label}`}
                                        href={`/dashboard/ordini/dettagli/${encodeURIComponent(orderId)}`}
                                        className="inline-flex h-7 items-center justify-center rounded-lg border border-black/10 bg-white px-3 text-[11px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
                                      >
                                        {action.label}
                                      </Link>
                                    ) : (
                                      <button
                                        key={`${orderId}-${action.label}`}
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() => void handleOrderAction(order, action.label)}
                                        className={clsx(
                                          "inline-flex h-7 items-center justify-center rounded-lg px-3 text-[11px] font-semibold hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
                                          action.type === "primary"
                                            ? "bg-[#214e3a] text-white hover:bg-[#1c4332]"
                                            : "border border-black/10 bg-white text-[#1f2b20] hover:bg-black/5"
                                        )}
                                      >
                                        {action.label}
                                      </button>
                                    )
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </ViewTransition>
        </main>
      </div>

      {trackingOrderId ? (
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
                onClick={() => setTrackingOrderId(null)}
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
                {!trackingProviders.length ? (
                  <p className="mt-1 text-[11px] text-[#6b7280]">
                    Nessun corriere configurato nel backend.
                  </p>
                ) : null}
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
                onClick={() => setTrackingOrderId(null)}
                className="inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-[12px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={actionLoading || !trackingProviders.length}
                onClick={() => void submitTracking()}
                className="inline-flex h-10 items-center rounded-xl bg-[#214e3a] px-4 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? "Salvataggio..." : "Salva tracking"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
