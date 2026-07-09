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
};
