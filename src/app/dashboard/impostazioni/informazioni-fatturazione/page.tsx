"use client";

import { Save } from "lucide-react";
import Link from "next/link";
import { DashboardViewHeader } from "../../_components/DashboardViewHeader";
import { Sidebar } from "../../_components/Sidebar";
import { ViewTransition } from "../../_components/ViewTransition";

const inputClass =
  "h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] text-[#1f2b20] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">{children}</label>;
}

export default function InformazioniFatturazionePage() {
  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
            <DashboardViewHeader
              title="Modifica informazioni fatturazione"
              backHref="/dashboard/impostazioni"
              backAriaLabel="Torna alle impostazioni"
            />

            <div className="mx-auto w-full max-w-5xl px-4 py-7 lg:px-8">
              <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FieldLabel>Ragione sociale</FieldLabel>
                    <input className={inputClass} defaultValue="Tech Store Milano S.r.l." />
                  </div>
                  <div>
                    <FieldLabel>Partita IVA</FieldLabel>
                    <input className={inputClass} defaultValue="IT12345678901" />
                  </div>
                  <div>
                    <FieldLabel>Codice fiscale</FieldLabel>
                    <input className={inputClass} defaultValue="12345678901" />
                  </div>
                  <div>
                    <FieldLabel>Codice SDI</FieldLabel>
                    <input className={inputClass} defaultValue="ABCDE12" />
                  </div>
                  <div>
                    <FieldLabel>Indirizzo</FieldLabel>
                    <input className={inputClass} defaultValue="Via Roma 123" />
                  </div>
                  <div>
                    <FieldLabel>Città</FieldLabel>
                    <input className={inputClass} defaultValue="Milano" />
                  </div>
                  <div>
                    <FieldLabel>CAP</FieldLabel>
                    <input className={inputClass} defaultValue="20121" />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Provincia</FieldLabel>
                    <input className={inputClass} defaultValue="Milano (MI)" />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <Link
                    href="/dashboard/impostazioni"
                    className="inline-flex h-10 items-center rounded-xl border border-black/10 bg-white px-4 text-[12px] font-semibold text-[#1f2b20] hover:bg-black/5"
                  >
                    Annulla
                  </Link>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#214e3a] px-4 text-[12px] font-semibold text-white hover:bg-[#1a3f2e]"
                  >
                    <Save className="h-4 w-4" />
                    Salva modifiche
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
