import { withApiFallback } from "./api-fallback";
import { formatApiErrorMessage, getBusinessAuthToken, payohRequest } from "./business-auth";

export type BusinessAccount = {
  _id?: string;
  email?: string;
  isValidated?: boolean;
  pushNotificationsEnabled?: boolean;
};

export type BusinessInfo = {
  _id?: string;
  businessAccountId?: string;
  profilePictureUrl?: string | null;
  ragioneSociale?: string;
  partitaIVA?: string;
  codiceFiscale?: string;
  codiceSDI?: string;
  fullAddress?: string;
  cap?: string;
  city?: string;
  province?: string;
  region?: string;
  email?: string;
  pec?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    website?: string;
  };
  privacySettings?: {
    profileVisible?: boolean;
    showEmail?: boolean;
    showPhone?: boolean;
    showGeolocation?: boolean;
  };
};

export type BusinessAccountInfoPayload = {
  account?: BusinessAccount | null;
  info?: BusinessInfo | null;
};

export type UpdateBusinessInfoInput = {
  ragioneSociale?: string;
  partitaIVA?: string;
  codiceFiscale?: string;
  codiceSDI?: string;
  email?: string;
  phoneNumber?: string;
};

export type UpdateBusinessContactsInput = {
  pec?: string;
  whatsappNumber?: string;
};

const BACKEND_PLACEHOLDER = "-";

/** Mongoose rejects empty strings on required fields — use a placeholder instead. */
export const toBackendRequiredValue = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : BACKEND_PLACEHOLDER;
};

export const buildUpdateBusinessInfoPayload = (
  input: UpdateBusinessInfoInput
): UpdateBusinessInfoInput => ({
  ragioneSociale: toBackendRequiredValue(input.ragioneSociale ?? ""),
  partitaIVA: toBackendRequiredValue(input.partitaIVA ?? ""),
  codiceFiscale: toBackendRequiredValue(input.codiceFiscale ?? ""),
  codiceSDI: toBackendRequiredValue(input.codiceSDI ?? ""),
  email: toBackendRequiredValue(input.email ?? ""),
  phoneNumber: toBackendRequiredValue(input.phoneNumber ?? ""),
});

export const buildUpdateBusinessContactsPayload = (
  input: UpdateBusinessContactsInput
): UpdateBusinessContactsInput => ({
  pec: input.pec?.trim() ?? "",
  whatsappNumber: input.whatsappNumber?.trim() ?? "",
});

export type UpdateBusinessAddressInput = {
  fullAddress: string;
  cap: string;
  city: string;
  province: string;
  region: string;
  latitude?: number;
  longitude?: number;
};

export type OpeningHourDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type DayOpeningHours = {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

export type OpeningHoursPayload = {
  enabled: boolean;
  schedule: Record<OpeningHourDay, DayOpeningHours>;
};

export type ProductCategory = {
  _id?: string;
  name?: string;
  description?: string;
};

export type StoreDescriptionPayload = {
  storeDescription: string;
  productCategoryIds: string[];
  productCategories: ProductCategory[];
};

export type UpdateStoreDescriptionInput = {
  storeDescription?: string;
  productCategoryIds?: string[];
};

export type UpdateSocialLinksInput = {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  website?: string;
};

export type UpdatePrivacySettingsInput = {
  profileVisible?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  showGeolocation?: boolean;
};

const DEFAULT_COORDINATES = {
  latitude: 45.4642035,
  longitude: 9.189982,
};

export type SaveBusinessProfileInput = {
  business: UpdateBusinessInfoInput;
  contacts: UpdateBusinessContactsInput;
  address: {
    fullAddress: string;
    cap: string;
    city: string;
    province: string;
    region: string;
    latitude?: number;
    longitude?: number;
  };
};

export async function ensureBusinessInfoRecord(token?: string) {
  const authToken = token ?? withToken();

  const payload = await businessInfoApi.getAccountInfo(authToken);
  if (payload.info?._id) return payload;

  const response = await fetch("/api/business/info/bootstrap", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const data = (await response.json().catch(() => ({}))) as {
    result?: boolean;
    error?: string;
  };

  if (!response.ok || data.error) {
    throw new Error(data.error || "BOOTSTRAP_FAILED");
  }

  return businessInfoApi.getAccountInfo(authToken);
}

export async function saveBusinessProfile(input: SaveBusinessProfileInput, token?: string) {
  const authToken = token ?? withToken();

  await ensureBusinessInfoRecord(authToken);

  const addressPayload: UpdateBusinessAddressInput = {
    fullAddress: input.address.fullAddress.trim(),
    cap: input.address.cap.trim(),
    city: input.address.city.trim(),
    province: input.address.province.trim(),
    region: input.address.region.trim(),
    latitude: input.address.latitude ?? DEFAULT_COORDINATES.latitude,
    longitude: input.address.longitude ?? DEFAULT_COORDINATES.longitude,
  };

  const businessPayload = buildUpdateBusinessInfoPayload(input.business);
  const contactsPayload = buildUpdateBusinessContactsPayload(input.contacts);

  const updatedAddress = await businessInfoApi.updateAddress(addressPayload, authToken);
  const updatedInfo = await businessInfoApi.updateBusinessInfo(businessPayload, authToken);
  const updatedContacts = await businessInfoApi.updateBusinessContacts(
    contactsPayload,
    authToken
  );

  return {
    info: { ...updatedInfo, ...updatedContacts },
    address: updatedAddress,
  };
}

export const OPENING_DAY_IT_TO_API = {
  lun: "monday",
  mar: "tuesday",
  mer: "wednesday",
  gio: "thursday",
  ven: "friday",
  sab: "saturday",
  dom: "sunday",
} as const;

export type OpeningDayItKey = keyof typeof OPENING_DAY_IT_TO_API;

export type UiDayHours = { open: boolean; start: string; end: string };

export const openingHoursFromApi = (payload: OpeningHoursPayload) => {
  const dayHours = {} as Record<OpeningDayItKey, UiDayHours>;

  for (const [itKey, apiKey] of Object.entries(OPENING_DAY_IT_TO_API)) {
    const row = payload.schedule[apiKey as OpeningHourDay];
    dayHours[itKey as OpeningDayItKey] = {
      open: row.isOpen,
      start: row.openTime,
      end: row.closeTime,
    };
  }

  return { enabled: payload.enabled, dayHours };
};

export const openingHoursToApi = (
  enabled: boolean,
  dayHours: Record<OpeningDayItKey, UiDayHours>
): OpeningHoursPayload => {
  const schedule = {} as Record<OpeningHourDay, DayOpeningHours>;

  for (const [itKey, apiKey] of Object.entries(OPENING_DAY_IT_TO_API)) {
    const row = dayHours[itKey as OpeningDayItKey];
    schedule[apiKey as OpeningHourDay] = {
      isOpen: row.open,
      openTime: row.start,
      closeTime: row.end,
    };
  }

  return { enabled, schedule };
};

const withToken = () => {
  const token = getBusinessAuthToken();
  if (!token) throw new Error("Sessione scaduta. Accedi di nuovo.");
  return token;
};

export const businessInfoApi = {
  getAccountInfo: (token?: string) =>
    payohRequest<BusinessAccountInfoPayload>(
      "/business/info/get_account_info",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  updateBusinessInfo: (input: UpdateBusinessInfoInput, token?: string) =>
    payohRequest<BusinessInfo>(
      "/business/info/update_business_info",
      input,
      token ?? withToken()
    ),
  updateBusinessContacts: (input: UpdateBusinessContactsInput, token?: string) =>
    payohRequest<BusinessInfo>(
      "/business/info/update_business_contacts",
      input,
      token ?? withToken()
    ),
  updateAvatar: (profilePictureUrl: string, token?: string) =>
    payohRequest<BusinessInfo>(
      "/business/info/update_avatar",
      { profilePictureUrl },
      token ?? withToken()
    ),
  updateAddress: (input: UpdateBusinessAddressInput, token?: string) =>
    payohRequest<BusinessInfo>(
      "/business/info/update_address",
      input,
      token ?? withToken()
    ),
  getOpeningHours: (token?: string) =>
    payohRequest<OpeningHoursPayload>(
      "/business/info/get_opening_hours",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  updateOpeningHours: (input: OpeningHoursPayload, token?: string) =>
    payohRequest<OpeningHoursPayload>(
      "/business/info/update_opening_hours",
      input,
      token ?? withToken()
    ),
  getStoreDescription: (token?: string) =>
    payohRequest<StoreDescriptionPayload>(
      "/business/info/get_store_description",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  updateStoreDescription: (input: UpdateStoreDescriptionInput, token?: string) =>
    payohRequest<StoreDescriptionPayload>(
      "/business/info/update_store_description",
      input,
      token ?? withToken()
    ),
  getCategories: (token?: string) =>
    payohRequest<ProductCategory[]>(
      "/business/article/get_categories",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  getSocialLinks: (token?: string) =>
    withApiFallback(
      payohRequest<UpdateSocialLinksInput>(
        "/business/info/get_social_links",
        undefined,
        token ?? withToken(),
        "GET"
      ),
      {}
    ),
  updateSocialLinks: (input: UpdateSocialLinksInput, token?: string) =>
    payohRequest<Record<string, unknown>>(
      "/business/info/update_social_links",
      input,
      token ?? withToken()
    ),
  updatePrivacySettings: (input: UpdatePrivacySettingsInput, token?: string) =>
    payohRequest<Record<string, unknown>>(
      "/business/info/update_privacy_settings",
      input,
      token ?? withToken()
    ),
  exportData: (token?: string) =>
    payohRequest<Record<string, unknown>>(
      "/business/info/export_data",
      {},
      token ?? withToken()
    ),
  suspendAccount: (token?: string) =>
    payohRequest<{ suspended: boolean }>(
      "/business/account/suspend",
      {},
      token ?? withToken(),
      "POST"
    ),
};

export async function uploadBusinessImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/payoh/uploads/image", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json().catch(() => ({}))) as {
    result?: boolean;
    payload?: string[];
    error?: string;
  };

  if (!response.ok || data.error || !data.payload?.[0]) {
    throw new Error(
      data.error
        ? formatApiErrorMessage(new Error(data.error))
        : "Caricamento immagine non riuscito."
    );
  }

  return data.payload[0];
}

export const getBusinessInitials = (name?: string) =>
  (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

export const formatBusinessAddress = (info?: BusinessInfo | null) => {
  if (!info) return "";

  const cityLine = [info.cap, info.city].filter(Boolean).join(" ").trim();
  const province = info.province ? `(${info.province})` : "";

  return [info.fullAddress?.trim(), cityLine, province, info.region?.trim()]
    .filter(Boolean)
    .join(", ");
};
