"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { formatApiErrorMessage } from "@/lib/business-auth";
import { businessPaymentsApi } from "@/lib/business-payments";
import { DashboardViewHeader } from "../../../../_components/DashboardViewHeader";
import { Sidebar } from "../../../../_components/Sidebar";
import { ViewTransition } from "../../../../_components/ViewTransition";

export default function RimuoviContoPage() {
  const params = useParams<{ accountId: string }>();
  const accountId = params.accountId;
  const router = useRouter();
  const [label, setLabel] = useState("Conto bancario");
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const accounts = await businessPaymentsApi.getBankAccounts();
        const account = accounts.find((row) => row._id === accountId);
        if (!cancelled && account?.bankName) setLabel(account.bankName);
      } catch (error) {
        if (!cancelled) {
          setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  async function handleRemove() {
    setRemoving(true);
    setStatusMessage(null);
    try {
      await businessPaymentsApi.deleteBankAccount(accountId);
      router.push("/dashboard/pagamenti");
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setRemoving(false);
    }
  }

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
              {statusMessage ? (
                <p
                  className={clsx(
                    "mb-4 text-xs font-semibold",
                    statusMessage.tone === "success" ? "text-[#2f6b3c]" : "text-red-600"
                  )}
                >
                  {statusMessage.message}
                </p>
              ) : null}
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-[#214e3a]" />
                </div>
              ) : (
                <section className="rounded-2xl border border-[#fecaca] bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#fee2e2] text-[#b42318]">
                      <TriangleAlert className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-[16px] font-semibold text-[#111827]">Conferma rimozione</h2>
                      <p className="mt-1 text-[12px] text-[#6b7280]">
                        Stai per rimuovere il conto{" "}
                        <span className="font-semibold text-[#111827]">{label}</span>. Questa azione non può essere annullata.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-end gap-2">
                    <Link
                      href="/dashboard/pagamenti"
                      className="inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-[12px] font-semibold text-[#1f2b20] hover:cursor-pointer"
                    >
                      Annulla
                    </Link>
                    <button
                      type="button"
                      disabled={removing}
                      onClick={() => void handleRemove()}
                      className="inline-flex h-10 items-center rounded-xl bg-[#b42318] px-4 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {removing ? "Rimozione..." : "Conferma rimozione"}
                    </button>
                  </div>
                </section>
              )}
            </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
