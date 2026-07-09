"use client";

import { Loader2, Paperclip } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { formatApiErrorMessage } from "@/lib/business-auth";
import {
  businessSupportApi,
  type SupportTicketMessage,
} from "@/lib/business-support";
import { DashboardViewHeader } from "../../../_components/DashboardViewHeader";
import { Sidebar } from "../../../_components/Sidebar";
import { ViewTransition } from "../../../_components/ViewTransition";

function formatMessageDate(value?: string) {
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

export default function TicketDetailPage() {
  const params = useParams<{ ticketId: string }>();
  const ticketId = params.ticketId;
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState("open");
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [reply, setReply] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);

  async function loadThread() {
    setLoading(true);
    try {
      const payload = await businessSupportApi.getMessages(ticketId);
      setSubject(payload.ticket?.subject || "Ticket");
      setStatus(payload.ticket?.status || "open");
      setMessages(payload.messages || []);
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadThread();
  }, [ticketId]);

  async function handleSendReply() {
    if (!reply.trim()) return;
    setSending(true);
    setStatusMessage(null);
    try {
      await businessSupportApi.postMessage(ticketId, reply.trim());
      setReply("");
      await loadThread();
      setStatusMessage({ message: "Messaggio inviato.", tone: "success" });
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />
        <main className="w-full">
          <ViewTransition>
            <DashboardViewHeader
              title={subject || `Ticket #${ticketId.slice(-6).toUpperCase()}`}
              backHref="/dashboard/centro-assistenza/tickets"
              backAriaLabel="Torna ai ticket"
            />
            <div className="grid h-auto grid-cols-1 overflow-visible lg:h-[calc(100vh-72px)] lg:grid-cols-[1fr_280px] lg:overflow-hidden">
              <section className="flex min-h-0 flex-col bg-white max-lg:min-h-[min(420px,calc(100dvh-10rem))] lg:max-h-none">
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
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
                  {loading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-6 w-6 animate-spin text-[#214e3a]" />
                    </div>
                  ) : (
                    <div className="mx-auto w-full max-w-[820px] space-y-4">
                      {messages.length ? (
                        messages.map((message, idx) => {
                          const isSupport = message.senderType === "support";
                          return (
                            <article key={message._id || idx} className="flex gap-3">
                              <div
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                                  isSupport
                                    ? "bg-[linear-gradient(135deg,#65d46e,#2ea36d)] text-white"
                                    : "bg-[#d6dadf] text-[#3f4753]"
                                }`}
                              >
                                {isSupport ? "S" : "V"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 text-[10px] font-semibold text-[#6b7280]">
                                  <span>{isSupport ? "Supporto" : "Tu"}</span>
                                  <span>{formatMessageDate(message.createdAt)}</span>
                                </div>
                                <div className="mt-2 rounded-xl bg-[#f5f6f8] px-4 py-3 text-[12px] leading-relaxed text-[#1f2b20]">
                                  {message.body}
                                </div>
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <p className="text-center text-[12px] text-[#6b7280]">
                          Nessun messaggio in questo ticket.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="border-t border-black/5 px-4 py-3">
                  <div className="mx-auto flex w-full max-w-[820px] items-center gap-2">
                    <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e3e6ea] text-[#6b7280] hover:cursor-pointer hover:bg-black/5">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <input
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Scrivi un messaggio..."
                      className="h-8 min-w-0 flex-1 basis-[min(100%,12rem)] rounded-lg border border-[#e3e6ea] bg-[#f5f6f8] px-3 text-[11px] outline-none placeholder:text-[#a0a9b3] focus:border-[#2d4f36]/35 focus:ring-1 focus:ring-[#2d4f36]/20"
                    />
                    <button
                      type="button"
                      disabled={sending || !reply.trim()}
                      onClick={() => void handleSendReply()}
                      className="inline-flex h-8 items-center rounded-lg bg-[#214e3a] px-3 text-[11px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sending ? "..." : "Invia"}
                    </button>
                  </div>
                </div>
              </section>
              <aside className="border-t border-black/5 bg-[#f8faf8] p-4 lg:border-l lg:border-t-0">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa39a]">Stato</div>
                <div className="mt-1 text-[13px] font-semibold text-[#111827]">{status}</div>
              </aside>
            </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
