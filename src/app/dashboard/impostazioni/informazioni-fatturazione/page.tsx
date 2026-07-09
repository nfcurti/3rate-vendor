"use client";

import { Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { formatApiErrorMessage } from "@/lib/business-auth";
import { businessBillingApi } from "@/lib/business-billing";
import { businessInfoApi, ensureBusinessInfoRecord } from "@/lib/business-info";
import { findRegionByProvinceCode } from "@/lib/italian-regions";
import { DashboardViewHeader } from "../../_components/DashboardViewHeader";
import { Sidebar } from "../../_components/Sidebar";
import { ViewTransition } from "../../_components/ViewTransition";

const inputClass =
  "h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] text-[#1f2b20] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">{children}</label>;
}

function isPlaceholder(value: string) {
  return value.trim() === "-";
}

function normalizeLoadedField(value: string | undefined | null) {
  if (!value || isPlaceholder(value)) return "";
  return value;
}

type BillingForm = {
  ragioneSociale: string;
  partitaIVA: string;
  codiceFiscale: string;
  codiceSDI: string;
  fullAddress: string;
  city: string;
  cap: string;
  province: string;
  region: string;
  email: string;
  phoneNumber: string;
  pec: string;
};

const emptyForm = (): BillingForm => ({
  ragioneSociale: "",
  partitaIVA: "",
  codiceFiscale: "",
  codiceSDI: "",
  fullAddress: "",
  city: "",
  cap: "",
  province: "",
  region: "",
  email: "",
  phoneNumber: "",
  pec: "",
});

export default function InformazioniFatturazionePage() {
  const [form, setForm] = useState<BillingForm>(emptyForm);
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
      setStatusMessage(null);

      try {
        const [billingInfo, accountPayload] = await Promise.all([
          businessBillingApi.getInfo(),
          ensureBusinessInfoRecord().catch(() => businessInfoApi.getAccountInfo()),
        ]);

        if (cancelled) return;

        const info = billingInfo as Record<string, string | undefined>;
        const account = accountPayload.account;
        const province = normalizeLoadedField(info.province);
        const region =
          normalizeLoadedField(info.region) || findRegionByProvinceCode(province) || "";

        setForm({
          ragioneSociale: normalizeLoadedField(info.ragioneSociale),
          partitaIVA: normalizeLoadedField(info.partitaIVA),
          codiceFiscale: normalizeLoadedField(info.codiceFiscale),
          codiceSDI: normalizeLoadedField(accountPayload.info?.codiceSDI),
          fullAddress: normalizeLoadedField(info.fullAddress),
          city: normalizeLoadedField(info.city),
          cap: normalizeLoadedField(info.cap),
          province,
          region,
          email: normalizeLoadedField(account?.email),
          phoneNumber: normalizeLoadedField(accountPayload.info?.phoneNumber),
          pec: normalizeLoadedField(info.pec),
        });
      } catch (error) {
        if (!cancelled) {
          setStatusMessage({
            message: formatApiErrorMessage(error),
            tone: "error",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField<K extends keyof BillingForm>(key: K, value: BillingForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setStatusMessage(null);

    try {
      const region =
        form.region.trim() || findRegionByProvinceCode(form.province.trim()) || form.region;

      await businessBillingApi.putInfo({
        ragioneSociale: form.ragioneSociale,
        partitaIVA: form.partitaIVA,
        codiceFiscale: form.codiceFiscale,
        fullAddress: form.fullAddress,
        cap: form.cap,
        city: form.city,
        province: form.province,
        region,
        pec: form.pec,
      });

      setStatusMessage({
        message: "Informazioni fatturazione aggiornate.",
        tone: "success",
      });
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
              title="Modifica informazioni fatturazione"
              backHref="/dashboard/impostazioni"
              backAriaLabel="Torna alle impostazioni"
            />

            <div className="mx-auto w-full max-w-5xl px-4 py-7 lg:px-8">
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

              <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-[#214e3a]" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <FieldLabel>Ragione sociale</FieldLabel>
                        <input
                          className={inputClass}
                          value={form.ragioneSociale}
                          onChange={(event) => updateField("ragioneSociale", event.target.value)}
                        />
                      </div>
                      <div>
                        <FieldLabel>Partita IVA</FieldLabel>
                        <input
                          className={inputClass}
                          value={form.partitaIVA}
                          onChange={(event) => updateField("partitaIVA", event.target.value)}
                        />
                      </div>
                      <div>
                        <FieldLabel>Codice fiscale</FieldLabel>
                        <input
                          className={inputClass}
                          value={form.codiceFiscale}
                          onChange={(event) => updateField("codiceFiscale", event.target.value)}
                        />
                      </div>
                      <div>
                        <FieldLabel>Codice SDI</FieldLabel>
                        <input
                          className={inputClass}
                          value={form.codiceSDI}
                          onChange={(event) => updateField("codiceSDI", event.target.value)}
                        />
                      </div>
                      <div>
                        <FieldLabel>Indirizzo</FieldLabel>
                        <input
                          className={inputClass}
                          value={form.fullAddress}
                          onChange={(event) => updateField("fullAddress", event.target.value)}
                        />
                      </div>
                      <div>
                        <FieldLabel>Città</FieldLabel>
                        <input
                          className={inputClass}
                          value={form.city}
                          onChange={(event) => updateField("city", event.target.value)}
                        />
                      </div>
                      <div>
                        <FieldLabel>CAP</FieldLabel>
                        <input
                          className={inputClass}
                          value={form.cap}
                          onChange={(event) => updateField("cap", event.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel>Provincia</FieldLabel>
                        <input
                          className={inputClass}
                          value={form.province}
                          onChange={(event) => updateField("province", event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                      <Link
                        href="/dashboard/impostazioni"
                        className="inline-flex h-10 items-center rounded-xl border border-black/10 bg-white px-4 text-[12px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
                      >
                        Annulla
                      </Link>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleSave()}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#214e3a] px-4 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Salvataggio...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Salva modifiche
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </section>
            </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
