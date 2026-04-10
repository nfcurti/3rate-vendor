"use client";

import {
  CalendarDays,
  Check,
  Circle,
  CircleAlert,
  CloudUpload,
  Hash,
  Link2,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { DashboardViewHeader } from "../../_components/DashboardViewHeader";
import { Sidebar } from "../../_components/Sidebar";
import { ViewTransition } from "../../_components/ViewTransition";

const CATEGORIES = [
  {
    title: "Pagamenti",
    subtitle: "Bonifici, commissioni, accrediti",
  },
  {
    title: "Prodotti",
    subtitle: "Gestione catalogo, inventario",
  },
  {
    title: "Tecnico",
    subtitle: "Bug piattaforma, errori sistema",
  },
  {
    title: "Sicurezza",
    subtitle: "Account, password, privacy",
  },
  {
    title: "Resi & Rimborsi",
    subtitle: "Gestione resi, contestazioni",
  },
  {
    title: "Altro",
    subtitle: "Domande generali",
  },
] as const;

const ATTACHMENTS = [
  { name: "screenshot-errore-pagamento.jpg", size: "2.8 MB" },
  { name: "estratto-conto-dicembre.pdf", size: "1.3 MB" },
] as const;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[11px] font-semibold text-[#111827]">{children}</label>;
}

function InputBase({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 w-full rounded-lg border border-[#e3e6ea] bg-[#f5f6f8] px-3 text-[12px] text-[#1f2b20] outline-none placeholder:text-[#a0a9b3] focus:border-[#2d4f36]/30 focus:ring-1 focus:ring-[#2d4f36]/20 ${className ?? ""}`}
    />
  );
}

export default function NuovoTicketPage() {
  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
          <DashboardViewHeader
            title="Crea nuovo ticket"
            backHref="/dashboard/centro-assistenza"
            backAriaLabel="Torna al centro assistenza"
          />

          <div className="mx-auto w-full max-w-5xl space-y-3 px-4 py-4 lg:px-7 lg:py-5">
            <section className="flex items-start justify-between gap-3 rounded-xl border border-[#b8dfb4] bg-[#ebf8e9] px-4 py-3">
              <div>
                <h2 className="text-[11px] font-bold text-[#1f2b20]">Prima di creare un ticket...</h2>
                <p className="mt-1 text-[10px] text-[#3f5f43]">
                  Hai controllato le nostre{" "}
                  <a href="#" className="font-semibold text-[#5DBE54] hover:underline">
                    Guide
                  </a>{" "}
                  e risorse e la{" "}
                  <a href="#" className="font-semibold text-[#5DBE54] hover:underline">
                    FAQ
                  </a>
                  ? Potresti trovare la risposta immediatamente!
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[#7fa582] hover:cursor-pointer hover:bg-[#dff0de]"
                aria-label="Chiudi suggerimento"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </section>

            <section className="rounded-xl border border-[#e5e7eb] bg-white p-4">
              <h2 className="text-[17px] font-bold tracking-tight text-[#111827]">Categoria del problema</h2>
              <p className="mt-1 text-[10px] text-[#9aa1ab]">
                Seleziona la categoria che meglio descrive la tua richiesta
              </p>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.title}
                    type="button"
                    className="flex items-start justify-between rounded-lg border border-[#e3e6ea] bg-[#ffffff] px-3 py-3 text-left transition-colors hover:cursor-pointer hover:border-[#cad1d9] hover:bg-white"
                  >
                    <div>
                      <div className="text-[11px] font-semibold text-[#111827]">{cat.title}</div>
                      <div className="mt-0.5 text-[10px] text-[#9aa1ab]">{cat.subtitle}</div>
                    </div>
                    <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c5cbd3]" />
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-[#e5e7eb] bg-white p-4">
              <h2 className="text-[17px] font-bold tracking-tight text-[#111827]">Dettagli del Problema</h2>
              <p className="mt-1 text-[10px] text-[#6B7280]">
                Fornisci quante più informazioni possibili per aiutarci a risolvere velocemente
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <FieldLabel>
                    Oggetto <span className="text-[#e11d48]">*</span>
                  </FieldLabel>
                  <InputBase placeholder="Es: Bonifico non ricevuto per ordine #2345" />
                  <p className="mt-1 text-[9px] text-[#6B7280]">Sii specifico e conciso</p>
                </div>

                <div>
                  <FieldLabel>
                    Descrizione Dettagliata <span className="text-[#e11d48]">*</span>
                  </FieldLabel>
                  <textarea
                    className="h-36 w-full resize-none rounded-lg border border-[#e3e6ea] bg-[#f5f6f8] px-3 py-2.5 text-[12px] text-[#1f2b20] outline-none placeholder:text-[#a0a9b3] focus:border-[#2d4f36]/30 focus:ring-1 focus:ring-[#2d4f36]/20"
                    placeholder={
                      "Descrivi il problema in dettaglio, includi:\n- Cosa stavi facendo quando è successo il problema\n- Messaggi di errore ricevuti\n- Steps per replicare il problema\n- Screenshot o allegati se disponibili"
                    }
                  />
                  <div className="mt-1 flex items-center justify-between text-[9px] text-[#6B7280]">
                    <span>Più dettagli fornisci, più velocemente possiamo aiutarti</span>
                    <span>0 / 2000 caratteri</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Numero Ordine/Transazione</FieldLabel>
                    <div className="relative">
                      <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa3ad]" />
                      <InputBase className="pl-10" placeholder="Es: ORC-2024-12345" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Data dell&apos;Evento</FieldLabel>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa3ad]" />
                      <InputBase className="pl-10" placeholder="mm/dd/yyyy" />
                    </div>
                    <p className="mt-1 text-[9px] text-[#6B7280]">Quando si è verificato il problema</p>
                  </div>
                </div>

                <div>
                  <FieldLabel>URL o Pagina Specifica</FieldLabel>
                  <div className="relative">
                    <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa3ad]" />
                    <InputBase className="pl-10" placeholder="https://seller.3rate.it/..." />
                  </div>
                  <p className="mt-1 text-[9px] text-[#6B7280]">Dove si è verificato il problema</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[#e5e7eb] bg-white p-4">
              <h2 className="text-[17px] font-bold tracking-tight text-[#111827]">Allegati</h2>
              <p className="mt-1 text-[10px] text-[#9aa1ab]">
                Carica screenshot, documenti o file che possano aiutarci a capire meglio il problema
              </p>

              <div className="mt-4 rounded-lg border border-dashed border-[#d6dbe1] bg-[#fcfcfd] p-6">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eef1f5] text-[#9aa3ad]">
                    <CloudUpload className="h-4 w-4" />
                  </div>
                  <p className="text-[12px] font-semibold text-[#1f2b20]">Trascina i file qui o clicca per selezionare</p>
                  <p className="mt-0.5 text-[10px] text-[#9aa1ab]">PNG, JPG, PDF, DOC fino a 10MB ciascuno</p>
                  <button
                    type="button"
                    className="mt-3 inline-flex h-7 items-center rounded-md bg-[#214e3a] px-3 text-[10px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e]"
                  >
                    Seleziona file
                  </button>
                </div>
              </div>

              <ul className="mt-3 divide-y divide-[#edf0f3] rounded-lg border border-[#edf0f3] bg-[#fcfdfe]">
                {ATTACHMENTS.map((file) => (
                  <li key={file.name} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div>
                      <div className="text-[10px] font-semibold text-[#1f2b20]">{file.name}</div>
                      <div className="text-[9px] text-[#a0a9b3]">{file.size}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#e8f7ea] text-[#22c55e] hover:cursor-pointer"
                        aria-label={`Allegato ${file.name} caricato`}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#fff1f2] text-[#ef4444] hover:cursor-pointer"
                        aria-label={`Rimuovi allegato ${file.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-[#e5e7eb] bg-white p-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-lg bg-[#214e3a] px-4 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e]"
                >
                  Invia ticket
                </button>
              </div>
              <hr className="my-3 border-t border-[#e5e7eb]" />
              <p className="flex items-center gap-1.5 text-[9px] text-[#9aa1ab]">
                <CircleAlert className="h-3.5 w-3.5 text-[#76C043]" />
                Inviando questo ticket accetti i nostri{" "}
                <a href="#" className="font-semibold text-[#6b7280] hover:underline">
                  Termini di Servizio
                </a>{" "}
                e{" "}
                <a href="#" className="font-semibold text-[#6b7280] hover:underline">
                  Privacy Policy
                </a>
                . Il nostro team risponderà il prima possibile.
              </p>
            </section>
          </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
