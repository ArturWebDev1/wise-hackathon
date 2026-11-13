import { readFile } from 'node:fs/promises';
import pg, { Pool } from 'pg';
import type { Recipient, SharedData, Transfer, TransferStatus } from './types.js';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://hackathon:hackathon_dev@localhost:5432/hackathon',
});

pool.on('error', (error) => console.error('Idle database connection failed', error.message));

export const knownRecipients: Recipient[] = [
  { id: 'nikita', name: 'Nikita', initials: 'NG', relationship: 'Your son' },
  { id: 'anna', name: 'Anna', initials: 'AD', relationship: 'Your granddaughter' },
  { id: 'olga', name: 'Olga', initials: 'OK', relationship: 'Your friend' },
];

const HOUR = 3_600_000;
const seedTransfers: [string, Recipient, number, number][] = [
  ['sample-1', knownRecipients[1], 35, HOUR],
  ['sample-2', knownRecipients[0], 120, 24 * HOUR],
  ['sample-3', knownRecipients[2], 25, 48 * HOUR],
];

type Queryable = Pick<pg.PoolClient, 'query'>;

export async function seed(db: Queryable) {
  await db.query('DELETE FROM wl_transfers');
  await db.query('DELETE FROM wl_settings');
  await db.query(
    `INSERT INTO wl_settings (id, balance, transfer_limit, check_new, scam_pause, favourite_ids)
     VALUES (1, 4000, 250, true, true, $1)`,
    [knownRecipients.map((r) => r.id)],
  );
  for (const [id, recipient, amount, age] of seedTransfers)
    await db.query(
      `INSERT INTO wl_transfers (id, recipient, amount, status, created_at, pressured, is_new, above_limit)
       VALUES ($1, $2, $3, 'sent', now() - make_interval(secs => $4), false, false, false)`,
      [id, recipient, amount, age / 1000],
    );
}

export async function ensureSchema() {
  await pool.query(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
}

export async function ensureSeeded(db: Queryable) {
  const { rowCount } = await db.query('SELECT 1 FROM wl_settings');
  if (!rowCount) await seed(db);
}

type TransferRow = {
  id: string;
  recipient: Recipient;
  sender: Recipient | null;
  direction: 'incoming' | 'outgoing';
  amount: string;
  status: TransferStatus;
  created_at: Date;
  pressured: boolean;
  is_new: boolean;
  above_limit: boolean;
  limit_at_creation: string | null;
  expired: boolean;
};

const toTransfer = (row: TransferRow): Transfer => ({
  id: row.id,
  recipient: row.recipient,
  sender: row.sender ?? undefined,
  direction: row.direction,
  amount: Number(row.amount),
  status: row.status,
  createdAt: row.created_at.getTime(),
  pressured: row.pressured,
  isNew: row.is_new,
  aboveLimit: row.above_limit,
  limitAtCreation: row.limit_at_creation === null ? undefined : Number(row.limit_at_creation),
  expired: row.expired,
});

export async function readState(db: Queryable): Promise<SharedData> {
  const [{ rows: settings }, { rows: transfers }] = await Promise.all([
    db.query('SELECT * FROM wl_settings WHERE id = 1'),
    db.query<TransferRow>('SELECT * FROM wl_transfers ORDER BY created_at DESC'),
  ]);
  const s = settings[0];
  return {
    balance: Number(s.balance),
    transfers: transfers.map(toTransfer),
    limit: s.transfer_limit === null ? null : Number(s.transfer_limit),
    checkNew: s.check_new,
    scamPause: s.scam_pause,
    favouriteIds: s.favourite_ids,
    protectionOffAt: s.protection_off_at,
    inviteSent: s.invite_sent,
    consent: s.consent,
  };
}
