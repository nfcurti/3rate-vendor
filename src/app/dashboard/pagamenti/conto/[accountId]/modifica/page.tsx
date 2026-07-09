"use client";

import { Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { formatApiErrorMessage } from "@/lib/business-auth";
import { businessPaymentsApi } from "@/lib/business-payments";
import { DashboardViewHeader } from "../../../../_components/DashboardViewHeader";
import { Sidebar } from "../../../../_components/Sidebar";
import { ViewTransition } from "../../../../_components/ViewTransition";

export default function ModificaContoPage() {
  const params = useParams<{ accountId: string }>();
  const accountId = params.accountId;
  const router = useRouter();
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [iban, setIban] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const accounts = await businessPaymentsApi.getBankAccounts();
        const account = accounts.find((row) => row._id === accountId);
        if (!cancelled && account) {
          setBankName(account.bankName || "");
          setAccountHolder(account.accountHolder || "");
          setIban(account.iban || "");
          setIsDefault(Boolean(account.isDefault));
        }
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

  async function handleSave() {
    setSaving(true);
    setStatusMessage(null);
    try {
      await businessPaymentsApi.updateBankAccount(accountId, {
        bankName: bankName.trim(),
        accountHolder: accountHolder.trim(),
        iban: iban.trim(),
        isDefault,
      });
      router.push("/dashboard/pagamenti");
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />
        <main className="w-full">
          <ViewTransition>
            <DashboardViewHeader
              title="Modifica conto bancario"
              backHref="/dashboard/pagamenti"
              backAriaLabel="Torna ai pagamenti"
            />
            <div className="mx-auto w-full max-w-4xl px-4 py-7 lg:px-8">
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
                <section className="rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">Banca</label>
                      <input
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">Intestatario</label>
                      <input
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">IBAN</label>
                      <input
                        value={iban}
                        onChange={(e) => setIban(e.target.value)}
                        className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 font-mono text-[12px]"
                      />
                    </div>
                  </div>
                  <label className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold text-[#1f2b20]">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="h-4 w-4 rounded border-black/20"
                    />
                    Imposta come conto principale
                  </label>
                  <div className="mt-6 flex items-center justify-end gap-2">
                    <Link
                      href="/dashboard/pagamenti"
                      className="inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-[12px] font-semibold text-[#1f2b20] hover:cursor-pointer"
                    >
                      Annulla
                    </Link>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSave()}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#214e3a] px-4 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Salvataggio..." : "Salva modifiche"}
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
