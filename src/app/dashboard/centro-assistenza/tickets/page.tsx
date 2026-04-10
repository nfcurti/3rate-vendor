"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardViewHeader } from "../../_components/DashboardViewHeader";
import { Sidebar } from "../../_components/Sidebar";
import { ViewTransition } from "../../_components/ViewTransition";

const TICKETS = [
  { id: "TICK-3892", title: "Problema bonifico dicembre", category: "Pagamenti", status: "Aperto", updated: "2 ore fa" },
  { id: "TICK-3850", title: "Aggiornamento IBAN", category: "Pagamenti", status: "In lavorazione", updated: "Ieri" },
  { id: "TICK-3821", title: "Errore caricamento prodotto", category: "Tecnico", status: "Aperto", updated: "2 giorni fa" },
  { id: "TICK-3790", title: "Reso ordine #3R-8841Q205", category: "Resi", status: "Risolto", updated: "4 giorni fa" },
  { id: "TICK-3743", title: "Modifica dati account", category: "Sicurezza", status: "Risolto", updated: "1 settimana fa" },
  { id: "TICK-3711", title: "Commissioni transazione", category: "Pagamenti", status: "In lavorazione", updated: "1 settimana fa" },
  { id: "TICK-3664", title: "Richiesta verifica documento", category: "Account", status: "Risolto", updated: "2 settimane fa" },
  { id: "TICK-3608", title: "Errore sincronizzazione stock", category: "Magazzino", status: "Aperto", updated: "2 settimane fa" },
] as const;

const PAGE_SIZE = 5;

export default function TicketsListPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TICKETS;
    return TICKETS.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q),
    );
  }, [query]);

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
                      {pageItems.map((t) => (
                        <tr key={t.id} className="border-b border-black/5">
                          <td className="px-4 py-4 font-semibold">#{t.id}</td>
                          <td className="py-4 pr-4">{t.title}</td>
                          <td className="py-4 pr-4">{t.category}</td>
                          <td className="py-4 pr-4">
                            <span className="inline-flex rounded-full bg-[#ecf8eb] px-2.5 py-1 text-[10px] font-semibold text-[#2d4f36]">
                              {t.status}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-[#6b7280]">{t.updated}</td>
                          <td className="py-4 pr-4 text-right">
                            <Link
                              href="/dashboard/centro-assistenza/nuovo-ticket"
                              className="text-[11px] font-semibold text-[#214e3a] hover:underline"
                            >
                              Apri ticket
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

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
