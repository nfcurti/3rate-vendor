"use client";

import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  businessAuthApi,
  getBusinessAuthToken,
} from "@/lib/business-auth";
import { DashboardViewHeader } from "../../_components/DashboardViewHeader";
import { Sidebar } from "../../_components/Sidebar";
import { ViewTransition } from "../../_components/ViewTransition";

export default function CambiaPasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setStatus({ message: "Le password non coincidono.", tone: "error" });
      return;
    }

    const token = getBusinessAuthToken();
    if (!token) {
      setStatus({ message: "Sessione scaduta. Accedi di nuovo.", tone: "error" });
      return;
    }

    setIsSubmitting(true);

    try {
      await businessAuthApi.changePassword(oldPassword, newPassword, token);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStatus({
        message: "Password aggiornata con successo.",
        tone: "success",
      });
    } catch (error) {
      setStatus({
        message:
          error instanceof Error
            ? error.message
            : "Aggiornamento password non riuscito. Riprova.",
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  <h2 className="text-[16px] font-semibold text-[#111827]">
                    Aggiorna credenziali account
                  </h2>
                </div>
                <p className="mt-1 text-[12px] text-[#6b7280]">
                  Scegli una password robusta e non riutilizzata su altri servizi.
                </p>

                <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                      Password attuale
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(event) => setOldPassword(event.target.value)}
                      className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                      placeholder="Inserisci password attuale"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                      Nuova password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                      placeholder="Minimo 8 caratteri"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                      Conferma nuova password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                      placeholder="Ripeti nuova password"
                      required
                      minLength={8}
                    />
                  </div>

                  {status && (
                    <p
                      className={`text-xs font-semibold ${
                        status.tone === "success" ? "text-[#2f6b3c]" : "text-red-600"
                      }`}
                    >
                      {status.message}
                    </p>
                  )}

                  <div className="mt-6 flex justify-end gap-2">
                    <Link
                      href="/dashboard/impostazioni"
                      className="inline-flex h-10 items-center rounded-xl border border-black/10 bg-white px-4 text-[12px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
                    >
                      Annulla
                    </Link>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex h-10 items-center rounded-xl bg-[#214e3a] px-4 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Salvataggio..." : "Salva nuova password"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
