"use client";

import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { DashboardViewHeader } from "../../_components/DashboardViewHeader";
import { Sidebar } from "../../_components/Sidebar";
import { ViewTransition } from "../../_components/ViewTransition";

export default function CambiaPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
            <DashboardViewHeader
              title="Cambia password"
              backHref="/dashboard/impostazioni"
              backAriaLabel="Torna alle impostazioni"
            />

            <div className="mx-auto w-full max-w-3xl px-4 py-7 lg:px-8">
              <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="h-5 w-5 text-[#214e3a]" />
                  <h2 className="text-[16px] font-semibold text-[#111827]">Aggiorna credenziali account</h2>
                </div>
                <p className="mt-1 text-[12px] text-[#6b7280]">
                  Scegli una password robusta e non riutilizzata su altri servizi.
                </p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">Password attuale</label>
                    <input
                      type="password"
                      className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                      placeholder="Inserisci password attuale"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">Nuova password</label>
                    <input
                      type="password"
                      className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                      placeholder="Minimo 8 caratteri"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">Conferma nuova password</label>
                    <input
                      type="password"
                      className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                      placeholder="Ripeti nuova password"
                    />
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
                    className="inline-flex h-10 items-center rounded-xl bg-[#214e3a] px-4 text-[12px] font-semibold text-white hover:bg-[#1a3f2e]"
                  >
                    Salva nuova password
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
