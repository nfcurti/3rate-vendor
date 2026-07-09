import { getBusinessAuthToken, payohRequest } from "./business-auth";

const withToken = () => {
  const token = getBusinessAuthToken();
  if (!token) throw new Error("Sessione scaduta. Accedi di nuovo.");
  return token;
};

export type BillingInfo = Record<string, string | undefined>;
export type BillingInvoice = {
  period?: string;
  totalCommission?: number;
  entries?: Array<Record<string, unknown>>;
};

export const businessBillingApi = {
  getInfo: (token?: string) =>
    payohRequest<BillingInfo>(
      "/business/billing/info",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  putInfo: (input: BillingInfo, token?: string) =>
    payohRequest<BillingInfo>(
      "/business/billing/info",
      input,
      token ?? withToken(),
      "PUT"
    ),
  getInvoices: (token?: string) =>
    payohRequest<BillingInvoice[]>(
      "/business/billing/invoices",
      undefined,
      token ?? withToken(),
      "GET"
    ),
};
