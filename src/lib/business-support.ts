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

export function getSupportTicketId(ticket: SupportTicket, fallbackIdx = 0) {
  return ticket._id || `ticket-${fallbackIdx}`;
}

export function formatSupportTicketCode(ticketId: string) {
  const compact = ticketId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const suffix = compact.slice(-6) || compact || "000000";
  return `#TICK-${suffix}`;
}

export function formatSupportTicketUpdated(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / (60 * 1000));
  if (diffMinutes < 1) return "Ultima risposta: adesso";
  if (diffMinutes < 60) return `Ultima risposta: ${diffMinutes} min fa`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `Ultima risposta: ${diffHours} ore fa`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "Ultima risposta: ieri";
  if (diffDays < 7) return `Ultima risposta: ${diffDays} giorni fa`;

  return `Ultimo aggiornamento: ${new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)}`;
}

export function formatSupportTicketStatus(status?: string) {
  if (!status) return "—";
  if (status === "open") return "Aperto";
  if (status === "closed") return "Chiuso";
  return status;
}

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
