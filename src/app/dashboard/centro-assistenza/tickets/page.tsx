"use client";

import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { formatApiErrorMessage } from "@/lib/business-auth";
import { businessSupportApi, type SupportTicket } from "@/lib/business-support";
import { DashboardViewHeader } from "../../_components/DashboardViewHeader";
import { Sidebar } from "../../_components/Sidebar";
import { ViewTransition } from "../../_components/ViewTransition";

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getTicketId(ticket: SupportTicket, idx: number) {
  return getString((ticket as any).id) || getString((ticket as any)._id) || `ticket-${idx}`;
}

const PAGE_SIZE = 5;

export default function TicketsListPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setStatusMessage(null);
      try {
        const payload = await businessSupportApi.listTickets();
        if (!cancelled) setTickets(Array.isArray(payload) ? payload : []);
      } catch (error) {
        if (!cancelled) {
          setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) => {
      const id = getString((t as any).id).toLowerCase();
      const title = getString((t as any).title).toLowerCase();
      const category = getString((t as any).category).toLowerCase();
      return id.includes(q) || title.includes(q) || category.includes(q);
    });
  }, [query, tickets]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
            <DashboardViewHeader
              title="Tutti i ticket"
              backHref="/dashboard/centro-assistenza"
              backAriaLabel="Torna al centro assistenza"
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
              <section className="rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[15px] font-semibold text-[#111827]">
                    Elenco ticket ({filtered.length})
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa39a]" />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Cerca ticket..."
                      className="h-10 w-full rounded-xl border border-black/10 bg-[#f6f7f6] py-2 pl-10 pr-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/30 focus:ring-1 focus:ring-[#214e3a]/20"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-14">
                    <Loader2 className="h-6 w-6 animate-spin text-[#214e3a]" />
                  </div>
                ) : (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-[#f6f7f6] text-[10px] font-semibold tracking-wide text-[#9aa39a]">
                      <tr className="border-b border-black/5">
                        <th className="px-4 py-3">ID</th>
                        <th className="py-3 pr-4">Titolo</th>
                        <th className="py-3 pr-4">Categoria</th>
                        <th className="py-3 pr-4">Stato</th>
                        <th className="py-3 pr-4">Aggiornato</th>
                        <th className="py-3 pr-4 text-right">Azione</th>
                      </tr>
                    </thead>
                    <tbody className="text-[12px] text-[#1f2b20]">
                      {pageItems.map((t, idx) => {
                        const id = getTicketId(t, idx);
                        const title = getString((t as any).subject, getString((t as any).title, "—"));
                        const category = getString((t as any).category, "Supporto");
                        const status = getString((t as any).status, "—");
                        const updated = getString((t as any).updatedAt, getString((t as any).updated, "—"));

                        return (
                        <tr key={id} className="border-b border-black/5">
                          <td className="px-4 py-4 font-semibold">#{id}</td>
                          <td className="py-4 pr-4">{title}</td>
                          <td className="py-4 pr-4">{category}</td>
                          <td className="py-4 pr-4">
                            <span className="inline-flex rounded-full bg-[#ecf8eb] px-2.5 py-1 text-[10px] font-semibold text-[#2d4f36]">
                              {status}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-[#6b7280]">{updated}</td>
                          <td className="py-4 pr-4 text-right">
                            <Link
                              href={`/dashboard/centro-assistenza/ticket/${id}`}
                              className="text-[11px] font-semibold text-[#214e3a] hover:underline"
                            >
                              Apri ticket
                            </Link>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                )}

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-[#6b746c] hover:bg-black/5"
                    aria-label="Pagina precedente"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="px-2 text-[12px] font-semibold text-[#6b7280]">
                    {safePage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-[#6b746c] hover:bg-black/5"
                    aria-label="Pagina successiva"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </section>
            </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
