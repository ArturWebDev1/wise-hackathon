import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { Role, TransferStatus } from './wise-store';

export type Person = { id: string; name: string; wiseId: string };
export type ApprovalReason = 'ABOVE_THRESHOLD' | 'NEW_RECIPIENT';

export type SpringState = {
  account: Person & { role: 'owner' | 'helper' };
  balance: number | null;
  accountBalance: number;
  limit: number;
  checkNew: boolean;
  recipients: Person[];
  transfers: {
    id: string;
    recipient: Person;
    sender: Person | null;
    direction: 'incoming' | 'outgoing';
    amount: number;
    status: Exclude<TransferStatus, 'blocked'>;
    createdAt: number;
    isNew: boolean;
    aboveLimit: boolean;
    limitAtCreation: number;
    expired: boolean;
  }[];
};

export type SpringMutation = { id?: string; state: SpringState };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function apiBase() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  const host =
    Platform.OS === 'web' ? window.location.hostname : Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:8080`;
}

export function request(method: 'POST', path: '/auth/logout', token: string): Promise<void>;
export function request<T>(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  token?: string,
  body?: unknown,
  key?: string,
): Promise<T>;
export async function request(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  token?: string,
  body?: unknown,
  key?: string,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${apiBase()}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(key ? { 'Idempotency-Key': key } : {}),
      },
      signal: controller.signal,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      const failure: { error?: string } = await response.json().catch(() => ({}));
      throw new ApiError(response.status, failure.error ?? 'Something went wrong. Try again.');
    }
    const result: unknown = response.status === 204 ? undefined : await response.json();
    return result;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'Can’t reach the server. Check your connection and try again.');
  } finally {
    clearTimeout(timeout);
  }
}

export async function demoLogin(role: Role) {
  const login = await request<{ token: string; account: SpringState['account'] }>(
    'POST',
    '/auth/login',
    undefined,
    { email: `${role}@example.com`, password: 'WiseEaseDemo!' },
  );
  const expectedRole = role === 'nikita' ? 'helper' : 'owner';
  if (login.account.role !== expectedRole) throw new Error('Unexpected demo account role.');
  return login.token;
}
