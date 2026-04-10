"use client";

import { Bell, CheckCheck } from "lucide-react";
import { Sidebar } from "../_components/Sidebar";
import { ViewTransition } from "../_components/ViewTransition";
import { DashboardViewHeader } from "../_components/DashboardViewHeader";

const notifications = [
  { id: 1, title: "Bonifico in arrivo", body: "Riceverai €4.420,15 domani sul conto principale.", when: "Oggi, 10:32" },
  { id: 2, title: "Nuovo ticket aggiornato", body: "Supporto ha risposto al ticket #TICK-3892.", when: "Ieri, 17:08" },
  { id: 3, title: "Scorte basse", body: "3 prodotti hanno quantità inferiore alla soglia minima.", when: "2 giorni fa" },
] as const;

export default function NotifichePage() {
  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
            <DashboardViewHeader title="Notifiche" backHref="/dashboard" backAriaLabel="Torna alla dashboard" />

            <div className="mx-auto w-full max-w-6xl px-4 py-7 lg:px-8">
              <section className="rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[16px] font-semibold tracking-tight text-[#111827]">Centro notifiche</h2>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-[12px] font-semibold text-[#1f2b20] hover:bg-black/5"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Segna tutte come lette
                  </button>
                </div>

                <ul className="mt-5 space-y-3">
                  {notifications.map((n) => (
                    <li key={n.id} className="rounded-xl border border-black/10 bg-[#f8faf8] p-4">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ecf8eb] text-[#2d4f36]">
                          <Bell className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-[#111827]">{n.title}</div>
                          <p className="mt-1 text-[12px] text-[#4b5563]">{n.body}</p>
                          <p className="mt-2 text-[10px] font-semibold text-[#9aa39a]">{n.when}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
