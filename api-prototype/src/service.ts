import type { PoolClient } from 'pg';
import { ensureSchema, ensureSeeded, knownRecipients, pool, readState, seed } from './db.js';
import { HttpError, type Recipient, type RuleKey, type SharedData } from './types.js';

const PENDING_TTL_MS = 12 * 3_600_000;
const PROTECTION_DELAY_MS = 24 * 3_600_000;
const DEFAULT_LIMIT = 300;
const MAX_AMOUNT = 1_000_000;
const MAX_TEXT_LENGTH = 100;
const RULE_KEYS: RuleKey[] = ['limit', 'checkNew', 'scamPause'];
const isRuleKey = (key: unknown): key is RuleKey => RULE_KEYS.some((rule) => rule === key);
const RULE_COLUMNS = {
  limit: 'transfer_limit',
  checkNew: 'check_new',
  scamPause: 'scam_pause',
} as const;

const round2 = (value: number) => Math.round(value * 100) / 100;
const newId = () => `transfer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function validIban(iban: string) {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const digits = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (char) =>
    String(char.charCodeAt(0) - 55),
  );
  let remainder = 0;
  for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}

const field = (value: unknown, key: string): unknown =>
  typeof value === 'object' && value !== null ? Reflect.get(value, key) : undefined;

const cleanIban = (iban: string) => iban.replace(/\s/g, '').toUpperCase();

export function parseRecipient(value: unknown): Recipient {
  const id = field(value, 'id');
  const known = knownRecipients.find((k) => k.id === id);
  if (known) return known;
  const name = field(value, 'name');
  const initials = field(value, 'initials');
  const iban = field(value, 'iban');
  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    !name.trim() ||
    typeof initials !== 'string' ||
    typeof iban !== 'string' ||
    !validIban(cleanIban(iban)) ||
    [id, name, initials].some((text) => text.length > MAX_TEXT_LENGTH)
  )
    throw new HttpError(400, 'Check the recipient’s name and IBAN and try again.');
  return { id, name: name.trim(), initials, relationship: 'New person', iban: cleanIban(iban) };
}

export function parseAmount(value: unknown) {
  const amount = typeof value === 'number' ? round2(value) : Number.NaN;
  if (!Number.isFinite(amount) || amount <= 0)
    throw new HttpError(400, 'Enter an amount greater than zero.');
  if (amount > MAX_AMOUNT) throw new HttpError(400, 'That amount is too large.');
  return amount;
}

type Db = Parameters<typeof readState>[0];

async function rollback(db: Pick<PoolClient, 'query'>) {
  try {
    await db.query('ROLLBACK');
  } catch (error) {
    console.error('Rollback failed', error);
  }
}

async function expireInTransaction(db: Db) {
  const expired = await db.query(
    `UPDATE wl_transfers SET status = 'declined', expired = true
     WHERE status = 'pending' AND created_at <= now() - make_interval(secs => $1)`,
    [PENDING_TTL_MS / 1000],
  );
  const { rows } = await db.query('SELECT protection_off_at FROM wl_settings WHERE id = 1');
  const offAt: Partial<Record<RuleKey, number>> = rows[0].protection_off_at;
  const now = Date.now();
  const due = RULE_KEYS.filter((key) => (offAt[key] ?? Infinity) <= now);
  for (const key of due) {
    delete offAt[key];
    await db.query(
      `UPDATE wl_settings SET ${RULE_COLUMNS[key]} = ${key === 'limit' ? 'NULL' : 'false'},
       protection_off_at = $1 WHERE id = 1`,
      [offAt],
    );
  }
  return Boolean(expired.rowCount) || due.length > 0;
}

/** Runs `work` in a transaction on the locked settings row, then broadcasts the new state. */
async function mutate<T>(work: (db: Db, state: SharedData) => Promise<T>) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    await ensureSeeded(db);
    await db.query('SELECT 1 FROM wl_settings WHERE id = 1 FOR UPDATE');
    await expireInTransaction(db);
    const result = await work(db, await readState(db));
    const state = await readState(db);
    await db.query('COMMIT');
    return { result, state };
  } catch (error) {
    await rollback(db);
    throw error;
  } finally {
    db.release();
  }
}

export async function init() {
  await ensureSchema();
  const db = await pool.connect();
  try {
    await ensureSeeded(db);
  } finally {
    db.release();
  }
}

export async function getState() {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    await ensureSeeded(db);
    await db.query('SELECT 1 FROM wl_settings WHERE id = 1 FOR UPDATE');
    await expireInTransaction(db);
    const state = await readState(db);
    await db.query('COMMIT');
    return state;
  } catch (error) {
    await rollback(db);
    throw error;
  } finally {
    db.release();
  }
}

export const isRisky = (s: SharedData, recipient: Recipient, amount: number) =>
  (s.checkNew && !s.favouriteIds.includes(recipient.id)) || (s.limit !== null && amount > s.limit);

export function createTransfer(input: { recipient: unknown; amount: unknown; pressured: unknown }) {
  const recipient = parseRecipient(input.recipient);
  const amount = parseAmount(input.amount);
  const pressured = input.pressured === true;
  return mutate(async (db, s) => {
    if (amount > s.balance)
      throw new HttpError(400, 'There is not enough money for this transfer.');
    const status = pressured ? 'blocked' : isRisky(s, recipient, amount) ? 'pending' : 'sent';
    const id = newId();
    await db.query(
      `INSERT INTO wl_transfers
         (id, recipient, amount, status, pressured, is_new, above_limit, limit_at_creation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        recipient,
        amount,
        status,
        pressured,
        !s.favouriteIds.includes(recipient.id),
        s.limit !== null && amount > s.limit,
        s.limit,
      ],
    );
    if (status === 'sent')
      await db.query('UPDATE wl_settings SET balance = balance - $1 WHERE id = 1', [amount]);
    return id;
  });
}

export function sendToMaria(amountInput: unknown) {
  const amount = parseAmount(amountInput);
  return mutate(async (db) => {
    const id = newId();
    await db.query(
      `INSERT INTO wl_transfers
         (id, recipient, sender, direction, amount, status, pressured, is_new, above_limit)
       VALUES ($1, $2, $3, 'incoming', $4, 'sent', false, false, false)`,
      [
        id,
        { id: 'maria', name: 'Maria', initials: 'MA', relationship: 'Mom' },
        knownRecipients[0],
        amount,
      ],
    );
    await db.query('UPDATE wl_settings SET balance = balance + $1 WHERE id = 1', [amount]);
    return id;
  });
}

export function decide(id: string, approve: unknown) {
  if (typeof approve !== 'boolean') throw new HttpError(400, 'Choose approve or decline.');
  return mutate(async (db, s) => {
    const transfer = s.transfers.find((t) => t.id === id);
    if (!transfer) throw new HttpError(404, 'This request isn’t available.');
    if (transfer.status !== 'pending')
      throw new HttpError(409, 'This request has already been answered.');
    if (approve && transfer.amount > s.balance)
      throw new HttpError(
        400,
        'Maria no longer has enough money for this transfer. Decline it instead.',
      );
    await db.query('UPDATE wl_transfers SET status = $2 WHERE id = $1', [
      id,
      approve ? 'approved' : 'declined',
    ]);
    if (approve)
      await db.query('UPDATE wl_settings SET balance = balance - $1 WHERE id = 1', [transfer.amount]);
  });
}

export function setLimit(limit: unknown) {
  if (typeof limit !== 'number' || !Number.isFinite(limit) || limit <= 0 || limit > MAX_AMOUNT)
    throw new HttpError(400, 'Enter a valid limit.');
  return mutate((db) => db.query('UPDATE wl_settings SET transfer_limit = $1 WHERE id = 1', [limit]));
}

export function toggleRule(key: unknown, enabled: unknown) {
  if (!isRuleKey(key) || typeof enabled !== 'boolean') throw new HttpError(400, 'Unknown rule.');
  const rule = key;
  return mutate(async (db, s) => {
    const offAt = { ...s.protectionOffAt };
    if (enabled) {
      delete offAt[rule];
      if (rule === 'limit' && s.limit === null)
        await db.query('UPDATE wl_settings SET transfer_limit = $1 WHERE id = 1', [DEFAULT_LIMIT]);
      if (rule !== 'limit')
        await db.query(`UPDATE wl_settings SET ${RULE_COLUMNS[rule]} = true WHERE id = 1`);
    } else offAt[rule] = Date.now() + PROTECTION_DELAY_MS;
    await db.query('UPDATE wl_settings SET protection_off_at = $1 WHERE id = 1', [offAt]);
  });
}

export function toggleFavourite(id: unknown) {
  if (typeof id !== 'string' || !knownRecipients.some((r) => r.id === id))
    throw new HttpError(400, 'Unknown person.');
  return mutate((db, s) =>
    db.query('UPDATE wl_settings SET favourite_ids = $1 WHERE id = 1', [
      s.favouriteIds.includes(id)
        ? s.favouriteIds.filter((v) => v !== id)
        : [...s.favouriteIds, id],
    ]),
  );
}

export const invite = () =>
  mutate((db) => db.query('UPDATE wl_settings SET invite_sent = true WHERE id = 1'));
export const agree = () =>
  mutate((db) => db.query('UPDATE wl_settings SET consent = true WHERE id = 1'));
export const reset = () => mutate((db) => seed(db));
