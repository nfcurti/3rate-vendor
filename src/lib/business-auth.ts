const sanitizeBaseUrl = (value: string) => value.trim().replace(/\/$/, "");

const resolveApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "/api/payoh";
  }

  const envUrl = sanitizeBaseUrl(process.env.NEXT_PUBLIC_PAYOH_API_BASE_URL || "");
  if (envUrl) return envUrl;

  return "";
};

/** Normalize Mongo ObjectId / `{ buffer }` payloads to a hex string. */
export const toIdString = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "object") {
    const maybe = value as {
      toHexString?: () => string;
      toString?: () => string;
      buffer?: { data?: unknown } | ArrayBuffer | Uint8Array;
    };
    if (typeof maybe.toHexString === "function") {
      return maybe.toHexString();
    }
    if (
      maybe.buffer &&
      typeof maybe.buffer === "object" &&
      Array.isArray((maybe.buffer as { data?: unknown }).data)
    ) {
      const data = (maybe.buffer as { data: number[] }).data;
      if (data.every((n) => typeof n === "number")) {
        return data.map((n) => n.toString(16).padStart(2, "0")).join("");
      }
    }
  }
  return null;
};

/** Rewrite backend upload/content URLs through the Next.js proxy for <img src>. */
export const resolvePayohMediaUrl = (url?: string | null) => {
  const trimmed = url?.trim() || "";
  if (!trimmed) return "";

  try {
    const parsed = new URL(
      trimmed,
      typeof window !== "undefined" ? window.location.origin : "http://localhost"
    );
    if (parsed.pathname.startsWith("/uploads/content/")) {
      if (typeof window !== "undefined") {
        return `/api/payoh${parsed.pathname}${parsed.search}`;
      }
      const apiBase = sanitizeBaseUrl(
        process.env.PAYOH_API_BASE_URL ||
          process.env.NEXT_PUBLIC_PAYOH_API_BASE_URL ||
          ""
      );
      return apiBase ? `${apiBase}${parsed.pathname}${parsed.search}` : trimmed;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
};

export const BUSINESS_AUTH_TOKEN_KEY = "payoh_business_auth_token";
export const BUSINESS_ACCOUNT_ID_KEY = "payoh_business_account_id";
export const BUSINESS_SESSION_SAVED_EVENT = "payoh:business-session-saved";
export const BUSINESS_SESSION_CLEARED_EVENT = "payoh:business-session-cleared";

type BackendSuccess<T> = {
  result: true;
  payload?: T;
};

type BackendFailure = {
  error: string;
  path?: string;
  method?: string;
};

export type AuthSession = {
  token: string;
  accountId: string;
};

type AuthMessage = {
  message: string;
};

type SignupPayload = AuthMessage & {
  accountId: string;
};

const errorMessages: Record<string, string> = {
  ACCOUNT_BANNED: "Account bloccato. Contatta l'assistenza.",
  DUPLICATE_ENTRY: "Esiste già un account con questa email.",
  INVALID_OTP: "Codice non valido o scaduto.",
  INVALID_PASSWORD: "Email o password non corretti.",
  INVALID_TOKEN: "Sessione scaduta. Accedi di nuovo.",
  INVALID_DATA: "Dati non validi. Controlla i campi e riprova.",
  MISSING_FIELDS: "Compila tutti i campi richiesti.",
  PAYMENT_METHOD_REQUIRED:
    "Aggiungi una carta di pagamento prima di attivare un piano a pagamento.",
  API_NOT_CONFIGURED:
    "Servizio temporaneamente non disponibile. Riprova tra qualche istante.",
  NETWORK_ERROR:
    "Impossibile contattare il server. Verifica che il backend Docker sia attivo (porta 3006) e riprova.",
  INTERNAL_SERVER_ERROR: "Errore del server. Riprova tra poco.",
  PROFILE_NOT_INITIALIZED:
    "Profilo negozio non trovato. Ricarica la pagina e riprova.",
  BOOTSTRAP_FAILED:
    "Impossibile inizializzare il profilo negozio. Verifica la configurazione del backend.",
  MONGODB_NOT_CONFIGURED:
    "Database non configurato per l'inizializzazione del profilo. Contatta il supporto.",
  STATUSES_FAILED: "Impossibile caricare gli stati spedizione.",
  OPTIONS_FAILED: "Impossibile caricare le opzioni di spedizione.",
  NOT_FOUND: "Risorsa non trovata.",
  NOT_VALIDATED_ACCOUNT: "Account non ancora verificato.",
  UNKNOWN_ERROR:
    "Operazione non riuscita. Se stai collegando Stripe, verifica che STRIPE_SECRET_KEY sia configurata sul backend.",
};

const getErrorMessage = (error: string) =>
  errorMessages[error] || "Si è verificato un errore. Riprova.";

export const formatApiErrorMessage = (
  error: unknown,
  fallback = "Si è verificato un errore. Riprova."
) => {
  if (!(error instanceof Error)) return fallback;

  const message = error.message.trim();
  if (!message) return fallback;

  if (message.startsWith("{") && message.includes('"error"')) {
    try {
      const parsed = JSON.parse(message) as { error?: string };
      if (typeof parsed.error === "string") {
        return getErrorMessage(parsed.error);
      }
    } catch {
      /* ignore malformed JSON */
    }
  }

  return message;
};

const getNetworkErrorMessage = (
  apiBaseUrl: string,
  path: string,
  originalError?: unknown
) => {
  const details =
    originalError instanceof Error && originalError.message
      ? originalError.message
      : "Errore di rete sconosciuto";
  const endpoint = `${apiBaseUrl}${path}`;
  const isOffline =
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? !navigator.onLine
      : false;

  if (isOffline) {
    return "Sembra che tu sia offline. Controlla la connessione e riprova.";
  }

  if (details.toLowerCase().includes("failed to fetch")) {
    console.error(`[business-auth] Fetch failed: ${endpoint} (${details})`);
    return "Servizio momentaneamente non raggiungibile. Verifica che il backend sia attivo e riprova.";
  }

  console.error(`[business-auth] Request failed: ${endpoint} (${details})`);
  return "Si è verificato un problema di connessione. Riprova.";
};

export async function payohRequest<T>(
  path: string,
  body?: Record<string, unknown>,
  token?: string | null,
  method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE" = "POST"
) {
  const apiBaseUrl = resolveApiBaseUrl();

  if (!apiBaseUrl) {
    throw new Error(
      "Config mancante: imposta NEXT_PUBLIC_PAYOH_API_BASE_URL nel file .env.local"
    );
  }

  let response: Response;
  const performFetch = () =>
    fetch(`${apiBaseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body:
        (method === "POST" || method === "PUT" || method === "PATCH") && body
          ? JSON.stringify(body)
          : undefined,
    });

  const readJsonResponse = async (currentResponse: Response) => {
    const contentType = currentResponse.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new Error(
        "Risposta non valida dal server. Riprova tra qualche istante."
      );
    }

    const data = (await currentResponse.json().catch(() => ({}))) as
      | BackendSuccess<T>
      | BackendFailure;

    return { data, response: currentResponse };
  };

  const handleFailure = (data: BackendSuccess<T> | BackendFailure) => {
    if ("error" in data && data.error === "INVALID_TOKEN" && typeof window !== "undefined") {
      clearBusinessSession();
    }

    throw new Error(getErrorMessage("error" in data ? data.error : ""));
  };

  try {
    response = await performFetch();
  } catch (firstError) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      response = await performFetch();
    } catch {
      throw new Error(getNetworkErrorMessage(apiBaseUrl, path, firstError));
    }
  }

  let parsed = await readJsonResponse(response);

  if (!parsed.response.ok || "error" in parsed.data) {
    handleFailure(parsed.data);
  }

  return (parsed.data as BackendSuccess<T>).payload as T;
}

export const businessAuthApi = {
  signup: (email: string, password: string) =>
    payohRequest<SignupPayload>("/auth/business/signup", { email, password }),
  signupResendCode: (email: string) =>
    payohRequest<AuthMessage>("/auth/business/signup_resend_code", { email }),
  validateSignup: (email: string, otp: string) =>
    payohRequest<AuthSession>("/auth/business/validate_signup", { email, otp }),
  login: (email: string, password: string) =>
    payohRequest<AuthSession>("/auth/business/login", { email, password }),
  changePassword: (oldPassword: string, newPassword: string, token: string) =>
    payohRequest<AuthMessage>(
      "/auth/business/change_password",
      { oldPassword, newPassword },
      token
    ),
  restorePassword: (email: string) =>
    payohRequest<AuthMessage>("/auth/business/restore_password", { email }),
  restoreResendCode: (email: string) =>
    payohRequest<AuthMessage>("/auth/business/restore_resend_code", { email }),
  validateRestorePassword: (
    email: string,
    otp: string,
    newPassword: string
  ) =>
    payohRequest<AuthMessage>("/auth/business/validate_restore_password", {
      email,
      otp,
      newPassword,
    }),
  deleteAccount: (token: string) =>
    payohRequest<AuthMessage>("/auth/business/delete_account", undefined, token),
  deleteResendCode: (token: string) =>
    payohRequest<AuthMessage>("/auth/business/delete_resend_code", undefined, token),
  validateDelete: (otp: string, token: string) =>
    payohRequest<AuthMessage>("/auth/business/validate_delete", { otp }, token),
};

const notifySessionSaved = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BUSINESS_SESSION_SAVED_EVENT));
  }
};

const notifySessionCleared = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BUSINESS_SESSION_CLEARED_EVENT));
  }
};

export const saveBusinessSession = ({ token, accountId }: AuthSession) => {
  localStorage.setItem(BUSINESS_AUTH_TOKEN_KEY, token);
  const normalizedId = toIdString(accountId) ?? String(accountId ?? "");
  localStorage.setItem(BUSINESS_ACCOUNT_ID_KEY, normalizedId);
  notifySessionSaved();
};

export const getBusinessAuthToken = () =>
  typeof window === "undefined"
    ? null
    : localStorage.getItem(BUSINESS_AUTH_TOKEN_KEY);

export const getBusinessAccountId = () =>
  typeof window === "undefined"
    ? null
    : localStorage.getItem(BUSINESS_ACCOUNT_ID_KEY);

export const clearBusinessSession = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(BUSINESS_AUTH_TOKEN_KEY);
  localStorage.removeItem(BUSINESS_ACCOUNT_ID_KEY);
  notifySessionCleared();
};

export const logoutBusinessSession = () => {
  clearBusinessSession();
};
