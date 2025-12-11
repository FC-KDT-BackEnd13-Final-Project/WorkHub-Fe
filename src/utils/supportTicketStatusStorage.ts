import type { SupportTicketStatus } from "../data/supportTickets";

const STORAGE_KEY = "workhub:supportTicketStatus";
export const SUPPORT_STATUS_UPDATED_EVENT = "workhub:supportStatusUpdated";

const isBrowser = typeof window !== "undefined";

type StatusMap = Record<string, SupportTicketStatus>;

const readStatusMap = (): StatusMap => {
  if (!isBrowser) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as StatusMap;
    }
    return {};
  } catch {
    return {};
  }
};

const writeStatusMap = (map: StatusMap) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent(SUPPORT_STATUS_UPDATED_EVENT));
    }
  } catch {
    // ignore
  }
};

export const loadSupportStatusMap = (): StatusMap => readStatusMap();

export const loadSupportStatus = (ticketId: string): SupportTicketStatus | undefined => {
  const map = readStatusMap();
  return map[ticketId];
};

export const saveSupportStatus = (ticketId: string, status: SupportTicketStatus) => {
  const map = readStatusMap();
  map[ticketId] = status;
  writeStatusMap(map);
};
