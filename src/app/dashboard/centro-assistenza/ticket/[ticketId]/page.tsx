import {
  Image as ImageIcon,
  Link2,
  Paperclip,
} from "lucide-react";
import { DashboardViewHeader } from "../../../_components/DashboardViewHeader";
import { Sidebar } from "../../../_components/Sidebar";
import { ViewTransition } from "../../../_components/ViewTransition";

type TicketPageProps = {
  params: Promise<{
    ticketId: string;
  }>;
};

const MESSAGES = [
  {
    author: "Tech Store Milano",
    role: "",
    at: "16 Dic 2024, 10:23",
    avatar: "TS",
    avatarClass: "bg-[#d6dadf] text-[#3f4753]",
    body: [
      "Buongiorno,",
      "Non ho ancora ricevuto il bonifico del 15 Dicembre. L'importo risulta processato ma non è stato accreditato sul mio conto bancario. Potete verificare lo stato del pagamento?",
      "L'importo dovrebbe essere di €2,847.50.",
    ],
  },
  {
    author: "Marco R.",
    role: "Supporto",
    at: "16 Dic 2024, 11:15",
    avatar: "MR",
    avatarClass: "bg-[linear-gradient(135deg,#65d46e,#2ea36d)] text-white",
    body: [
      "Buongiorno Tech Store Milano,",
      "Grazie per averci contattato. Ho verificato il suo account e confermo che il bonifico di €2,847.50 è stato processato il 15 Dicembre alle ore 14:32.",
      "Il pagamento è stato inviato al seguente IBAN: IT22************4567",
      "Potrebbe gentilmente verificare se l'IBAN è corretto?",
    ],
  },
  {
    author: "Tech Store Milano",
    role: "",
    at: "16 Dic 2024, 14:12",
    avatar: "TS",
    avatarClass: "bg-[#d6dadf] text-[#3f4753]",
    body: [
      "Sì, l'IBAN è corretto. Ho controllato con la mia banca e mi hanno confermato che non hanno ricevuto alcun bonifico da 3Rate.",
      "Potete fornirmi il CRO/TRN del bonifico per tracciarlo con la banca?",
    ],
  },
] as const;

export default async function TicketDetailPage({ params }: TicketPageProps) {
  const { ticketId } = await params;
  const ticketCode = ticketId.toUpperCase();

  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
          <DashboardViewHeader
            title={`Ticket #${ticketCode}`}
            backHref="/dashboard/centro-assistenza"
            backAriaLabel="Torna ai ticket"
          />

          <div className="grid h-auto grid-cols-1 overflow-visible lg:h-[calc(100vh-72px)] lg:grid-cols-[1fr_280px] lg:overflow-hidden">
            <section className="flex min-h-0 flex-col bg-white max-lg:min-h-[min(420px,calc(100dvh-10rem))] lg:max-h-none">
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <div className="mx-auto w-full max-w-[820px] space-y-4">
                  {MESSAGES.map((message, idx) => (
                    <article key={`${message.author}-${idx}`} className="flex gap-3">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${message.avatarClass}`}
                      >
                        {message.avatar}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 lg:flex-nowrap">
                          <span className="text-[12px] font-semibold text-[#111827]">{message.author}</span>
                          {message.role ? (
                            <span className="text-[10px] font-semibold text-[#2E4F38] bg-[#76C04333] rounded-full px-2 py-1">{message.role}</span>
                          ) : null}
                          <span className="text-[10px] text-[#9ca3af] lg:whitespace-nowrap">{message.at}</span>
                        </div>

                        <div className="mt-1 rounded-xl bg-[#f5f6f8] px-4 py-3 text-[12px] leading-relaxed text-[#1f2937]">
                          {message.body.map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="shrink-0 border-t border-[#e6e8ec] bg-white px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <div className="mx-auto flex w-full max-w-[820px] flex-wrap items-center gap-2 lg:flex-nowrap">
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#e3e6ea] bg-[#f7f8fa] text-[#6b7280] hover:cursor-pointer"
                      aria-label="Allega file"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#e3e6ea] bg-[#f7f8fa] text-[#6b7280] hover:cursor-pointer"
                      aria-label="Allega immagine"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Scrivi un messaggio..."
                    className="h-8 min-w-0 flex-1 basis-[min(100%,12rem)] rounded-lg border border-[#e3e6ea] bg-[#f5f6f8] px-3 text-[11px] outline-none placeholder:text-[#a0a9b3] focus:border-[#2d4f36]/35 focus:ring-1 focus:ring-[#2d4f36]/20"
                  />
                  <button
                    type="button"
                    className="inline-flex h-8 shrink-0 items-center rounded-lg bg-[#2d5b40] px-4 text-[11px] font-semibold text-white hover:cursor-pointer"
                  >
                    Invia
                  </button>
                </div>
              </div>
            </section>

            <aside className="border-[#e6e8ec] bg-[#f8f9fb] max-lg:border-l-0 max-lg:border-t lg:border-l lg:border-t-0">
              <div className="space-y-0">
                <section className="border-b border-[#e6e8ec] bg-white px-4 py-4">
                  <h2 className="text-[15px] font-semibold text-[#111827]">Dettagli Ticket</h2>
                  <dl className="mt-3 space-y-2">
                    <div>
                      <dt className="text-[10px] text-[#9ca3af]">Categoria</dt>
                      <dd className="text-[12px] font-semibold text-[#111827]">Pagamenti &amp; Bonifici</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-[#9ca3af]">Creato il</dt>
                      <dd className="text-[12px] font-semibold text-[#111827]">16 Dicembre 2024, 10:23</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-[#9ca3af]">Ultimo aggiornamento</dt>
                      <dd className="text-[12px] font-semibold text-[#111827]">16 Dicembre 2024, 14:08</dd>
                    </div>
                  </dl>
                </section>

                <section className="px-4 py-4 border-b border-[#e6e8ec] mb-4">
                  <h2 className="text-[15px] font-semibold text-[#111827]">Allegati (1)</h2>
                  <div className="mt-3 rounded-md border border-[#e3e6ea] bg-white px-3 py-2">
                    <div className="flex items-start gap-2">
                      <Link2 className="mt-0.5 h-3.5 w-3.5 text-[#98a2b3]" />
                      <div>
                        <div className="text-[11px] font-semibold text-[#111827]">Bonifico_15_Dic_2024.pdf</div>
                        <div className="text-[10px] text-[#9ca3af]">248 KB • 16 Dic 2024</div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="px-4 pt-1">
                  <button
                    type="button"
                    className="inline-flex h-9 w-full items-center justify-center rounded-md border border-[#f1c7c7] bg-[#fff5f5] text-[12px] font-semibold text-[#c24141]"
                  >
                    Chiudi Ticket
                  </button>
                </div>
              </div>
            </aside>
          </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
