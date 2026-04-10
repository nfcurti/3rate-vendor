"use client";

import { Save } from "lucide-react";
import Link from "next/link";
import { DashboardViewHeader } from "../../../_components/DashboardViewHeader";
import { Sidebar } from "../../../_components/Sidebar";
import { ViewTransition } from "../../../_components/ViewTransition";

export default function NuovoContoPage() {
  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
            <DashboardViewHeader
              title="Aggiungi conto bancario"
              backHref="/dashboard/pagamenti"
              backAriaLabel="Torna ai pagamenti"
            />

            <div className="mx-auto w-full max-w-4xl px-4 py-7 lg:px-8">
              <section className="rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">Banca</label>
                    <input className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px]" placeholder="Es: Intesa Sanpaolo" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">Intestatario</label>
                    <input className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px]" placeholder="Ragione sociale" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">IBAN</label>
                    <input className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] font-mono" placeholder="IT60 X054 2811 1010 0000 0123 456" />
                  </div>
                </div>

                <label className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold text-[#1f2b20]">
                  <input type="checkbox" className="h-4 w-4 rounded border-black/20" />
                  Imposta come conto principale
                </label>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <Link href="/dashboard/pagamenti" className="inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-[12px] font-semibold text-[#1f2b20]">
                    Annulla
                  </Link>
                  <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#214e3a] px-4 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e]">
                    <Save className="h-4 w-4" />
                    Salva conto
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
