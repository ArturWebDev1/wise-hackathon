import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { initialsOf, isRisky } from './rules';
import {
  ApiError,
  demoLogin,
  request,
  type ApprovalReason,
  type Person,
  type SpringMutation,
  type SpringState,
} from './wise-spring-api';

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
  transferRecipients: Recipient[];
  favouriteIds: string[];
  requestPeople: Recipient[];
  protectionOffAt: Partial<Record<RuleKey, number>>;
  inviteSent: boolean;
  consent: boolean;
};
type WiseState = SharedData & {
  role: Role | null;
  account: AccountView | null;
  ready: boolean;
  offline: boolean;
  submit: (recipient: Recipient, amount: number, pressured: boolean) => Promise<string>;
  sendToMaria: (amount: number) => Promise<string>;
  decide: (id: string, approve: boolean) => Promise<void>;
  setRole: (role: Role | null) => void;
  setLimit: (limit: number) => Promise<void>;
  lookupRecipient: (wiseId: string) => Promise<Person>;
  toggleRule: (key: RuleKey, enabled: boolean) => Promise<void>;
  setRequestPerson: (id: string, enabled: boolean) => Promise<void>;
  invite: () => Promise<void>;
  agree: () => Promise<void>;
  reset: () => Promise<void>;
};

export const recipients: Recipient[] = [
  { id: 'nikita', name: 'Nikita', initials: 'NG', relationship: 'Your son' },
  { id: 'anna', name: 'Anna', initials: 'AD', relationship: 'Your granddaughter' },
  { id: 'olga', name: 'Olga', initials: 'OK', relationship: 'Your friend' },
];

type AccountView = Pick<Person, 'name' | 'wiseId'> & { initials: string };

const DEMO_ACCOUNT_DISPLAY: Record<Role, AccountView> = {
  maria: { name: 'Maria', initials: 'MA', wiseId: 'maria' },
  nikita: { name: 'Nikita', initials: 'NG', wiseId: 'nikita' },
};

export function useAccount() {
  return useWise((state) => state.account ?? DEMO_ACCOUNT_DISPLAY[state.role ?? 'maria']);
}

const POLL_INTERVAL_MS = 1500;
const EMPTY_STATE: SharedData = {
  balance: 0,
  transfers: [],
  limit: null,
  checkNew: true,
  scamPause: false,
  transferRecipients: [],
  favouriteIds: [],
  requestPeople: [],
  protectionOffAt: {},
  inviteSent: false,
  consent: true,
};

let hydrated = false;
let changeCount = 0;
let mutationCount = 0;
let session: { role: Role; token: string } | undefined;
let signingIn: { role: Role; promise: Promise<string> } | undefined;
let syncStarted = false;
let refreshAfterHydration: (() => void) | undefined;
const pendingTransfers = new Map<string, { key: string; reasons?: ApprovalReason[] }>();

function attemptFor(operation: string) {
  const attempt = pendingTransfers.get(operation) ?? {
    key: [
      Date.now(),
      Math.random().toString(36).slice(2),
      Math.random().toString(36).slice(2),
    ].join('-'),
  };
  pendingTransfers.set(operation, attempt);
  return attempt;
}

async function completeTransfer(operation: string, submit: () => Promise<SpringMutation>) {
  try {
    const result = await submit();
    pendingTransfers.delete(operation);
    return result;
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status >= 400 &&
      error.status < 500 &&
      error.status !== 401
    ) {
      pendingTransfers.delete(operation);
    }
    throw error;
  }
}

function recipientView(person: Person): Recipient {
  const known = recipients.find((candidate) => candidate.id === person.id);
  return {
    id: person.id,
    name: person.name,
    initials: known?.initials ?? initialsOf(person.name),
    relationship: known?.relationship ?? '',
  };
}

function toSharedState(state: SpringState): SharedData & { account: AccountView } {
  const { id, name, wiseId } = state.account;
  const account = {
    name,
    wiseId,
    initials: id === 'maria' || id === 'nikita' ? DEMO_ACCOUNT_DISPLAY[id].initials : initialsOf(name),
  };
  return {
    ...EMPTY_STATE,
    account,
    balance: state.accountBalance,
    transferRecipients: state.recipients.map(recipientView),
    limit: state.limit,
    checkNew: state.checkNew,
    protectionOffAt: state.protectionOffAt ?? {},
    favouriteIds: state.recipients.map((person) => person.id),
    requestPeople: state.requestPeople.map(recipientView),
    transfers: state.transfers.map((item) => ({
      ...item,
      recipient: recipientView(item.recipient),
      sender: item.sender ? recipientView(item.sender) : undefined,
      pressured: false,
    })),
  };
}

async function authenticate(role: Role) {
  if (session?.role === role) return session.token;
  if (signingIn?.role === role) return signingIn.promise;

  const attempt = { role, promise: demoLogin(role) };
  signingIn = attempt;
  try {
    const token = await attempt.promise;
    if (signingIn === attempt && useWise.getState().role === role) session = { role, token };
    return token;
  } finally {
    if (signingIn === attempt) signingIn = undefined;
  }
}

async function withSession<T>(role: Role, action: (token: string) => Promise<T>): Promise<T> {
  const token = await authenticate(role);
  try {
    if (useWise.getState().role !== role) throw new Error('The demo account changed. Try again.');
    return await action(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && session?.token === token) {
      session = undefined;
    }
    throw error;
  }
}

async function unavailable(message: string): Promise<never> {
  throw new Error(message);
}

export const useWise = create<WiseState>()(
  persist(
    (set, get) => {
      async function mutate(action: (token: string) => Promise<SpringMutation>) {
        const role = get().role;
        if (!role) throw new Error('Choose a demo account first.');
        const startedAt = ++changeCount;
        mutationCount++;
        try {
          const result = await withSession(role, action);
          if (startedAt === changeCount && get().role === role) {
            set({ ...toSharedState(result.state), ready: true, offline: false });
          }
          return result.id ?? '';
        } finally {
          mutationCount--;
        }
      }

      const send = (method: 'POST' | 'PUT', path: string, body: unknown) =>
        mutate((token) => request<SpringMutation>(method, path, token, body));

      return {
        ...EMPTY_STATE,
        role: null,
        account: null,
        ready: false,
        offline: false,
        setRole: (role) => {
          if (get().role === role) return;
          changeCount++;
          const previous = session;
          session = undefined;
          signingIn = undefined;
          set({ ...EMPTY_STATE, role, account: null, ready: !role, offline: false });
          if (previous) void request('POST', '/auth/logout', previous.token).catch(() => undefined);
        },
        lookupRecipient: async (wiseId) => {
          const role = get().role;
          if (!role) throw new Error('Choose a demo account first.');
          return withSession(role, (token) =>
            request<Person>('GET', `/recipients/lookup?wiseId=${encodeURIComponent(wiseId)}`, token),
          );
        },
        submit: (recipient, amount, pressured) => {
          if (pressured) return unavailable('Scam Pause is unavailable in this demo.');
          if (recipient.iban)
            return unavailable('This demo can send only to existing Wise accounts.');
          const operation = JSON.stringify([get().role, recipient.id, amount]);
          const attempt = attemptFor(operation);
          const expectedApproval = isRisky(get(), recipient, amount);
          return mutate((token) =>
            completeTransfer(operation, async () => {
              const payment = { recipientId: recipient.id, amount };
              if (!attempt.reasons) {
                const { reasons } = await request<{ reasons: ApprovalReason[] }>(
                  'POST',
                  '/transfers/preview',
                  token,
                  payment,
                );
                if (reasons.length > 0 !== expectedApproval) {
                  throw new ApiError(409, 'Protection rules changed. Review the transfer again.');
                }
                attempt.reasons = reasons;
              }
              return request<SpringMutation>(
                'POST',
                '/transfers',
                token,
                { ...payment, expectedReasons: attempt.reasons },
                attempt.key,
              );
            }),
          );
        },
        sendToMaria: (amount) => {
          const operation = JSON.stringify([get().role, 'to-protected-account', amount]);
          const { key } = attemptFor(operation);
          return mutate((token) =>
            completeTransfer(operation, () =>
              request<SpringMutation>(
                'POST',
                '/transfers/to-protected-account',
                token,
                { amount },
                key,
              ),
            ),
          );
        },
        decide: async (id, approve) => {
          await send('POST', `/transfers/${id}/decision`, { approve });
        },
        setLimit: async (limit) => {
          await send('PUT', '/settings/limit', { limit });
        },
        toggleRule: async (key, enabled) => {
          if (key === 'scamPause') {
            await unavailable('Scam Pause is unavailable in this demo.');
            return;
          }
          await send('PUT', `/settings/rules/${key}`, { enabled });
        },
        setRequestPerson: async (id, enabled) => {
          const allowed = get().requestPeople.map((person) => person.id);
          const accountIds = enabled
            ? [...new Set([...allowed, id])]
            : allowed.filter((person) => person !== id);
          await send('PUT', '/settings/request-people', { accountIds });
        },
        invite: () => unavailable('Maria and Nikita are already linked for this demo.'),
        agree: () => unavailable('Maria and Nikita are already linked for this demo.'),
        reset: async () => {
          await send('POST', '/demo/reset', undefined);
          pendingTransfers.clear();
        },
      };
    },
    {
      name: 'wise-lite-role-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ role: s.role }),
      onRehydrateStorage: () => () => {
        hydrated = true;
        queueMicrotask(() => useWise.setState({ ready: !useWise.getState().role }));
        refreshAfterHydration?.();
      },
    },
  ),
);

/** Polls one snapshot at a time while the app is active. */
export function startSync() {
  if (syncStarted) return;
  syncStarted = true;
  const web = Platform.OS === 'web' && typeof document !== 'undefined';
  const active = () => (web ? !document.hidden : AppState.currentState === 'active');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let refresh = false;

  const schedule = () => {
    clearTimeout(timer);
    if (active() && useWise.getState().role) {
      timer = setTimeout(() => void pull(), POLL_INTERVAL_MS);
    }
  };
  const pull = async () => {
    const role = useWise.getState().role;
    if (!hydrated || !role || !active()) return;
    if (running) {
      refresh = true;
      return;
    }
    if (mutationCount > 0) {
      schedule();
      return;
    }
    running = true;
    const startedAt = changeCount;
    try {
      const state = await withSession(role, (token) =>
        request<SpringState>('GET', '/state', token),
      );
      if (startedAt === changeCount && useWise.getState().role === role) {
        useWise.setState({ ...toSharedState(state), ready: true, offline: false });
      }
    } catch {
      if (startedAt === changeCount && useWise.getState().role === role) {
        useWise.setState({ offline: true });
      }
    } finally {
      running = false;
      if (refresh) {
        refresh = false;
        void pull();
      } else schedule();
    }
  };

  useWise.subscribe((current, previous) => {
    if (current.role === previous.role) return;
    clearTimeout(timer);
    if (current.role) void pull();
  });
  const onActiveChange = () => {
    clearTimeout(timer);
    if (active()) void pull();
  };
  if (web) document.addEventListener('visibilitychange', onActiveChange);
  else AppState.addEventListener('change', onActiveChange);
  refreshAfterHydration = () => void pull();
  void pull();
}

export { isRisky, initialsOf, validIban } from './rules';
export function money(value: number, decimals = false) {
  return `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimals ? 2 : 0, maximumFractionDigits: 2 }).format(value)} €`;
}
export function dayLabel(time: number) {
  const days = Math.floor((Date.now() - time) / 86400000);
  return days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
}
