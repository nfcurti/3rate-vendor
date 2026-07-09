import { getBusinessAuthToken, payohRequest } from "./business-auth";

const withToken = () => {
  const token = getBusinessAuthToken();
  if (!token) throw new Error("Sessione scaduta. Accedi di nuovo.");
  return token;
};

export type BusinessNotification = Record<string, unknown>;

export type NotificationPreferences = {
  orders?: boolean;
  returns?: boolean;
  payouts?: boolean;
  marketing?: boolean;
};

export const businessNotificationsApi = {
  list: (token?: string) =>
    payohRequest<BusinessNotification[]>(
      "/business/notifications",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  markRead: (notificationIds?: string[], token?: string) =>
    payohRequest<Record<string, unknown>>(
      "/business/notifications/mark_read",
      notificationIds?.length ? { notificationIds } : {},
      token ?? withToken(),
      "PATCH"
    ),
  getPreferences: (token?: string) =>
    payohRequest<NotificationPreferences>(
      "/business/notifications/preferences",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  putPreferences: (input: NotificationPreferences, token?: string) =>
    payohRequest<NotificationPreferences>(
      "/business/notifications/preferences",
      input,
      token ?? withToken(),
      "PUT"
    ),
};
