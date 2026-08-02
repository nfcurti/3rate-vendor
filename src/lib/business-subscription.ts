import { getBusinessAuthToken, payohRequest } from "./business-auth";

const withToken = () => {
  const token = getBusinessAuthToken();
  if (!token) throw new Error("Sessione scaduta. Accedi di nuovo.");
  return token;
};

export type SubscriptionPlan = {
  _id?: string;
  code?: string;
  name?: string;
  description?: string;
  priceEur?: number;
  interval?: "month" | "year";
  features?: string[];
  isActive?: boolean;
};

export type CurrentSubscription = {
  subscription?: {
    _id?: string;
    planId?: string;
    status?: string;
    currentPeriodEnd?: string;
    stripeSubscriptionId?: string;
  };
  plan?: SubscriptionPlan;
} | null;

export type BusinessPaymentMethod = {
  _id?: string;
  id?: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault?: boolean;
};

export type AddPaymentMethodPayload = {
  clientSecret?: string | null;
  setupIntentId?: string | null;
  url?: string | null;
  redirectUrl?: string | null;
};

export const businessSubscriptionApi = {
  getPlans: () =>
    payohRequest<SubscriptionPlan[]>("/business/subscription/plans", undefined, undefined, "GET"),
  getCurrent: (token?: string) =>
    payohRequest<CurrentSubscription>(
      "/business/subscription/current",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  changePlan: (planId: string, token?: string) =>
    payohRequest<Record<string, unknown>>(
      "/business/subscription/change_plan",
      { planId },
      token ?? withToken(),
      "POST"
    ),
  updatePaymentMethod: (paymentMethodId: string, token?: string) =>
    payohRequest<Record<string, unknown>>(
      "/business/subscription/update_payment_method",
      { paymentMethodId },
      token ?? withToken(),
      "POST"
    ),
  cancel: (token?: string) =>
    payohRequest<Record<string, unknown>>(
      "/business/subscription/cancel",
      {},
      token ?? withToken(),
      "POST"
    ),
  getPaymentMethods: (token?: string) =>
    payohRequest<BusinessPaymentMethod[]>(
      "/business/subscription/payment_methods",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  addPaymentMethod: (token?: string) =>
    payohRequest<AddPaymentMethodPayload>(
      "/business/subscription/add_payment_method",
      {},
      token ?? withToken(),
      "POST"
    ),
  removePaymentMethod: (paymentMethodId: string, token?: string) =>
    payohRequest<Record<string, unknown>>(
      "/business/subscription/remove_payment_method",
      { paymentMethodId },
      token ?? withToken(),
      "POST"
    ),
};

export const formatCardBrand = (brand?: string) => {
  if (!brand) return "Carta";
  const labels: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    american_express: "American Express",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
  };
  return labels[brand.toLowerCase()] ?? brand;
};
