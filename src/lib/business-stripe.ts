import { getBusinessAuthToken, payohRequest } from "./business-auth";

export type StripeConnectStatus = {
  connected: boolean;
  onboardingComplete: boolean;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
};

export type StripeConnectOnboardPayload = {
  accountId: string;
  url: string;
};

const withToken = () => {
  const token = getBusinessAuthToken();
  if (!token) throw new Error("Sessione scaduta. Accedi di nuovo.");
  return token;
};

export const businessStripeApi = {
  getConnectStatus: (token?: string) =>
    payohRequest<StripeConnectStatus>(
      "/business/stripe/connect/status",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  startConnectOnboard: (token?: string) =>
    payohRequest<StripeConnectOnboardPayload>(
      "/business/stripe/connect/onboard",
      undefined,
      token ?? withToken()
    ),
};

export const maskStripeAccountId = (accountId?: string) => {
  if (!accountId) return "";
  if (accountId.length <= 8) return accountId;
  return `${accountId.slice(0, 5)}${"•".repeat(8)}${accountId.slice(-4)}`;
};

export const STRIPE_REQUIRED_FOR_PRODUCT_MESSAGE =
  "Per aggiungere un nuovo prodotto devi prima collegare il conto bancario con Stripe Connect.";

export const isStripeConnectReady = (status: StripeConnectStatus | null | undefined) =>
  Boolean(status?.connected && status.onboardingComplete);
