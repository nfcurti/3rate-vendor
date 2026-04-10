"use client";

import { Package, Save, WandSparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { DashboardViewHeader } from "../../_components/DashboardViewHeader";
import { FormDropdown } from "../../_components/FormDropdown";
import { Sidebar } from "../../_components/Sidebar";
import { ViewTransition } from "../../_components/ViewTransition";

function parseSkus(params: URLSearchParams) {
  const batch = params.get("skus");
  if (batch) return batch.split(",").map((v) => v.trim()).filter(Boolean);
  const single = params.get("sku");
  return single ? [single] : [];
}

function GestioneMagazzinoContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "edit";
  const skus = parseSkus(searchParams);

  const title =
    mode === "batch"
      ? "Modifica in blocco"
      : mode === "restock"
        ? "Rifornisci prodotto"
        : "Modifica prodotto";

  const ctaLabel =
    mode === "batch"
      ? "Applica modifiche in blocco"
      : mode === "restock"
        ? "Conferma rifornimento"
        : "Salva modifiche";

  const isBatch = mode === "batch";
  const isRestock = mode === "restock";

  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
            <DashboardViewHeader
              title={title}
              backHref="/dashboard/magazzino"
              backAriaLabel="Torna al magazzino"
            />

            <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-7 lg:px-8">
              <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <div className="flex items-center gap-3">
                  {isBatch ? (
                    <WandSparkles className="h-5 w-5 text-[#214e3a]" />
                  ) : (
                    <Package className="h-5 w-5 text-[#214e3a]" />
                  )}
                  <div>
                    <div className="text-[14px] font-semibold text-[#111827]">
                      {isBatch ? `${skus.length} prodotti selezionati` : "Prodotto selezionato"}
                    </div>
                    <div className="mt-1 text-[11px] text-[#6b7280]">
                      {skus.length > 0 ? skus.join(", ") : "Nessun SKU specificato"}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                      Nome prodotto
                    </label>
                    <input
                      type="text"
                      placeholder={isBatch ? "Lascia vuoto per non modificare" : "Nome prodotto"}
                      className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                      Categoria
                    </label>
                    <FormDropdown
                      options={[
                        { value: "all", label: "Seleziona categoria" },
                        { value: "elettronica", label: "Elettronica" },
                        { value: "casa", label: "Casa" },
                      ]}
                      value="all"
                      onChange={() => {}}
                      placeholder="Seleziona categoria"
                      aria-label="Categoria prodotto"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                      Prezzo (€)
                    </label>
                    <input
                      type="text"
                      placeholder={isBatch ? "Lascia vuoto per non modificare" : "79,00"}
                      className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                      Stato
                    </label>
                    <FormDropdown
                      options={[
                        { value: "attivo", label: "Attivo" },
                        { value: "esaurito", label: "Esaurito" },
                      ]}
                      value="attivo"
                      onChange={() => {}}
                      placeholder="Stato prodotto"
                      aria-label="Stato prodotto"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                      {isRestock ? "Quantità da aggiungere" : "Disponibilità"}
                    </label>
                    <input
                      type="text"
                      placeholder={isRestock ? "Es: +20" : isBatch ? "Lascia vuoto per non modificare" : "20"}
                      className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                      Posizione magazzino
                    </label>
                    <input
                      type="text"
                      placeholder={isBatch ? "Lascia vuoto per non modificare" : "Scaffale A-12"}
                      className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#214e3a] px-5 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e]"
                  >
                    <Save className="h-4 w-4" />
                    {ctaLabel}
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

export default function GestioneMagazzinoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f5f2]" />}>
      <GestioneMagazzinoContent />
    </Suspense>
  );
}
