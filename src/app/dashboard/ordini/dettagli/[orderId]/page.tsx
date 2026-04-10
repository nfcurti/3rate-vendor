import { Package, ReceiptText, Truck } from "lucide-react";
import { DashboardViewHeader } from "../../../_components/DashboardViewHeader";
import { Sidebar } from "../../../_components/Sidebar";
import { ViewTransition } from "../../../_components/ViewTransition";

type Props = {
  params: Promise<{ orderId: string }>;
};

export default async function OrdineDettaglioPage({ params }: Props) {
  const { orderId } = await params;
  const orderCode = `#${decodeURIComponent(orderId)}`;

  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
            <DashboardViewHeader
              title={`Dettagli ordine ${orderCode}`}
              backHref="/dashboard/ordini"
              backAriaLabel="Torna agli ordini"
            />

            <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-7 lg:px-8">
              <section className="rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-[#f8faf8] p-4 ring-1 ring-black/5">
                    <div className="flex items-center gap-2 text-[12px] font-semibold text-[#1f2b20]">
                      <Package className="h-4 w-4 text-[#214e3a]" />
                      Stato ordine
                    </div>
                    <div className="mt-2 inline-flex rounded-full bg-[#e7f6ea] px-3 py-1 text-[11px] font-semibold text-[#2f6b3c]">
                      Da spedire
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#f8faf8] p-4 ring-1 ring-black/5">
                    <div className="flex items-center gap-2 text-[12px] font-semibold text-[#1f2b20]">
                      <Truck className="h-4 w-4 text-[#214e3a]" />
                      Spedizione
                    </div>
                    <div className="mt-2 text-[12px] font-semibold text-[#111827]">Standard 24/48h</div>
                    <div className="text-[11px] text-[#6b7280]">Corriere: BRT</div>
                  </div>
                  <div className="rounded-xl bg-[#f8faf8] p-4 ring-1 ring-black/5">
                    <div className="flex items-center gap-2 text-[12px] font-semibold text-[#1f2b20]">
                      <ReceiptText className="h-4 w-4 text-[#214e3a]" />
                      Totale
                    </div>
                    <div className="mt-2 text-[16px] font-bold text-[#111827]">€149,99</div>
                    <div className="text-[11px] text-[#6b7280]">Pagamento completato</div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <h2 className="text-[16px] font-semibold tracking-tight text-[#111827]">Dettagli cliente</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#f8faf8] p-4 ring-1 ring-black/5">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9aa39a]">Nome</div>
                    <div className="mt-1 text-[13px] font-semibold text-[#111827]">Marco Rossi</div>
                  </div>
                  <div className="rounded-xl bg-[#f8faf8] p-4 ring-1 ring-black/5">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9aa39a]">Email</div>
                    <div className="mt-1 text-[13px] font-semibold text-[#111827]">marco.rossi@email.it</div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <h2 className="text-[16px] font-semibold tracking-tight text-[#111827]">Prodotti ordine</h2>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-[#f8faf8] px-4 py-3 ring-1 ring-black/5">
                    <div>
                      <div className="text-[13px] font-semibold text-[#111827]">Cuffie Wireless Pro</div>
                      <div className="text-[11px] text-[#6b7280]">SKU: CW-001</div>
                    </div>
                    <div className="text-[13px] font-semibold text-[#111827]">€149,99</div>
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
