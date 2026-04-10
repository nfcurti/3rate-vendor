"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronRight,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  Play,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { DashboardHelpMenu } from "../_components/DashboardHelpMenu";
import { DashboardViewHeader } from "../_components/DashboardViewHeader";
import { Sidebar } from "../_components/Sidebar";
import { ViewTransition } from "../_components/ViewTransition";

const GUIDE_CARDS = [
  {
    title: "Guida introduttiva",
    desc: "Primi passi su 3Rate Venditore: catalogo, ordini e pagamenti.",
    bg: "bg-[#e0f2fe]",
    border: "border-[#bae6fd]",
    arrow: "text-sky-600",
  },
  {
    title: "Gestione ordini",
    desc: "Spedizioni, ritiri in negozio, resi e comunicazioni con il cliente.",
    bg: "bg-[#dcfce7]",
    border: "border-[#bbf7d0]",
    arrow: "text-emerald-600",
  },
  {
    title: "Pagamenti e bonifici",
    desc: "Calendario accrediti, commissioni e conti bancari verificati.",
    bg: "bg-[#ede9fe]",
    border: "border-[#ddd6fe]",
    arrow: "text-violet-600",
  },
  {
    title: "Magazzino e varianti",
    desc: "Stock, SKU, barcode e attributi prodotto.",
    bg: "bg-[#ffedd5]",
    border: "border-[#fed7aa]",
    arrow: "text-orange-600",
  },
  {
    title: "Politiche e conformità",
    desc: "Termini, privacy e best practice per i venditori.",
    bg: "bg-[#ffe4e6]",
    border: "border-[#fecdd3]",
    arrow: "text-rose-600",
  },
  {
    title: "Integrazioni e API",
    desc: "Collega strumenti esterni e automatizza i flussi.",
    bg: "bg-[#ccfbf1]",
    border: "border-[#99f6e4]",
    arrow: "text-teal-600",
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "Come funzionano i pagamenti e quando ricevo il bonifico?",
    a: "Gli importi delle vendite vengono consolidati secondo la frequenza che hai scelto (es. settimanale). Dopo il periodo di riferimento, elaboriamo le commissioni e accreditiamo l’importo netto sul conto verificato. Puoi seguire ogni movimento da Pagamenti & guadagni e nello storico bonifici.",
  },
  {
    q: "Come gestisco un reso o una richiesta di rimborso?",
    a: "Dalla sezione Ordini puoi avviare il flusso reso secondo le policy attive. Il cliente riceve istruzioni automatiche e lo stato si aggiorna in tempo reale.",
  },
  {
    q: "Come verifico il mio conto bancario?",
    a: "Vai su Pagamenti & guadagni → Metodi di pagamento, aggiungi l’IBAN e completa la verifica con il micro-accredito o il documento richiesto.",
  },
  {
    q: "Come aumento la visibilità dei miei prodotti?",
    a: "Completa schede prodotto con immagini di qualità, usa varianti corrette e valuta le promozioni stagionali proposte in dashboard.",
  },
] as const;

export default function CentroAssistenzaPage() {
  const router = useRouter();
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [kbQuery, setKbQuery] = useState("");

  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
          <DashboardViewHeader
            title="Centro assistenza"
            backHref="/dashboard"
            backAriaLabel="Torna alla panoramica"
          />

          <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 lg:px-8">
            {/* Contattaci + Ticket */}
            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">
              <div className="flex flex-col rounded-2xl bg-[#1e4d36] p-6 text-white shadow-[0_12px_32px_rgba(30,77,54,0.2)] sm:p-7">
                <h2 className="text-[17px] font-bold tracking-tight text-white">Contattaci</h2>
                <div className="mt-5 flex flex-col gap-3">
                  {[
                    {
                      icon: Mail,
                      label: "Email",
                      value: "supporto@3rate.it",
                      hint: "Risposta in ~4 ore",
                    },
                    {
                      icon: Phone,
                      label: "Telefono",
                      value: "+39 02 1234 5678",
                      hint: "Lun-Ven: 9:00 - 18:00",
                    },
                    {
                      icon: MessageCircle,
                      label: "WhatsApp Business",
                      value: "+39 345 678 9012",
                      hint: "Assistenza rapida",
                    },
                  ].map((c) => (
                    <div
                      key={c.label}
                      className="rounded-xl bg-white/[0.14] p-4 backdrop-blur-[2px]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFFFFF33] shrink-0">
                          <c.icon className="h-5 w-5 text-[#ffffff]" strokeWidth={1.85} />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wide text-white/55">
                            {c.label}
                          </div>
                          <div className="mt-1 text-[13px] font-semibold leading-snug text-white">
                            {c.value}
                          </div>
                          <div className="mt-2 text-[11px] font-medium leading-snug text-white/65">
                            {c.hint}
                          </div>
                        </div>
                      </div>
                    </div>
               
                  ))}
                </div>
                <div className="mt-5 rounded-xl  bg-[#FFFFFF1A] p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-white">
                    
                    Orari supporto
                  </div>
                  <div className="mt-3 space-y-2 text-[12px] leading-relaxed text-white/85">
                    <p>
                      <span className="font-semibold text-white">Lunedì - Sabato:</span> 9:00 - 18:00
                    </p>
                    <p>
                      <span className="font-semibold text-white">Domenica:</span> Chiuso
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-7">
                <div className="flex flex-row items-center justify-between gap-4">
                  <h2 className="text-[17px] font-bold tracking-tight text-[#111827]">I tuoi ticket</h2>
                  <Link
                    href="/dashboard/centro-assistenza/nuovo-ticket"
                    className="flex h-5 shrink-0 items-center justify-center rounded-full bg-[#214e3a] px-4 text-lg font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e] sm:h-10 sm:px-5 sm:text-[12px]"
                  >
                    Nuovo ticket
                  </Link>
                </div>
                <ul className="mt-5 flex flex-1 flex-col gap-3">
                  {[
                    {
                      id: "#TICK-3892",
                      slug: "tick-3892",
                      title: "Problema con bonifico di Dicembre",
                      snippet:
                        "Ho ricevuto l’email di chiusura periodo ma sul conto non risulta ancora l’accredito relativo al…",
                      updated: "Ultima risposta: 2 ore fa",
                    },
                    {
                      id: "#TICK-3341",
                      slug: "tick-3341",
                      title: "Modifica IBAN conto principale",
                      snippet:
                        "Dovrei aggiornare l’IBAN per i prossimi bonifici. Ho già caricato il documento in allegato…",
                      updated: "Ultima risposta: ieri, 16:02",
                    },
                  ].map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/dashboard/centro-assistenza/ticket/${t.slug}`}
                        className="block rounded-xl border-2 border-[#e8eaed] p-4 ring-1 ring-black/[0.02] transition-colors hover:cursor-pointer hover:border-[#76C043]"
                      >
                        <div className="text-[10px] font-semibold tracking-wide text-[#9ca3af]">
                          {t.id}
                        </div>
                        <div className="mt-2 text-[14px] font-bold leading-snug text-[#111827]">{t.title}</div>
                        <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-[#6b7280]">
                          {t.snippet}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#e8eaed] pt-3">
                          <span className="text-[11px] font-medium text-[#9ca3af]">{t.updated}</span>
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#214e3a]">
                            Visualizza dettagli
                            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <hr className="border-t border-[#E5E7EB]" />
                <div className="mt-5 rounded-xl bg-[#F9FAFB] hover:bg-[#F3F5F7] hover:cursor-pointer  p-1 text-center">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/centro-assistenza/tickets")}
                    className="inline-flex  items-center gap-1 text-[12px] font-semibold text-[#214e3a] hover:cursor-pointer hover:underline"
                  >
                    Visualizza tutti i ticket
                    <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
                  </button>
                </div>
              </div>
            </section>

            {/* Guide e risorse */}
            <section className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-[#111827]">
                  Guide e risorse
                </h2>
                <div className="relative w-full max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa39a]" />
                  <input
                    type="search"
                    value={kbQuery}
                    onChange={(e) => setKbQuery(e.target.value)}
                    placeholder="Cerca nella knowledge base..."
                    className="h-9 w-full rounded-lg border border-black/10 bg-[#f6f7f6] py-2 pl-10 pr-3 text-[12px] text-[#111827] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/30 focus:ring-1 focus:ring-[#214e3a]/20"
                  />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {GUIDE_CARDS.map((card) => (
                  <a
                    key={card.title}
                    href="#"
                    className={clsx(
                      "group relative flex min-h-[140px] flex-col rounded-2xl border p-5 transition-shadow hover:cursor-pointer hover:shadow-md",
                      card.bg,
                      card.border,
                    )}
                  >
                    <div className="pr-8 text-[15px] font-semibold leading-snug text-[#111827]">
                      {card.title}
                    </div>
                    <p className="mt-2 flex-1 text-[12px] leading-relaxed text-[#4b5563]">
                      {card.desc}
                    </p>
                    <ChevronRight
                      className={clsx(
                        "absolute bottom-4 right-4 h-5 w-5 shrink-0",
                        card.arrow,
                      )}
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  </a>
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
              <h2 className="text-lg font-semibold tracking-tight text-[#111827]">
                Domande frequenti
              </h2>
              <div className="mt-5 divide-y divide-black/[0.06]">
                {FAQ_ITEMS.map((item, i) => {
                  const open = faqOpen === i;
                  return (
                    <div key={item.q} className="py-1">
                      <button
                        type="button"
                        onClick={() => setFaqOpen(open ? null : i)}
                        className="flex w-full items-center justify-between gap-4 py-4 text-left hover:cursor-pointer"
                        aria-expanded={open}
                      >
                        <span className="text-[13px] font-semibold leading-snug text-[#111827]">
                          {item.q}
                        </span>
                        <ChevronDown
                          className={clsx(
                            "h-5 w-5 shrink-0 text-[#6b7280] transition-transform",
                            open && "rotate-180",
                          )}
                          strokeWidth={2}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {open ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <p className="pb-4 text-[12px] leading-relaxed text-[#6b7280]">{item.a}</p>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Video tutorial */}
            <section className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
              <h2 className="text-lg font-semibold tracking-tight text-[#111827]">
                Video tutorial
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {[
                  {
                    title: "Tour della dashboard venditore",
                    desc: "Panoramica di ordini e pagamenti in 5 minuti.",
                    duration: "5:12",
                    thumb: "from-[#1a3d2e] to-[#214e3a]",
                  },
                  {
                    title: "Pubblicare un prodotto con varianti",
                    desc: "SKU, barcode, immagini e attributi passo passo.",
                    duration: "8:04",
                    thumb: "from-[#1e40af] to-[#3b82f6]",
                  },
                  {
                    title: "Leggere lo storico bonifici",
                    desc: "Calendario accrediti, commissioni e export.",
                    duration: "4:37",
                    thumb: "from-[#5b21b6] to-[#7c3aed]",
                  },
                ].map((v) => (
                  <a
                    key={v.title}
                    href="#"
                    className="group block  hover:cursor-pointer"
                  >
                    <div
                      className={clsx(
                        "relative aspect-video overflow-hidden rounded-t-2xl bg-gradient-to-br shadow-inner ring-1 ring-black/10",
                        v.thumb,
                      )}
                    >
                      <div className="absolute right-2 top-2 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white">
                        {v.duration}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#111827] shadow-lg ring-1 ring-black/10 transition-transform group-hover:scale-105">
                          <Play className="ml-1 h-7 w-7 text-[#214e3a]" fill="currentColor" strokeWidth={0} />
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 bg-[#F9FAFB] px-4 pb-4 rounded-b-2xl">
                      <div className="mt-3 text-[14px] font-semibold leading-snug text-[#111827]">
                        {v.title}
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-[#6b7280]">{v.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            {/* CTA banner */}
            <section className="rounded-2xl bg-[#1e4d36] px-6 py-8 text-white shadow-[0_12px_32px_rgba(30,77,54,0.2)] sm:px-8 sm:py-9 lg:px-10 lg:py-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
                <div className="max-w-lg">
                  <h2 className="text-xl font-bold tracking-tight text-white sm:text-[22px]">
                    Non hai trovato quello che cercavi?
                  </h2>
                  <p className="mt-3 text-[13px] leading-relaxed text-white/80 sm:text-[14px]">
                    Il nostro team di supporto venditori è disponibile per aiutarti con configurazioni,
                    pagamenti o gestione ordini.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end">
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-white px-7 text-[12px] font-semibold text-[#1e4d36] shadow-sm hover:cursor-pointer hover:bg-white/95"
                  >
                    Avvia chat
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-white px-7 text-[12px] font-semibold text-[#1e4d36] shadow-sm hover:cursor-pointer hover:bg-white/95"
                  >
                    Apri ticket
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-full border border-white bg-transparent px-7 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-white/10"
                  >
                    Chiamaci
                  </button>
                </div>
              </div>
            </section>
          </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
