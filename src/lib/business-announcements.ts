import { getBusinessAuthToken, payohRequest } from "./business-auth";

const withToken = () => {
  const token = getBusinessAuthToken();
  if (!token) throw new Error("Sessione scaduta. Accedi di nuovo.");
  return token;
};

export type Announcement = Record<string, unknown>;

export const businessAnnouncementsApi = {
  list: (token?: string) =>
    payohRequest<Announcement[]>(
      "/business/announcements",
      undefined,
      token ?? withToken(),
      "GET"
    ),
};

