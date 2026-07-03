"use client";

import {
  ArrowLeft,
  AlertCircle,
  Banknote,
  Bell,
  Calendar,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  LayoutGrid,
  Loader2,
  Mail,
  MoreVertical,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  businessInfoApi,
  ensureBusinessInfoRecord,
  getBusinessInitials,
  openingHoursFromApi,
  openingHoursToApi,
  saveBusinessProfile,
  uploadBusinessImage,
  type ProductCategory,
  type UiDayHours,
} from "@/lib/business-info";
import { formatApiErrorMessage, businessAuthApi, getBusinessAuthToken } from "@/lib/business-auth";
import {
  businessStripeApi,
  maskStripeAccountId,
  type StripeConnectStatus,
} from "@/lib/business-stripe";
import {
  findRegionByProvinceCode,
  getProvinceOptionsForRegion,
  ITALIAN_REGION_OPTIONS,
  normalizeProvinceCode,
} from "@/lib/italian-regions";
import { DashboardHelpMenu } from "../_components/DashboardHelpMenu";
import { DashboardViewHeader } from "../_components/DashboardViewHeader";
import { FormDropdown } from "../_components/FormDropdown";
import { Sidebar } from "../_components/Sidebar";
import { TimePicker } from "../_components/TimePicker";
import { ViewTransition } from "../_components/ViewTransition";

const inputClass =
  "h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] text-[#1f2b20] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20";

const textareaClass =
  "min-h-[120px] w-full resize-y rounded-xl border border-black/10 bg-[#F9FAFB] px-3 py-2.5 text-[12px] text-[#1f2b20] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20";

function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="mb-1.5 text-[12px] font-semibold text-[#1f2b20]">
      {children}
      {required ? <span className="text-red-600"> *</span> : null}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={clsx(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        disabled && "cursor-not-allowed bg-[#e5e7eb] opacity-45",
        !disabled && "hover:cursor-pointer",
        !disabled && checked && "bg-[#76C043]",
        !disabled && !checked && "bg-[#e5e7eb]",
      )}
    >
      <span
        className={clsx(
          "absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform",
          !disabled && checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

const TABS = [
  { id: "profilo" as const, label: "Profilo Negozio" },
  { id: "pagamenti" as const, label: "Pagamenti" },
  { id: "notifiche" as const, label: "Notifiche" },
  { id: "sicurezza" as const, label: "Sicurezza" },
  { id: "fatturazione" as const, label: "Fatturazione" },
];

const DAYS_IT = [
  { key: "lun", label: "Lunedì" },
  { key: "mar", label: "Martedì" },
  { key: "mer", label: "Mercoledì" },
  { key: "gio", label: "Giovedì" },
  { key: "ven", label: "Venerdì" },
  { key: "sab", label: "Sabato" },
  { key: "dom", label: "Domenica" },
] as const;

type DayKey = (typeof DAYS_IT)[number]["key"];

const defaultHours = (): Record<DayKey, UiDayHours> => ({
  lun: { open: true, start: "09:00", end: "18:00" },
  mar: { open: true, start: "09:00", end: "18:00" },
  mer: { open: true, start: "09:00", end: "18:00" },
  gio: { open: true, start: "09:00", end: "18:00" },
  ven: { open: true, start: "09:00", end: "18:00" },
  sab: { open: true, start: "09:00", end: "13:00" },
  dom: { open: false, start: "09:00", end: "18:00" },
});

const defaultProfileForm = () => ({
  ragioneSociale: "",
  partitaIVA: "",
  codiceFiscale: "",
  codiceSDI: "",
  email: "",
  pec: "",
  phoneNumber: "",
  whatsappNumber: "",
  fullAddress: "",
  cap: "",
  city: "",
  province: "",
  region: "",
});

const ADDRESS_FIELDS = ["fullAddress", "cap", "city", "province", "region"] as const;

function hasPartialAddress(form: ReturnType<typeof defaultProfileForm>) {
  const values = ADDRESS_FIELDS.map((key) => form[key].trim());
  const filled = values.filter(Boolean).length;
  return filled > 0 && filled < ADDRESS_FIELDS.length;
}

function isBlank(value: string) {
  return value.trim().length === 0;
}

function isPlaceholder(value: string) {
  return value.trim() === "-";
}

function isMissingBusinessField(value: string) {
  return isBlank(value) || isPlaceholder(value);
}

function normalizeLoadedField(value: string | undefined | null) {
  if (!value || isPlaceholder(value)) return "";
  return value;
}

const REQUIRED_BUSINESS_FIELDS = [
  "ragioneSociale",
  "partitaIVA",
  "codiceFiscale",
  "codiceSDI",
  "email",
  "phoneNumber",
] as const;

function hasCompleteAddress(form: ReturnType<typeof defaultProfileForm>) {
  return ADDRESS_FIELDS.every((key) => !isMissingBusinessField(form[key]));
}

function hasCompleteBusinessProfile(form: ReturnType<typeof defaultProfileForm>) {
  return (
    REQUIRED_BUSINESS_FIELDS.every((key) => !isMissingBusinessField(form[key])) &&
    hasCompleteAddress(form)
  );
}

function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= 8,
    specialChars: /[^A-Za-z0-9]/.test(password),
    numbers: /\d/.test(password),
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
  };
}

export default function ImpostazioniPage() {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("profilo");
  const [profileForm, setProfileForm] = useState(defaultProfileForm);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [hasBusinessInfo, setHasBusinessInfo] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);
  const [hoursEnabled, setHoursEnabled] = useState(true);
  const [dayHours, setDayHours] = useState<Record<DayKey, UiDayHours>>(defaultHours);
  const [storeDescription, setStoreDescription] = useState("");
  const [availableCategories, setAvailableCategories] = useState<ProductCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>({});
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [payoutFrequency, setPayoutFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [minPayout, setMinPayout] = useState("50");
  const [payCards, setPayCards] = useState(true);
  const [payKlarna, setPayKlarna] = useState(true);
  const [paySatispay, setPaySatispay] = useState(true);
  const [payCash, setPayCash] = useState(true);
  const [stripeConnect, setStripeConnect] = useState<StripeConnectStatus | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeOnboarding, setStripeOnboarding] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);

  const [notifEmailChannel, setNotifEmailChannel] = useState(true);
  const [notifOrdineNuovo, setNotifOrdineNuovo] = useState(true);
  const [notifOrdineAnnullato, setNotifOrdineAnnullato] = useState(true);
  const [notifReso, setNotifReso] = useState(true);
  const [notifPagamentoRicevuto, setNotifPagamentoRicevuto] = useState(true);
  const [notifPagamentoFallito, setNotifPagamentoFallito] = useState(true);
  const [notifRimborso, setNotifRimborso] = useState(true);
  const [notifScorteBasse, setNotifScorteBasse] = useState(true);
  const [notifEsaurito, setNotifEsaurito] = useState(true);
  const [notifNovita, setNotifNovita] = useState(true);
  const [notifNewsletter, setNotifNewsletter] = useState(false);

  const [secProfiloPubblico, setSecProfiloPubblico] = useState(true);
  const [secGeolocalizzazione, setSecGeolocalizzazione] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [fattCycle, setFattCycle] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setProfileLoading(true);
      setProfileStatus(null);

      try {
        let payload;
        try {
          payload = await ensureBusinessInfoRecord();
        } catch (bootstrapError) {
          payload = await businessInfoApi.getAccountInfo();
          if (!payload.info?._id && !cancelled) {
            setProfileStatus({
              message: formatApiErrorMessage(bootstrapError),
              tone: "error",
            });
          }
        }

        if (cancelled || !payload) return;

        const info = payload.info;
        const account = payload.account;

        setIsValidated(Boolean(account?.isValidated));
        setHasBusinessInfo(Boolean(info?._id));
        setProfilePictureUrl(info?.profilePictureUrl ?? null);
        const loadedProvince = normalizeProvinceCode(normalizeLoadedField(info?.province));
        const loadedRegion =
          normalizeLoadedField(info?.region) || findRegionByProvinceCode(loadedProvince) || "";

        setProfileForm({
          ragioneSociale: normalizeLoadedField(info?.ragioneSociale),
          partitaIVA: normalizeLoadedField(info?.partitaIVA),
          codiceFiscale: normalizeLoadedField(info?.codiceFiscale),
          codiceSDI: normalizeLoadedField(info?.codiceSDI),
          email: normalizeLoadedField(info?.email) || account?.email || "",
          pec: normalizeLoadedField(info?.pec),
          phoneNumber: normalizeLoadedField(info?.phoneNumber),
          whatsappNumber: normalizeLoadedField(info?.whatsappNumber),
          fullAddress: normalizeLoadedField(info?.fullAddress),
          cap: normalizeLoadedField(info?.cap),
          city: normalizeLoadedField(info?.city),
          province: loadedProvince,
          region: loadedRegion,
        });

        const [storeDescPayload, openingHoursPayload, categoriesPayload] =
          await Promise.all([
            businessInfoApi.getStoreDescription(),
            businessInfoApi.getOpeningHours(),
            businessInfoApi.getCategories(),
          ]);

        if (cancelled) return;

        const labels: Record<string, string> = {};
        categoriesPayload.forEach((category) => {
          if (category._id && category.name) labels[category._id] = category.name;
        });
        storeDescPayload.productCategories?.forEach((category) => {
          if (category._id && category.name) labels[category._id] = category.name;
        });

        setStoreDescription(storeDescPayload.storeDescription ?? "");
        setSelectedCategoryIds(storeDescPayload.productCategoryIds ?? []);
        setCategoryLabels(labels);
        setAvailableCategories(categoriesPayload);

        const { enabled, dayHours: loadedDayHours } =
          openingHoursFromApi(openingHoursPayload);
        setHoursEnabled(enabled);
        setDayHours(loadedDayHours);
      } catch (error) {
        if (!cancelled) {
          setProfileStatus({
            message: formatApiErrorMessage(error),
            tone: "error",
          });
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadStripeConnectStatus() {
    setStripeLoading(true);
    setStripeStatus(null);

    try {
      const status = await businessStripeApi.getConnectStatus();
      setStripeConnect(status);
    } catch (error) {
      setStripeStatus({
        message: formatApiErrorMessage(error),
        tone: "error",
      });
    } finally {
      setStripeLoading(false);
    }
  }

  useEffect(() => {
    if (tab !== "pagamenti") return;

    loadStripeConnectStatus();

    const handleFocus = () => {
      loadStripeConnectStatus();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [tab]);

  async function handleStripeOnboard() {
    setStripeOnboarding(true);
    setStripeStatus(null);

    try {
      const payload = await businessStripeApi.startConnectOnboard();
      if (!payload.url) {
        throw new Error("Link di configurazione Stripe non disponibile.");
      }
      window.location.href = payload.url;
    } catch (error) {
      setStripeStatus({
        message: formatApiErrorMessage(error),
        tone: "error",
      });
      setStripeOnboarding(false);
    }
  }

  function updateProfileField<K extends keyof ReturnType<typeof defaultProfileForm>>(
    key: K,
    value: ReturnType<typeof defaultProfileForm>[K]
  ) {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateProfileRegion(region: string) {
    setProfileForm((prev) => {
      const provinces = getProvinceOptionsForRegion(region);
      const provinceStillValid = provinces.some((option) => option.value === prev.province);
      return {
        ...prev,
        region,
        province: provinceStillValid ? prev.province : "",
      };
    });
  }

  const provinceOptions = useMemo(() => {
    const options = getProvinceOptionsForRegion(profileForm.region);
    if (
      profileForm.province &&
      !options.some((option) => option.value === profileForm.province)
    ) {
      return [
        { value: profileForm.province, label: profileForm.province },
        ...options,
      ];
    }
    return options;
  }, [profileForm.province, profileForm.region]);

  async function handleSaveProfile() {
    setProfileStatus(null);

    if (hasPartialAddress(profileForm)) {
      setProfileStatus({
        message: "Compila tutti i campi dell'indirizzo oppure lasciali tutti vuoti.",
        tone: "error",
      });
      return;
    }

    if (!hasCompleteBusinessProfile(profileForm)) {
      setProfileStatus({
        message:
          "Compila tutti i campi obbligatori, incluso l'indirizzo completo.",
        tone: "error",
      });
      return;
    }

    setProfileSaving(true);

    try {
      const { info: updatedInfo, address: updatedAddress } = await saveBusinessProfile({
        business: {
          ragioneSociale: profileForm.ragioneSociale,
          partitaIVA: profileForm.partitaIVA,
          codiceFiscale: profileForm.codiceFiscale,
          codiceSDI: profileForm.codiceSDI,
          email: profileForm.email,
          phoneNumber: profileForm.phoneNumber,
        },
        contacts: {
          pec: profileForm.pec,
          whatsappNumber: profileForm.whatsappNumber,
        },
        address: {
          fullAddress: profileForm.fullAddress,
          cap: profileForm.cap,
          city: profileForm.city,
          province: profileForm.province,
          region: profileForm.region,
        },
      });

      const [updatedStore, updatedHours] = await Promise.all([
        businessInfoApi.updateStoreDescription({
          storeDescription: storeDescription.trim(),
          productCategoryIds: selectedCategoryIds,
        }),
        businessInfoApi.updateOpeningHours(
          openingHoursToApi(hoursEnabled, dayHours)
        ),
      ]);

      const labels: Record<string, string> = { ...categoryLabels };
      updatedStore.productCategories?.forEach((category) => {
        if (category._id && category.name) labels[category._id] = category.name;
      });
      setCategoryLabels(labels);
      setStoreDescription(updatedStore.storeDescription ?? "");
      setSelectedCategoryIds(updatedStore.productCategoryIds ?? []);

      const { enabled, dayHours: savedDayHours } = openingHoursFromApi(updatedHours);
      setHoursEnabled(enabled);
      setDayHours(savedDayHours);

      setProfileForm((prev) => ({
        ...prev,
        ragioneSociale: normalizeLoadedField(updatedInfo.ragioneSociale) || prev.ragioneSociale,
        partitaIVA: normalizeLoadedField(updatedInfo.partitaIVA) || prev.partitaIVA,
        codiceFiscale: normalizeLoadedField(updatedInfo.codiceFiscale) || prev.codiceFiscale,
        codiceSDI: normalizeLoadedField(updatedInfo.codiceSDI) || prev.codiceSDI,
        email: normalizeLoadedField(updatedInfo.email) || prev.email,
        pec: normalizeLoadedField(updatedInfo.pec),
        phoneNumber: normalizeLoadedField(updatedInfo.phoneNumber) || prev.phoneNumber,
        whatsappNumber: normalizeLoadedField(updatedInfo.whatsappNumber),
        fullAddress: normalizeLoadedField(updatedAddress.fullAddress) || prev.fullAddress,
        cap: normalizeLoadedField(updatedAddress.cap) || prev.cap,
        city: normalizeLoadedField(updatedAddress.city) || prev.city,
        province: normalizeLoadedField(updatedAddress.province) || prev.province,
        region: normalizeLoadedField(updatedAddress.region) || prev.region,
      }));
      setHasBusinessInfo(true);
      setProfileStatus({
        message: "Profilo negozio aggiornato.",
        tone: "success",
      });
    } catch (error) {
      setProfileStatus({
        message: formatApiErrorMessage(error),
        tone: "error",
      });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleAvatarSelected(file: File | undefined) {
    if (!file) return;

    setProfileStatus(null);
    setAvatarUploading(true);

    try {
      const imageUrl = await uploadBusinessImage(file);
      const updated = await businessInfoApi.updateAvatar(imageUrl);
      setProfilePictureUrl(updated.profilePictureUrl ?? imageUrl);
      setProfileStatus({
        message: "Foto profilo aggiornata.",
        tone: "success",
      });
    } catch (error) {
      setProfileStatus({
        message: formatApiErrorMessage(error),
        tone: "error",
      });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  function setDay<K extends DayKey>(key: K, patch: Partial<UiDayHours>) {
    setDayHours((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function getCategoryName(categoryId: string) {
    return categoryLabels[categoryId] || "Categoria";
  }

  function addCategory(categoryId: string) {
    if (!categoryId || selectedCategoryIds.includes(categoryId)) return;
    setSelectedCategoryIds((prev) => [...prev, categoryId]);
    setShowCategoryPicker(false);
  }

  function removeCategory(categoryId: string) {
    setSelectedCategoryIds((prev) => prev.filter((id) => id !== categoryId));
  }

  const unselectedCategories = availableCategories.filter(
    (category) => category._id && !selectedCategoryIds.includes(category._id)
  );

  const passwordChecks = getPasswordChecks(newPassword);

  async function handleChangePassword() {
    setPasswordStatus(null);

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ message: "Le password non coincidono.", tone: "error" });
      return;
    }

    const checks = getPasswordChecks(newPassword);
    if (!checks.minLength || !checks.specialChars || !checks.numbers || !checks.mixedCase) {
      setPasswordStatus({
        message: "La nuova password non soddisfa tutti i requisiti di sicurezza.",
        tone: "error",
      });
      return;
    }

    const token = getBusinessAuthToken();
    if (!token) {
      setPasswordStatus({ message: "Sessione scaduta. Accedi di nuovo.", tone: "error" });
      return;
    }

    setPasswordSaving(true);

    try {
      await businessAuthApi.changePassword(oldPassword, newPassword, token);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      setPasswordStatus({
        message: "Password aggiornata con successo.",
        tone: "success",
      });
    } catch (error) {
      setPasswordStatus({
        message: formatApiErrorMessage(error),
        tone: "error",
      });
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
          <DashboardViewHeader
            title="Impostazioni account"
            backHref="/dashboard"
            backAriaLabel="Torna alla panoramica"
            className="flex-wrap"
            rightExtra={
              <button
                type="button"
                onClick={() => {
                  if (tab === "profilo") void handleSaveProfile();
                }}
                disabled={tab !== "profilo" || profileLoading || profileSaving}
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#214e3a] px-5 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {profileSaving ? "Salvataggio..." : "Salva modifiche"}
              </button>
            }
          />

          {/* Profile banner — edge-to-edge in main column, no rounded corners */}
          <div className="w-full bg-[#1e4d36] text-white">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-5 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-7 lg:px-8">
              <div className="flex items-center gap-4">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 text-lg font-bold text-white ring-2 ring-white/25">
                  {profilePictureUrl ? (
                    <Image
                      src={profilePictureUrl}
                      alt={profileForm.ragioneSociale || "Avatar negozio"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    getBusinessInitials(profileForm.ragioneSociale)
                  )}
                </div>
                <div>
                  <div className="text-lg font-bold tracking-tight sm:text-xl">
                    {profileLoading
                      ? "Caricamento..."
                      : profileForm.ragioneSociale || "Il tuo negozio"}
                  </div>
                  <div className="mt-0.5 text-[12px] text-white/75">
                    {isValidated ? "Negozio verificato" : "In attesa di verifica"}
                  </div>
                </div>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  void handleAvatarSelected(file);
                }}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading || profileLoading}
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-[12px] font-semibold text-white backdrop-blur-sm hover:cursor-pointer hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {avatarUploading ? "Caricamento..." : "Cambia foto"}
              </button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-6xl space-y-0 px-4 pb-10 pt-0 lg:px-8">
            <div className="mt-6 border-b border-black/[0.08] bg-transparent">
              <nav
                className="-mb-px flex gap-1 overflow-x-auto pb-px sm:gap-2"
                aria-label="Sezioni impostazioni"
              >
                {TABS.map((t) => {
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={clsx(
                        "shrink-0 border-b-2 px-3 py-3 text-[12px] font-semibold transition-colors hover:cursor-pointer sm:px-4 sm:text-[13px]",
                        active
                          ? "border-[#214e3a] text-[#214e3a]"
                          : "border-transparent text-[#6b7280] hover:text-[#111827]",
                      )}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mt-8">
              {profileStatus && tab === "profilo" ? (
                <p
                  className={clsx(
                    "mb-4 text-xs font-semibold",
                    profileStatus.tone === "success" ? "text-[#2f6b3c]" : "text-red-600"
                  )}
                >
                  {profileStatus.message}
                </p>
              ) : null}

              {tab === "profilo" ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
                  {/* Informazioni */}
                  <section className="min-w-0 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-7">
                    <h2 className="text-[15px] font-bold tracking-tight text-[#111827]">Informazioni</h2>
                    <p className="mt-1 text-[11px] text-[#6b7280]">
                      I campi contrassegnati con <span className="text-red-600">*</span> sono obbligatori.
                    </p>
                    <div className="mt-6 space-y-4">
                      <div>
                        <FieldLabel required>Nome negozio</FieldLabel>
                        <input
                          className={inputClass}
                          value={profileForm.ragioneSociale}
                          onChange={(event) =>
                            updateProfileField("ragioneSociale", event.target.value)
                          }
                          disabled={profileLoading}
                        />
                      </div>
                      <div>
                        <FieldLabel required>Partita IVA</FieldLabel>
                        <input
                          className={inputClass}
                          value={profileForm.partitaIVA}
                          onChange={(event) =>
                            updateProfileField("partitaIVA", event.target.value)
                          }
                          disabled={profileLoading}
                        />
                      </div>
                      <div>
                        <FieldLabel required>Codice fiscale</FieldLabel>
                        <input
                          className={inputClass}
                          value={profileForm.codiceFiscale}
                          onChange={(event) =>
                            updateProfileField("codiceFiscale", event.target.value)
                          }
                          disabled={profileLoading}
                          placeholder="RSSMRA80A01H501U"
                        />
                      </div>
                      <div>
                        <FieldLabel required>Codice SDI</FieldLabel>
                        <input
                          className={inputClass}
                          value={profileForm.codiceSDI}
                          onChange={(event) =>
                            updateProfileField("codiceSDI", event.target.value)
                          }
                          disabled={profileLoading}
                        />
                      </div>
                      <div>
                        <FieldLabel required>Email principale</FieldLabel>
                        <input
                          type="email"
                          className={inputClass}
                          value={profileForm.email}
                          onChange={(event) =>
                            updateProfileField("email", event.target.value)
                          }
                          disabled={profileLoading}
                        />
                      </div>
                      <div>
                        <FieldLabel>PEC</FieldLabel>
                        <input
                          className={inputClass}
                          value={profileForm.pec}
                          onChange={(event) =>
                            updateProfileField("pec", event.target.value)
                          }
                          disabled={profileLoading}
                        />
                      </div>
                      <div>
                        <FieldLabel required>Telefono</FieldLabel>
                        <input
                          className={inputClass}
                          value={profileForm.phoneNumber}
                          onChange={(event) =>
                            updateProfileField("phoneNumber", event.target.value)
                          }
                          disabled={profileLoading}
                        />
                      </div>
                      <div>
                        <FieldLabel>WhatsApp Business</FieldLabel>
                        <input
                          className={inputClass}
                          value={profileForm.whatsappNumber}
                          onChange={(event) =>
                            updateProfileField("whatsappNumber", event.target.value)
                          }
                          disabled={profileLoading}
                        />
                      </div>
                      <div>
                        <FieldLabel required>Indirizzo</FieldLabel>
                        <input
                          className={inputClass}
                          value={profileForm.fullAddress}
                          onChange={(event) =>
                            updateProfileField("fullAddress", event.target.value)
                          }
                          disabled={profileLoading}
                          placeholder="Via Roma 123"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel required>CAP</FieldLabel>
                          <input
                            className={inputClass}
                            value={profileForm.cap}
                            onChange={(event) =>
                              updateProfileField("cap", event.target.value)
                            }
                            disabled={profileLoading}
                            placeholder="20121"
                          />
                        </div>
                        <div>
                          <FieldLabel required>Città</FieldLabel>
                          <input
                            className={inputClass}
                            value={profileForm.city}
                            onChange={(event) =>
                              updateProfileField("city", event.target.value)
                            }
                            disabled={profileLoading}
                            placeholder="Milano"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel required>Regione</FieldLabel>
                          <FormDropdown
                            options={ITALIAN_REGION_OPTIONS}
                            value={profileForm.region}
                            onChange={updateProfileRegion}
                            placeholder="Seleziona regione"
                            aria-label="Regione"
                            disabled={profileLoading || profileSaving}
                          />
                        </div>
                        <div>
                          <FieldLabel required>Provincia</FieldLabel>
                          <FormDropdown
                            options={
                              profileForm.region
                                ? provinceOptions
                                : [{ value: "", label: "Seleziona prima la regione" }]
                            }
                            value={profileForm.province}
                            onChange={(value) => updateProfileField("province", value)}
                            placeholder={
                              profileForm.region
                                ? "Seleziona provincia"
                                : "Seleziona prima la regione"
                            }
                            aria-label="Provincia"
                            disabled={profileLoading || profileSaving || !profileForm.region}
                          />
                        </div>
                      </div>
                      <div>
                        <FieldLabel>Descrizione negozio</FieldLabel>
                        <textarea
                          className={textareaClass}
                          rows={5}
                          value={storeDescription}
                          onChange={(event) => setStoreDescription(event.target.value)}
                          disabled={profileLoading || profileSaving}
                          placeholder="Descrivi il tuo negozio, i prodotti e i servizi offerti."
                        />
                      </div>
                      <div>
                        <FieldLabel>Categorie prodotti</FieldLabel>
                        <div className="flex flex-wrap items-center gap-2">
                          {selectedCategoryIds.map((categoryId) => (
                            <span
                              key={categoryId}
                              className="inline-flex h-5 max-w-full items-center gap-1 rounded-full bg-[#E3EFD9] px-3 py-0 text-[12px] font-semibold text-[#214e3a] ring-1 ring-[#c5e0b8]"
                            >
                              <span className="truncate">{getCategoryName(categoryId)}</span>
                              <button
                                type="button"
                                onClick={() => removeCategory(categoryId)}
                                disabled={profileLoading || profileSaving}
                                className="inline-flex shrink-0 rounded-full text-[#214e3a]/70 hover:cursor-pointer hover:bg-[#214e3a]/10 hover:text-[#214e3a] disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={`Rimuovi ${getCategoryName(categoryId)}`}
                              >
                                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                              </button>
                            </span>
                          ))}
                          {showCategoryPicker ? (
                            <select
                              autoFocus
                              defaultValue=""
                              disabled={profileLoading || profileSaving}
                              onChange={(event) => {
                                addCategory(event.target.value);
                                event.target.value = "";
                              }}
                              onBlur={() => setShowCategoryPicker(false)}
                              className={clsx(inputClass, "h-8 w-[12rem] sm:w-52")}
                            >
                              <option value="" disabled>
                                Seleziona categoria
                              </option>
                              {unselectedCategories.map((category) => (
                                <option key={category._id} value={category._id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          ) : unselectedCategories.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setShowCategoryPicker(true)}
                              disabled={profileLoading || profileSaving}
                              className="inline-flex h-5 items-center justify-center rounded-lg border-2 border-dashed border-[#214e3a]/25 bg-[#fafdfb] px-4 text-[12px] font-semibold text-[#214e3a] hover:cursor-pointer hover:border-[#214e3a]/40 hover:bg-[#f3f7f0] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              + Aggiungi
                            </button>
                          ) : selectedCategoryIds.length === 0 ? (
                            <span className="text-[12px] text-[#6b7280]">
                              Nessuna categoria disponibile al momento.
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="flex min-w-0 flex-col gap-6">
                    {/* Orari */}
                    <section className="min-w-0 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-7">
                      <div className="flex items-start justify-between gap-4">
                        <h2 className="text-[15px] font-bold tracking-tight text-[#111827]">
                          Orari di apertura
                        </h2>
                        <Toggle
                          id="hours-master"
                          checked={hoursEnabled}
                          onChange={setHoursEnabled}
                          disabled={profileLoading || profileSaving}
                        />
                      </div>
                      <ul className="mt-5 space-y-3">
                        {DAYS_IT.map(({ key, label }) => {
                          const row = dayHours[key];
                          const rowDisabled = !hoursEnabled || profileLoading || profileSaving;
                          const closedRow = !row.open || rowDisabled;
                          return (
                            <li
                              key={key}
                              className={clsx(
                                "flex flex-col gap-3 rounded-xl border border-black/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
                                closedRow && "bg-[#f9fafb]",
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Toggle
                                  id={`day-${key}`}
                                  checked={row.open && hoursEnabled}
                                  disabled={rowDisabled}
                                  onChange={(v) => setDay(key, { open: v })}
                                />
                                <span
                                  className={clsx(
                                    "text-[13px] font-semibold",
                                    closedRow ? "text-[#9ca3af]" : "text-[#111827]",
                                  )}
                                >
                                  {label}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                <TimePicker
                                  value={row.start}
                                  disabled={closedRow}
                                  onChange={(v) => setDay(key, { start: v })}
                                />
                                <span className="text-[12px] text-[#9ca3af]">—</span>
                                <TimePicker
                                  value={row.end}
                                  disabled={closedRow}
                                  onChange={(v) => setDay(key, { end: v })}
                                />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </section>

                    {/* Social */}
                    <section className="min-w-0 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-7">
                      <h2 className="text-[15px] font-bold tracking-tight text-[#111827]">
                        Social media e sito
                      </h2>
                      <div className="mt-5 space-y-4">
                        {(
                          [
                            {
                              logo: "/social/instagram.png",
                              label: "Instagram",
                              defaultValue: "@techstoremilano",
                            },
                            {
                              logo: "/social/facebook.png",
                              label: "Facebook",
                              defaultValue: "facebook.com/techstoremilano",
                            },
                            {
                              logo: "/social/tiktok.png",
                              label: "TikTok",
                              defaultValue: "@techstoremilano",
                            },
                            {
                              logo: "/social/website.png",
                              label: "Sito web",
                              defaultValue: "https://www.techstoremilano.it",
                            },
                          ] as const
                        ).map(({ logo, label, defaultValue }) => (
                          <div key={label}>
                            <div className="mb-1.5 flex items-center ">
                              <span className="relative flex h-9 w-9 shrink-0 items-center justify-start">
                                <Image
                                  src={logo}
                                  alt={label}
                                  width={14}
                                  height={14}
                                  className="size-5 object-contain"
                                />
                              </span>
                              <span className="text-[12px] font-semibold text-[#1f2b20]">{label}</span>
                            </div>
                            <input className={inputClass} defaultValue={defaultValue} />
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              ) : tab === "pagamenti" ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5 lg:items-stretch">
                  {/* Conti bancari — Stripe Connect */}
                  <section className="flex min-w-0 flex-col rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-[15px] font-bold tracking-tight text-[#111827]">Conti bancari</h2>
                    <p className="mt-1 text-[12px] text-[#6b7280]">
                      Collega il tuo conto tramite Stripe Connect per ricevere gli accrediti
                    </p>

                    {stripeStatus ? (
                      <p
                        className={clsx(
                          "mt-4 text-xs font-semibold",
                          stripeStatus.tone === "success" ? "text-[#2f6b3c]" : "text-red-600"
                        )}
                      >
                        {stripeStatus.message}
                      </p>
                    ) : null}

                    {stripeLoading ? (
                      <div className="mt-6 flex flex-1 items-center justify-center rounded-xl bg-[#F8F9FA] px-4 py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-[#2D4F36]" />
                      </div>
                    ) : stripeConnect?.onboardingComplete ? (
                      <div className="mt-4 rounded-xl bg-[#2D4F36] p-4 text-white sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-white/70">
                              Stripe Connect
                            </div>
                            <div className="mt-1 text-[14px] font-bold sm:text-[15px]">
                              Conto collegato
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#7ED321]/25 px-2.5 py-1 text-[10px] font-bold text-white">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Attivo
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <div className="text-[10px] font-medium text-white/65">Account ID</div>
                            <div className="mt-0.5 font-mono text-[12px] font-semibold">
                              {maskStripeAccountId(stripeConnect.accountId)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-medium text-white/65">Accrediti</div>
                            <div className="mt-0.5 text-[12px] font-semibold">
                              {stripeConnect.payoutsEnabled ? "Abilitati" : "In verifica"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-medium text-white/65">Pagamenti</div>
                            <div className="mt-0.5 text-[12px] font-semibold">
                              {stripeConnect.chargesEnabled ? "Abilitati" : "In verifica"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-medium text-white/65">Provider</div>
                            <div className="mt-0.5 text-[12px] font-semibold">Stripe Express</div>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-white/15 pt-4">
                          <button
                            type="button"
                            onClick={handleStripeOnboard}
                            disabled={stripeOnboarding}
                            className="w-full rounded-lg bg-[#FFFFFF33] py-2.5 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#7ED321]/35 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {stripeOnboarding ? "Apertura Stripe..." : "Aggiorna dati bancari"}
                          </button>
                        </div>
                      </div>
                    ) : stripeConnect?.connected ? (
                      <div className="mt-4 flex flex-1 flex-col rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                            <AlertCircle className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-[13px] font-bold text-[#111827]">
                              Configurazione incompleta
                            </div>
                            <p className="mt-1 text-[12px] text-[#6b7280]">
                              Hai iniziato la configurazione Stripe ma non l&apos;hai ancora completata.
                              Termina l&apos;onboarding per ricevere pagamenti e accrediti.
                            </p>
                            {stripeConnect.accountId ? (
                              <p className="mt-2 font-mono text-[11px] text-[#6b7280]">
                                {maskStripeAccountId(stripeConnect.accountId)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleStripeOnboard}
                          disabled={stripeOnboarding}
                          className="mt-4 w-full rounded-lg bg-[#2D4F36] py-3 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#244530] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {stripeOnboarding ? "Apertura Stripe..." : "Completa configurazione"}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-1 flex-col rounded-xl border border-dashed border-black/10 bg-[#F8F9FA] p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#DFEED6] text-[#2D4F36]">
                            <Wallet className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-[13px] font-bold text-[#111827]">
                              Nessun conto collegato
                            </div>
                            <p className="mt-1 text-[12px] text-[#6b7280]">
                              Collega il conto bancario del negozio con Stripe Connect Express.
                              I dati bancari vengono gestiti in modo sicuro da Stripe.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleStripeOnboard}
                          disabled={stripeOnboarding}
                          className="mt-4 w-full rounded-lg bg-[#2D4F36] py-3 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#244530] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {stripeOnboarding ? "Apertura Stripe..." : "Collega conto bancario"}
                        </button>
                      </div>
                    )}
                  </section>

                  {/* Metodi di pagamento accettati */}
                  <section className="flex min-w-0 flex-col rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-[15px] font-bold tracking-tight text-[#111827]">
                      Metodi di pagamento accettati
                    </h2>
                    <ul className="mt-4 flex flex-col gap-3">
                      {(
                        [
                          {
                            id: "cards",
                            title: "Carte di credito/debito",
                            sub: "Visa, Mastercard, American Express",
                            icon: CreditCard,
                            on: payCards,
                            set: setPayCards,
                          },
                          {
                            id: "klarna",
                            title: "Klarna",
                            sub: "Pagamento rateale",
                            icon: LayoutGrid,
                            on: payKlarna,
                            set: setPayKlarna,
                          },
                          {
                            id: "satispay",
                            title: "Satispay",
                            sub: "Pagamento mobile",
                            icon: Wallet,
                            on: paySatispay,
                            set: setPaySatispay,
                          },
                          {
                            id: "cash",
                            title: "Contanti",
                            sub: "Pagamento in negozio",
                            icon: Banknote,
                            on: payCash,
                            set: setPayCash,
                          },
                        ] as const
                      ).map((row) => (
                        <li
                          key={row.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-[#F8F9FA] px-3 py-3 sm:px-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#DFEED6] text-[#2D4F36] shadow-sm ring-1 ring-black/[0.04]">
                              <row.icon className="h-5 w-5 text-[#5A7760]" strokeWidth={1.75} />
                            </span>
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-[#111827]">{row.title}</div>
                              <div className="text-[11px] text-[#6b7280]">{row.sub}</div>
                            </div>
                          </div>
                          <Toggle id={`pay-${row.id}`} checked={row.on} onChange={row.set} />
                        </li>
                      ))}
                    </ul>
                  </section>

                  {/* Impostazioni accredito */}
                  <section className="flex min-w-0 flex-col rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-[15px] font-bold tracking-tight text-[#111827]">Impostazioni accredito</h2>
                    <p className="mt-4 text-[12px] font-semibold text-[#111827]">Frequenza accredito</p>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {(
                        [
                          { id: "daily" as const, label: "Giornaliero", Icon: CalendarDays },
                          { id: "weekly" as const, label: "Settimanale", Icon: CalendarRange },
                          { id: "monthly" as const, label: "Mensile", Icon: Calendar },
                        ] as const
                      ).map(({ id, label, Icon }) => {
                        const active = payoutFrequency === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setPayoutFrequency(id)}
                            className={clsx(
                              "flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-center transition-colors hover:cursor-pointer",
                              active
                                ? "border-[#7ED321] bg-[#f7fcf0] text-[#2D4F36]"
                                : "border-[#e5e7eb] bg-[#fafafa] text-[#9ca3af]",
                            )}
                          >
                            <Icon
                              className={clsx("h-6 w-6", active ? "text-[#2D4F36]" : "text-[#9ca3af]")}
                              strokeWidth={1.75}
                            />
                            <span className="text-[11px] font-bold sm:text-[12px]">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-5">
                      <label className="mb-1.5 block text-[12px] font-semibold text-[#111827]">
                        Importo minimo accredito
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#6b7280]">
                          €
                        </span>
                        <input
                          value={minPayout}
                          onChange={(e) => setMinPayout(e.target.value.replace(/[^\d]/g, ""))}
                          className="h-10 w-full rounded-xl border border-black/10 bg-[#F8F9FA] py-2 pl-8 pr-3 text-[12px] font-medium text-[#111827] outline-none focus:border-[#2D4F36]/35 focus:ring-1 focus:ring-[#2D4F36]/20"
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-[#6b7280]">
                        Gli accrediti inferiori verranno accumulati
                      </p>
                    </div>
                  </section>

                  {/* Commissioni e tariffe */}
                  <section className="flex min-w-0 flex-col rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-[15px] font-bold tracking-tight text-[#111827]">Commissioni e tariffe</h2>
                    <ul className="mt-4 flex flex-col gap-3">
                      <li className="flex items-center justify-between gap-3 rounded-xl bg-[#F8F9FA] px-4 py-3">
                        <div>
                          <div className="text-[13px] font-semibold text-[#111827]">Commissione Klarna</div>
                          <div className="text-[11px] text-[#6b7280]">Per ogni transazione rateale</div>
                        </div>
                        <span className="shrink-0 text-[15px] font-bold text-[#111827]">2.5%</span>
                      </li>
                      <li className="flex items-center justify-between gap-3 rounded-xl bg-[#F8F9FA] px-4 py-3">
                        <div>
                          <div className="text-[13px] font-semibold text-[#111827]">Commissione carta</div>
                          <div className="text-[11px] text-[#6b7280]">Pagamenti con carta di credito</div>
                        </div>
                        <span className="shrink-0 text-[15px] font-bold text-[#111827]">1.8%</span>
                      </li>
                    </ul>
                  </section>
                </div>
              ) : tab === "notifiche" ? (
                <div className="space-y-5">
                  <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-[15px] font-bold tracking-tight text-[#111827]">Preferenze generali</h2>
                    <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-[#F8F9FA] px-4 py-3 sm:px-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#DFEED6] shadow-sm ">
                          <Mail className="h-5 w-5 text-[#5A7760]" strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-[#111827]">Email</div>
                          <div className="truncate text-[11px] text-[#6b7280]">info@techstoremilano.it</div>
                        </div>
                      </div>
                      <Toggle
                        id="notif-email-channel"
                        checked={notifEmailChannel}
                        onChange={setNotifEmailChannel}
                      />
                    </div>
                  </section>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5 lg:items-start">
                    <section className="min-w-0 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
                      <h2 className="text-[15px] font-bold tracking-tight text-[#111827]">Notifiche ordini</h2>
                      <ul className="mt-4 flex flex-col gap-3">
                        {(
                          [
                            {
                              id: "ord-nuovo",
                              title: "Nuovo ordine",
                              sub: "Quando ricevi un nuovo ordine",
                              on: notifOrdineNuovo,
                              set: setNotifOrdineNuovo,
                            },
                            {
                              id: "ord-ann",
                              title: "Ordine annullato",
                              sub: "Quando un ordine viene cancellato",
                              on: notifOrdineAnnullato,
                              set: setNotifOrdineAnnullato,
                            },
                            {
                              id: "ord-reso",
                              title: "Richiesta reso",
                              sub: "Quando un cliente richiede un reso",
                              on: notifReso,
                              set: setNotifReso,
                            },
                          ] as const
                        ).map((row) => (
                          <li
                            key={row.id}
                            className="flex items-center justify-between gap-3 rounded-xl bg-[#F8F9FA] px-4 py-3"
                          >
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-[#111827]">{row.title}</div>
                              <div className="text-[11px] text-[#6b7280]">{row.sub}</div>
                            </div>
                            <Toggle id={`notif-${row.id}`} checked={row.on} onChange={row.set} />
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section className="min-w-0 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
                      <h2 className="text-[15px] font-bold tracking-tight text-[#111827]">Notifiche pagamenti</h2>
                      <ul className="mt-4 flex flex-col gap-3">
                        {(
                          [
                            {
                              id: "pay-ok",
                              title: "Pagamento ricevuto",
                              sub: "Quando ricevi un pagamento",
                              on: notifPagamentoRicevuto,
                              set: setNotifPagamentoRicevuto,
                            },
                            {
                              id: "pay-ko",
                              title: "Pagamento fallito",
                              sub: "Quando fallisce un pagamento",
                              on: notifPagamentoFallito,
                              set: setNotifPagamentoFallito,
                            },
                            {
                              id: "pay-refund",
                              title: "Rimborso emesso",
                              sub: "Quando viene processato un rimborso",
                              on: notifRimborso,
                              set: setNotifRimborso,
                            },
                          ] as const
                        ).map((row) => (
                          <li
                            key={row.id}
                            className="flex items-center justify-between gap-3 rounded-xl bg-[#F8F9FA] px-4 py-3"
                          >
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-[#111827]">{row.title}</div>
                              <div className="text-[11px] text-[#6b7280]">{row.sub}</div>
                            </div>
                            <Toggle id={`notif-${row.id}`} checked={row.on} onChange={row.set} />
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section className="min-w-0 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
                      <h2 className="text-[15px] font-bold tracking-tight text-[#111827]">Notifiche magazzino</h2>
                      <ul className="mt-4 flex flex-col gap-3">
                        {(
                          [
                            {
                              id: "mag-low",
                              title: "Scorte basse",
                              sub: "Quando un prodotto sta finendo",
                              on: notifScorteBasse,
                              set: setNotifScorteBasse,
                            },
                            {
                              id: "mag-out",
                              title: "Prodotto esaurito",
                              sub: "Quando un prodotto va esaurito",
                              on: notifEsaurito,
                              set: setNotifEsaurito,
                            },
                          ] as const
                        ).map((row) => (
                          <li
                            key={row.id}
                            className="flex items-center justify-between gap-3 rounded-xl bg-[#F8F9FA] px-4 py-3"
                          >
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-[#111827]">{row.title}</div>
                              <div className="text-[11px] text-[#6b7280]">{row.sub}</div>
                            </div>
                            <Toggle id={`notif-${row.id}`} checked={row.on} onChange={row.set} />
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section className="min-w-0 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
                      <h2 className="text-[15px] font-bold tracking-tight text-[#111827]">Notifiche marketing</h2>
                      <ul className="mt-4 flex flex-col gap-3">
                        <li className="flex items-center justify-between gap-3 rounded-xl bg-[#F8F9FA] px-4 py-3">
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-[#111827]">Nuove funzionalità</div>
                            <div className="text-[11px] text-[#6b7280]">Aggiornamenti sulla piattaforma</div>
                          </div>
                          <Toggle id="notif-novita" checked={notifNovita} onChange={setNotifNovita} />
                        </li>
                        <li className="flex items-center justify-between gap-3 rounded-xl bg-[#F8F9FA] px-4 py-3">
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-[#111827]">Newsletter 3Rate</div>
                            <div className="text-[11px] text-[#6b7280]">Newsletter mensile per venditori</div>
                          </div>
                          <Toggle id="notif-newsletter" checked={notifNewsletter} onChange={setNotifNewsletter} />
                        </li>
                      </ul>
                    </section>
                  </div>
                </div>
              ) : tab === "sicurezza" ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
                  {/* Password e autenticazione */}
                  <section className="min-w-0 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-[15px] font-bold tracking-tight text-[#111827]">
                      Password e autenticazione
                    </h2>

                    {passwordStatus ? (
                      <p
                        className={clsx(
                          "mt-4 text-xs font-semibold",
                          passwordStatus.tone === "success" ? "text-[#2f6b3c]" : "text-red-600"
                        )}
                      >
                        {passwordStatus.message}
                      </p>
                    ) : null}

                    {!showPasswordForm ? (
                      <div className="mt-5 flex flex-col gap-4 rounded-xl bg-[#F9FAFB] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-[#111827]">
                            Password corrente
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#6b7280]">
                            Aggiorna la password del tuo account venditore
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordStatus(null);
                            setShowPasswordForm(true);
                          }}
                          className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#214e3a] px-4 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e] sm:px-5"
                        >
                          Cambia password
                        </button>
                      </div>
                    ) : (
                      <div className="mt-5 space-y-4 rounded-xl bg-[#F9FAFB] p-4">
                        <div>
                          <FieldLabel>Password attuale</FieldLabel>
                          <input
                            type="password"
                            value={oldPassword}
                            onChange={(event) => setOldPassword(event.target.value)}
                            disabled={passwordSaving}
                            className={inputClass}
                            placeholder="Inserisci password attuale"
                            autoComplete="current-password"
                          />
                        </div>
                        <div>
                          <FieldLabel>Nuova password</FieldLabel>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            disabled={passwordSaving}
                            className={inputClass}
                            placeholder="Minimo 8 caratteri"
                            autoComplete="new-password"
                          />
                        </div>
                        <div>
                          <FieldLabel>Conferma nuova password</FieldLabel>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            disabled={passwordSaving}
                            className={inputClass}
                            placeholder="Ripeti nuova password"
                            autoComplete="new-password"
                          />
                        </div>
                        <div className="flex flex-wrap justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPasswordForm(false);
                              setOldPassword("");
                              setNewPassword("");
                              setConfirmPassword("");
                              setPasswordStatus(null);
                            }}
                            disabled={passwordSaving}
                            className="inline-flex h-10 items-center rounded-xl border border-black/10 bg-white px-4 text-[12px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Annulla
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleChangePassword()}
                            disabled={passwordSaving || !oldPassword || !newPassword || !confirmPassword}
                            className="inline-flex h-10 items-center rounded-xl bg-[#214e3a] px-4 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {passwordSaving ? "Salvataggio..." : "Salva nuova password"}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      {(
                        [
                          { key: "minLength" as const, title: "Lunghezza minima", sub: "Almeno 8 caratteri" },
                          { key: "specialChars" as const, title: "Caratteri speciali", sub: "Simboli inclusi" },
                          { key: "numbers" as const, title: "Numeri", sub: "Presenti" },
                          { key: "mixedCase" as const, title: "Maiuscole/Minuscole", sub: "Combinazione corretta" },
                        ] as const
                      ).map((cell) => {
                        const met = passwordChecks[cell.key];
                        return (
                          <div
                            key={cell.title}
                            className={clsx(
                              "flex gap-3 rounded-xl border p-3 sm:p-3.5",
                              met
                                ? "border-[#c5e8c0] bg-[#f7fcf4]"
                                : "border-[#e5e7eb] bg-white"
                            )}
                          >
                            <span
                              className={clsx(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                met ? "bg-[#ecf8eb]" : "bg-[#f3f4f6]"
                              )}
                            >
                              <CheckCircle2
                                className={clsx(
                                  "h-4 w-4",
                                  met ? "text-[#76C043]" : "text-[#d1d5db]"
                                )}
                                strokeWidth={2.25}
                              />
                            </span>
                            <div className="min-w-0">
                              <div className="text-[12px] font-semibold text-[#111827]">{cell.title}</div>
                              <div className="text-[10px] leading-snug text-[#6b7280] sm:text-[11px]">
                                {cell.sub}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 rounded-xl bg-[#ecf8eb] p-4 ring-1 ring-[#c5e8c0] sm:p-5">
                      <h3 className="text-[13px] font-bold text-[#1a3d2e]">
                        Consigli per una password sicura
                      </h3>
                      <ul className="mt-3 list-disc space-y-2 pl-5 text-[11px] leading-relaxed text-[#2d4a32] sm:text-[12px]">
                        <li>Combina lettere maiuscole e minuscole per aumentare la complessità.</li>
                        <li>Evita informazioni personali facilmente intuibili (nome, date, indirizzi).</li>
                        <li>Aggiorna la password almeno ogni 90 giorni.</li>
                        <li>Usa un gestore di password affidabile per generarla in modo sicuro.</li>
                        <li>Non riutilizzare la stessa password su altri siti o servizi.</li>
                      </ul>
                    </div>
                  </section>

                  {/* Privacy e permessi + azioni account */}
                  <div className="flex min-w-0 flex-col gap-4">
                    <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
                      <h2 className="text-[15px] font-bold tracking-tight text-[#111827]">Privacy e permessi</h2>
                      <ul className="mt-4 flex flex-col gap-3">
                        <li className="flex items-center justify-between gap-3 rounded-xl bg-[#F8F9FA] px-4 py-3">
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-[#111827]">Profilo pubblico</div>
                            <div className="text-[11px] text-[#6b7280]">Mostra negozio nella ricerca pubblica</div>
                          </div>
                          <Toggle
                            id="sec-profilo-pubblico"
                            checked={secProfiloPubblico}
                            onChange={setSecProfiloPubblico}
                          />
                        </li>
                        <li className="flex items-center justify-between gap-3 rounded-xl bg-[#F8F9FA] px-4 py-3">
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-[#111827]">Geolocalizzazione</div>
                            <div className="text-[11px] text-[#6b7280]">Mostra posizione negozio su mappa</div>
                          </div>
                          <Toggle
                            id="sec-geolocalizzazione"
                            checked={secGeolocalizzazione}
                            onChange={setSecGeolocalizzazione}
                          />
                        </li>
                      </ul>
                    </section>

                    <button
                      type="button"
                      className="w-full rounded-xl border border-[#76C043]/45 bg-[#f3faf0] p-4 text-left shadow-sm transition-colors hover:cursor-pointer hover:border-[#76C043]/70 hover:bg-[#e6f4e0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#214e3a]/30 sm:p-5"
                    >
                      <div className="text-[13px] font-bold text-[#214e3a]">Scarica i miei dati</div>
                      <p className="mt-2 text-[11px] leading-relaxed text-[#3d5340] sm:text-[12px]">
                        Hai il diritto di scaricare tutti i tuoi dati in qualsiasi momento.
                      </p>
                    </button>

                    <button
                      type="button"
                      className="w-full rounded-xl border border-red-200 bg-[#fff5f5] p-4 text-left shadow-sm transition-colors hover:cursor-pointer hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 sm:p-5"
                    >
                      <div className="text-[13px] font-bold text-[#111827]">Disattiva Account</div>
                      <p className="mt-1 text-[12px] font-semibold text-red-600">Sospendi temporaneamente</p>
                    </button>

                    <button
                      type="button"
                      className="w-full rounded-xl bg-[#dc2626] p-4 text-left text-white shadow-sm transition-colors hover:cursor-pointer hover:bg-[#b91c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:p-5"
                    >
                      <div className="text-[13px] font-bold">Elimina Account</div>
                      <p className="mt-1 text-[11px] font-medium text-white/90 sm:text-[12px]">Azione permanente</p>
                    </button>
                  </div>
                </div>
              ) : tab === "fatturazione" ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 lg:items-stretch">
                    {/* Piano attuale */}
                    <section className="flex lg:col-span-3 min-w-0 flex-col rounded-[24px] bg-[linear-gradient(135deg,#2E4F38_0%,#3D6B4F_100%)] p-6 text-white shadow-[0_2px_6px_rgba(17,24,39,0.08)] sm:p-7">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-md font-bold tracking-tight">Piano attuale</h2>
                        <span className="shrink-0 rounded-full bg-[#7CCB42] px-4 py-1.5 text-sm font-extrabold uppercase tracking-tight text-[#29553a]">
                          Attivo
                        </span>
                      </div>
                      <div className="mt-6 flex flex-col gap-2 rounded-lg bg-white/12 px-6 py-5 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm font-semibold text-white/95">Prossimo pagamento</div>
                        <div className="text-sm font-medium text-white/75">Addebito il 15 Maggio 2024</div>
                        <div className="text-2xl font-bold tabular-nums tracking-tight text-white">€149,00</div>
                      </div>
                      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-[14px] bg-[#5e816d] px-4 py-3 text-[10px] font-semibold text-white transition-colors hover:cursor-pointer hover:bg-[#678a75]"
                        >
                          Modifica piano
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-[14px] bg-[#5e816d] px-4 py-3 text-[10px] font-semibold text-white transition-colors hover:cursor-pointer hover:bg-[#678a75]"
                        >
                          Modifica metodo pagamento
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-[14px] bg-[#5e816d] px-4 py-3 text-[10px] font-semibold text-white transition-colors hover:cursor-pointer hover:bg-[#678a75]"
                        >
                          Cancella abbonamento
                        </button>
                      </div>
                    </section>
               

                    {/* Metodi di pagamento */}
                    <section className="flex lg:col-span-2 min-w-0 flex-col rounded-[24px]  bg-[#ffffff] p-6 shadow-[0_2px_6px_rgba(17,24,39,0.06)] sm:p-8">
                      <h2 className="text-lg font-bold tracking-tight text-[#111827]">
                        Metodi di pagamento
                      </h2>
                      <div className="mt-6 flex items-center justify-between gap-3 rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-6 py-5">
                        <div className="min-w-0">
                          <div className="text-md font-semibold text-[#111827]">Mastercard •••• 8821</div>
                          <div className="mt-1 text-sm text-[#667085]">Scadenza: 12/2025</div>
                        </div>
                        <button
                          type="button"
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[#98A2B3] hover:cursor-pointer hover:bg-black/5"
                          aria-label="Altre azioni carta"
                        >
                          <MoreVertical className="size-4" strokeWidth={2.5} />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="mt-6 w-full rounded-[14px] bg-[#2E5B41] py-3 text-md font-semibold text-white transition-colors hover:cursor-pointer hover:bg-[#274D37]"
                      >
                        Aggiungi carta
                      </button>
                    </section>
                  </div>

                  {/* Piani disponibili */}
                  <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-[15px] font-bold tracking-tight text-[#111827]">Piani disponibili</h2>
                      <div
                        className="inline-flex w-full rounded-full bg-[#e5e7eb] p-0.5 sm:w-auto"
                        role="group"
                        aria-label="Ciclo di fatturazione"
                      >
                        <button
                          type="button"
                          onClick={() => setFattCycle("monthly")}
                          className={clsx(
                            "flex-1 rounded-full px-3 py-1 text-[11px] font-semibold leading-none transition-colors hover:cursor-pointer sm:flex-initial sm:px-4 sm:text-[12px]",
                            fattCycle === "monthly"
                              ? "bg-white text-black shadow-sm"
                              : "text-[#6b7280] hover:text-[#111827]",
                          )}
                        >
                          Mensile
                        </button>
                        <button
                          type="button"
                          onClick={() => setFattCycle("annual")}
                          className={clsx(
                            "flex-1 rounded-full px-3 py-1 text-[11px] font-semibold leading-none transition-colors hover:cursor-pointer sm:flex-initial sm:px-4 sm:text-[12px]",
                            fattCycle === "annual"
                              ? "bg-white text-black shadow-sm"
                              : "text-[#6b7280] hover:text-[#111827]",
                          )}
                        >
                          Annuale{" "}
                          <span className="font-semibold text-[#76C043]">-20%</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                      {(
                        [
                          {
                            id: "starter",
                            name: "Starter",
                            priceM: 49,
                            priceA: Math.round(49 * 0.8),
                            features: [
                              "Fino a 100 referenze prodotto",
                              "Dashboard vendite essenziale",
                              "Supporto via email",
                            ],
                            cta: "Seleziona" as const,
                            highlight: false,
                          },
                          {
                            id: "pro",
                            name: "Professional",
                            priceM: 79,
                            priceA: Math.round(79 * 0.8),
                            features: [
                              "Referenze prodotto illimitate",
                              "Analytics e report avanzati",
                              "Supporto prioritario",
                            ],
                            cta: "Piano attivo" as const,
                            highlight: true,
                          },
                          {
                            id: "bold",
                            name: "Bold",
                            priceM: 139,
                            priceA: Math.round(139 * 0.8),
                            features: [
                              "API e integrazioni dedicate",
                              "Account manager dedicato",
                              "SLA e uptime garantiti",
                            ],
                            cta: "Seleziona" as const,
                            highlight: false,
                          },
                        ] as const
                      ).map((plan) => {
                        const price = fattCycle === "monthly" ? plan.priceM : plan.priceA;
                        const suffix = fattCycle === "monthly" ? "/mese" : "/mese";
                        return (
                          <div
                            key={plan.id}
                            className={clsx(
                              "flex flex-col rounded-2xl border p-5 sm:p-6",
                              plan.highlight
                                ? "border-[#76C043] bg-[#F0FDF4] border-2"
                                : "border-black/[0.08] bg-white",
                            )}
                          >
                            <div className="text-[14px] font-bold text-[#111827]">{plan.name}</div>
                            <div className="mt-2 flex items-baseline gap-1">
                              <span className="text-[26px] font-bold tabular-nums text-[#111827]">€{price}</span>
                              <span className="text-[12px] font-regular text-[#6b7280]">{suffix}</span>
                            </div>
                            <ul className="mt-4 flex flex-col gap-2.5">
                              {plan.features.map((f) => (
                                <li key={f} className="flex gap-2 text-[11px] leading-snug text-[#374151] sm:text-[12px]">
                                  <CheckCircle2
                                    className="mt-0.5 h-4 w-4 shrink-0 text-[#76C043]"
                                    strokeWidth={2.25}
                                  />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-6">
                              {plan.highlight ? (
                                <div className="w-full rounded-xl bg-[#76C043] py-2.5 text-center text-[12px] font-semibold text-[#ffffff]">
                                  Piano attivo
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="w-full rounded-lg border-2 border-[#111827] bg-white py-2.5 text-[12px] font-semibold text-[#111827] hover:cursor-pointer hover:bg-[#fafafa]"
                                >
                                  Seleziona
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 lg:items-start">
                    {/* Storico fatture */}
                    <section className="min-w-0 lg:col-span-3 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
                      <div className="border-b border-black/[0.06] px-5 py-4">
                        <h2 className="text-[15px] font-bold tracking-tight text-[#111827]">Storico fatture</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-[11px] sm:text-[12px]">
                          <thead>
                            <tr className="border-b border-black/[0.06] bg-[#fafafa] text-[10px] font-semibold uppercase tracking-wide text-[#6b7280]">
                              <th className="px-4 py-3">Numero fattura</th>
                              <th className="px-4 py-3">Data</th>
                              <th className="px-4 py-3">Descrizione</th>
                              <th className="px-4 py-3">Importo</th>
                              <th className="px-4 py-3">Stato</th>
                              <th className="px-4 py-3 text-right">Azioni</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(
                              [
                                {
                                  num: "INV-2024-0415",
                                  date: "15 Apr 2024",
                                  desc: "Piano Professional - Abbonamento mensile",
                                  amount: "€79,00",
                                },
                                {
                                  num: "INV-2024-0315",
                                  date: "15 Mar 2024",
                                  desc: "Piano Professional - Abbonamento mensile",
                                  amount: "€79,00",
                                },
                                {
                                  num: "INV-2024-0215",
                                  date: "15 Feb 2024",
                                  desc: "Piano Professional - Abbonamento mensile",
                                  amount: "€79,00",
                                },
                                {
                                  num: "INV-2024-0115",
                                  date: "15 Gen 2024",
                                  desc: "Piano Professional - Abbonamento mensile",
                                  amount: "€79,00",
                                },
                              ] as const
                            ).map((inv) => (
                              <tr key={inv.num} className="border-b border-black/[0.05] last:border-0">
                                <td className="whitespace-nowrap px-4 py-3 font-mono font-medium text-[#111827]">
                                  {inv.num}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-[#374151]">{inv.date}</td>
                                <td className="max-w-[200px] px-4 py-3 text-[#374151]">{inv.desc}</td>
                                <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-[#111827]">
                                  {inv.amount}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex rounded-full bg-[#ecf8eb] px-2.5 py-0.5 text-[10px] font-semibold text-[#2d4f36] ">
                                    Pagata
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-1">
                                    <button
                                      type="button"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] hover:cursor-pointer hover:bg-black/5"
                                      aria-label="Visualizza fattura"
                                    >
                                      <Eye className="h-4 w-4" strokeWidth={2} />
                                    </button>
                                    <button
                                      type="button"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] hover:cursor-pointer hover:bg-black/5"
                                      aria-label="Scarica fattura"
                                    >
                                      <Download className="h-4 w-4" strokeWidth={2} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-end gap-2 border-t border-black/[0.06] px-4 py-3">
                        <button
                          type="button"
                          className="rounded-lg border border-black/15 bg-white px-4 py-2 text-[11px] font-semibold text-[#374151] hover:cursor-pointer hover:bg-[#fafafa] sm:text-[12px]"
                        >
                          Precedente
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-[#2d4f36] px-4 py-2 text-[11px] font-semibold text-white hover:cursor-pointer hover:bg-[#244530] sm:text-[12px]"
                        >
                          Successivo
                        </button>
                      </div>
                    </section>

                    {/* Informazioni fatturazione */}
                    <section className="min-w-0 lg:col-span-2 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-[15px] font-bold tracking-tight text-[#111827]">
                          Informazioni fatturazione
                        </h2>
                        <Link
                          href="/dashboard/impostazioni/informazioni-fatturazione"
                          className="shrink-0 text-[12px] font-semibold text-[#2d4f36] hover:cursor-pointer hover:underline"
                        >
                          Modifica
                        </Link>
                      </div>
                      <dl className="mt-5 space-y-3">
                        {(
                          [
                            ["Ragione sociale", "Tech Store Milano S.r.l."],
                            ["Partita IVA", "IT12345678901"],
                            ["Codice fiscale", "12345678901"],
                            ["Codice SDI", "ABCDE12"],
                            ["Indirizzo", "Via Roma 123"],
                            ["Città", "Milano"],
                            ["CAP", "20121"],
                            ["Provincia", "Milano (MI)"],
                          ] as const
                        ).map(([k, v]) => (
                          <div key={k}>
                            <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                              {k}
                            </dt>
                            <dd className="mt-0.5 text-[13px] font-medium text-[#111827]">{v}</dd>
                          </div>
                        ))}
                      </dl>
                      <div className="mt-6 rounded-xl bg-[#eff6ff] p-4 ring-1 ring-[#bfdbfe] sm:p-4">
                        <div className="text-[12px] font-bold text-[#111827]">Fatturazione elettronica</div>
                        <p className="mt-2 text-[11px] leading-relaxed text-[#111827]/60 sm:text-[12px]">
                          Le fatture vengono inviate automaticamente al Sistema di Interscambio (SDI) e in copia
                          all’indirizzo PEC / email di fatturazione associato al tuo account venditore.
                        </p>
                      </div>
                    </section>
                  </div>
                </div>
              ) : (
                <section className="rounded-2xl border border-black/[0.06] bg-white p-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <p className="text-[14px] font-semibold text-[#111827]">
                    {TABS.find((x) => x.id === tab)?.label}
                  </p>
                  <p className="mt-2 text-[13px] text-[#6b7280]">
                    Questa sezione sarà disponibile a breve. Torna su Profilo Negozio per aggiornare i dati del
                    negozio.
                  </p>
                </section>
              )}
            </div>
          </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
