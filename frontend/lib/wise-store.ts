import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type Role = 'maria' | 'nikita';
export type RuleKey = 'limit' | 'checkNew' | 'scamPause';
export type Recipient = {
  id: string;
  name: string;
  initials: string;
  relationship: string;
  iban?: string;
};
export type TransferStatus = 'sent' | 'pending' | 'approved' | 'declined' | 'blocked';
export type Transfer = {
  id: string;
  recipient: Recipient;
  direction: 'incoming' | 'outgoing';
  sender?: Recipient;
  amount: number;
  status: TransferStatus;
  createdAt: number;
  pressured: boolean;
  isNew: boolean;
  aboveLimit: boolean;
  limitAtCreation?: number;
  expired: boolean;
};
export type SharedData = {
  balance: number;
  transfers: Transfer[];
  /** `null` means the limit check is switched off. */
  limit: number | null;
  checkNew: boolean;
  scamPause: boolean;
  favouriteIds: string[];
  protectionOffAt: Partial<Record<RuleKey, number>>;
  inviteSent: boolean;
  consent: boolean;
};
type ApiResponse = { id?: string; state: SharedData };
type WiseState = SharedData & {
  role: Role | null;
  ready: boolean;
  offline: boolean;
  submit: (recipient: Recipient, amount: number, pressured: boolean) => Promise<string>;
  sendToMaria: (amount: number) => Promise<string>;
  decide: (id: string, approve: boolean) => Promise<void>;
  setRole: (role: Role | null) => void;
  setLimit: (limit: number) => Promise<void>;
  toggleRule: (key: RuleKey, enabled: boolean) => Promise<void>;
  toggleFavourite: (id: string) => Promise<void>;
  invite: () => Promise<void>;
  agree: () => Promise<void>;
  reset: () => Promise<void>;
};

export const recipients: Recipient[] = [
  { id: 'nikita', name: 'Nikita', initials: 'NG', relationship: 'Your son' },
  { id: 'anna', name: 'Anna', initials: 'AD', relationship: 'Your granddaughter' },
  { id: 'olga', name: 'Olga', initials: 'OK', relationship: 'Your friend' },
];

/**
 * IMPORTANT: the signed-in account (name, initials) must always be read from here, never
 * hard-coded in a screen, so the avatar changes with who is logged in (MA / NG).
 * With the Spring backend this comes from the `account` in the POST /auth/login response.
 */
export function accountFor(role: Role | null) {
  return role === 'nikita'
    ? { name: 'Nikita', initials: 'NG', wiseId: 'nikita1147' }
    : { name: 'Maria', initials: 'MA', wiseId: 'maria1147' };
}

const POLL_INTERVAL_MS = 1500;
const REQUEST_TIMEOUT_MS = 8000;
const API_PORT = 3001;

function apiBase() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const host =
    Platform.OS === 'web' ? window.location.hostname : Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:${API_PORT}`;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  body?: unknown,
): Promise<T> {
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    response = await fetch(`${apiBase()}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error('Can’t reach the server. Check your connection and try again.');
  } finally {
    clearTimeout(timeout);
  }
  const data: T & { error?: string } = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? 'Something went wrong. Try again.');
  return data;
}

let hydrated = false;
/** Counts applied changes, so a slow poll can't overwrite a newer answer from the server. */
let changeCount = 0;
let loaded = false;
function markReady() {
  if (hydrated && loaded) useWise.setState({ ready: true });
}

export const useWise = create<WiseState>()(
  persist(
    (set) => {
      /** Sends a change to the server and applies the state it returns. */
      const send = async (method: 'POST' | 'PUT', path: string, body?: unknown) => {
        const { id, state } = await request<ApiResponse>(method, path, body);
        changeCount++;
        set(state);
        return id ?? '';
      };
      return {
        balance: 0,
        transfers: [],
        limit: null,
        checkNew: true,
        scamPause: true,
        favouriteIds: [],
        protectionOffAt: {},
        inviteSent: false,
        consent: false,
        role: null,
        ready: false,
        offline: false,
        setRole: (role) => set({ role }),
        submit: (recipient, amount, pressured) =>
          send('POST', '/transfers', { recipient, amount, pressured }),
        sendToMaria: (amount) => send('POST', '/transfers/send-to-maria', { amount }),
        decide: async (id, approve) => {
          await send('POST', `/transfers/${id}/decision`, { approve });
        },
        setLimit: async (limit) => {
          await send('PUT', '/settings/limit', { limit });
        },
        toggleRule: async (key, enabled) => {
          await send('PUT', `/settings/rules/${key}`, { enabled });
        },
        toggleFavourite: async (id) => {
          await send('POST', `/settings/favourites/${id}/toggle`);
        },
        invite: async () => {
          await send('POST', '/invite');
        },
        agree: async () => {
          await send('POST', '/consent');
        },
        reset: async () => {
          await send('POST', '/reset');
        },
      };
    },
    {
      name: 'wise-lite-role-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ role: s.role }),
      onRehydrateStorage: () => () => {
        hydrated = true;
        markReady();
      },
    },
  ),
);

async function pull() {
  const startedAt = changeCount;
  try {
    const state = await request<SharedData>('GET', '/state');
    loaded = true;
    useWise.setState(startedAt === changeCount ? { ...state, offline: false } : { offline: false });
    markReady();
  } catch {
    useWise.setState({ offline: true });
  }
}

let polling = false;
/** Keeps the store in step with the server, so both phones see each other's changes. */
export function startSync() {
  if (polling) return;
  polling = true;
  void pull();
  setInterval(() => void pull(), POLL_INTERVAL_MS);
}

export { isRisky, initialsOf, validIban } from './rules';
export function money(value: number, decimals = false) {
  return `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimals ? 2 : 0, maximumFractionDigits: 2 }).format(value)} €`;
}
export function dayLabel(time: number) {
  const days = Math.floor((Date.now() - time) / 86400000);
  return days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
}
