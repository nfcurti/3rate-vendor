import { getBusinessAuthToken, payohRequest } from "./business-auth";

const withToken = () => {
  const token = getBusinessAuthToken();
  if (!token) throw new Error("Sessione scaduta. Accedi di nuovo.");
  return token;
};

export type SupportTicket = {
  _id?: string;
  subject?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SupportTicketMessage = {
  _id?: string;
  body?: string;
  senderType?: string;
  senderId?: string;
  createdAt?: string;
};

export const businessSupportApi = {
  listTickets: (token?: string) =>
    payohRequest<SupportTicket[]>(
      "/business/support/tickets",
      undefined,
      token ?? withToken(),
      "GET"
    ),
  getTicket: (ticketId: string, token?: string) =>
    payohRequest<SupportTicket>(
      `/business/support/tickets/${encodeURIComponent(ticketId)}`,
      undefined,
      token ?? withToken(),
      "GET"
    ),
  createTicket: (input: { subject: string; message?: string }, token?: string) =>
    payohRequest<SupportTicket>(
      "/business/support/tickets",
      input,
      token ?? withToken(),
      "POST"
    ),
  getMessages: (ticketId: string, token?: string) =>
    payohRequest<{ ticket: SupportTicket; messages: SupportTicketMessage[] }>(
      `/business/support/tickets/${encodeURIComponent(ticketId)}/messages`,
      undefined,
      token ?? withToken(),
      "GET"
    ),
  postMessage: (ticketId: string, body: string, token?: string) =>
    payohRequest<SupportTicketMessage>(
      `/business/support/tickets/${encodeURIComponent(ticketId)}/messages`,
      { body },
      token ?? withToken(),
      "POST"
    ),
};
