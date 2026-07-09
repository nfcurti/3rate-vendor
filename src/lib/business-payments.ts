import { buildQuery, type PaginatedResult, unwrapPaginated } from "./api-pagination";
import { getBusinessAuthToken, payohRequest } from "./business-auth";

const withToken = () => {
  const token = getBusinessAuthToken();
  if (!token) throw new Error("Sessione scaduta. Accedi di nuovo.");
  return token;
};

export type PaymentsSummary = Record<string, unknown>;
export type PaymentTransactionRow = Record<string, unknown>;
export type Payout = {
  id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  arrivalDate?: string | Date;
  createdAt?: string | Date;
};

export function formatPayoutMoney(value?: number, currency = "EUR") {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(value);
}

export function parsePayoutDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatPayoutDateLong(value?: string | Date | null) {
  const date = parsePayoutDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatPayoutDateShort(value?: string | Date | null) {
  const date = parsePayoutDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
  }).format(date);
}

export function payoutStatusKind(status?: string): "received" | "incoming" | "scheduled" {
  if (status === "paid") return "received";
  if (status === "in_transit") return "incoming";
  return "scheduled";
}

export function payoutRelativeLabel(value?: string | Date | null) {
  const date = parsePayoutDate(value);
  if (!date) return "—";
  const diffDays = Math.round((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Oggi";
  if (diffDays === 1) return "Domani";
  if (diffDays === -1) return "Ieri";
  if (diffDays > 1 && diffDays <= 7) return `Tra ${diffDays} giorni`;
  return formatPayoutDateShort(date);
}
export type BankAccount = {
  _id?: string;
  bankName?: string;
  accountHolder?: string;
  iban?: string;
  isDefault?: boolean;
  createdAt?: string;
};

export type UpdatePayoutScheduleInput = {
  interval: "daily" | "weekly" | "biweekly" | "monthly";
};

export type CreateBankAccountInput = {
  bankName: string;
  accountHolder: string;
  iban: string;
  isDefault?: boolean;
};

export const businessPaymentsApi = {
  getSummary: (token?: string) =>
    payohRequest<PaymentsSummary>(
      "/business/payments/summary",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  getTimeseries: (token?: string) =>
    payohRequest<{ timeseries: Array<{ month: string; sales: number; earnings: number }> }>(
      "/business/payments/timeseries",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  getFees: (token?: string) =>
    payohRequest<Record<string, unknown>>(
      "/business/payments/fees",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  getTransactions: async (params?: { page?: number; limit?: number }, token?: string) => {
    const payload = await payohRequest<PaginatedResult<PaymentTransactionRow>>(
      `/business/payments/transactions${buildQuery({
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      })}`,
      undefined,
      token ?? withToken(),
      "GET"
    );
    return unwrapPaginated(payload);
  },
  getPayouts: (token?: string) =>
    payohRequest<Payout[]>(
      "/business/payments/payouts",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  updatePayoutSchedule: (input: UpdatePayoutScheduleInput, token?: string) =>
    payohRequest<Record<string, unknown>>(
      "/business/payments/payout_schedule",
      input,
      token ?? withToken(),
      "PUT"
    ),
  getBankAccounts: (token?: string) =>
    payohRequest<BankAccount[]>(
      "/business/payments/bank_accounts",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  createBankAccount: (input: CreateBankAccountInput, token?: string) =>
    payohRequest<BankAccount>(
      "/business/payments/bank_accounts",
      input,
      token ?? withToken(),
      "POST"
    ),
  updateBankAccount: (
    bankAccountId: string,
    input: Partial<CreateBankAccountInput>,
    token?: string
  ) =>
    payohRequest<BankAccount>(
      `/business/payments/bank_accounts/${encodeURIComponent(bankAccountId)}`,
      input,
      token ?? withToken(),
      "PUT"
    ),
  deleteBankAccount: (bankAccountId: string, token?: string) =>
    payohRequest<{ message: string }>(
      `/business/payments/bank_accounts/${encodeURIComponent(bankAccountId)}`,
      undefined,
      token ?? withToken(),
      "DELETE"
    ),
};
