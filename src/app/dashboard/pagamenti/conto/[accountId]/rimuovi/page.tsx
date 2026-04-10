import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { DashboardViewHeader } from "../../../../_components/DashboardViewHeader";
import { Sidebar } from "../../../../_components/Sidebar";
import { ViewTransition } from "../../../../_components/ViewTransition";

type Props = {
  params: Promise<{ accountId: string }>;
};

export default async function RimuoviContoPage({ params }: Props) {
  const { accountId } = await params;
  const label = accountId === "intesa-sanpaolo" ? "Intesa Sanpaolo" : "UniCredit";

  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
            <DashboardViewHeader
              title="Rimuovi conto bancario"
              backHref="/dashboard/pagamenti"
              backAriaLabel="Torna ai pagamenti"
            />

            <div className="mx-auto w-full max-w-3xl px-4 py-7 lg:px-8">
              <section className="rounded-2xl border border-[#fecaca] bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#fee2e2] text-[#b42318]">
                    <TriangleAlert className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#111827]">Conferma rimozione</h2>
                    <p className="mt-1 text-[12px] text-[#6b7280]">
                      Stai per rimuovere il conto <span className="font-semibold text-[#111827]">{label}</span>. Questa azione non può essere annullata.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <Link href="/dashboard/pagamenti" className="inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-[12px] font-semibold text-[#1f2b20]">
                    Annulla
                  </Link>
                  <button type="button" className="inline-flex h-10 items-center rounded-xl bg-[#b42318] px-4 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#991b1b]">
                    Conferma rimozione
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
