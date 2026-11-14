-- Wise Care prototype tables. The wl_ prefix keeps them apart from the Spring Boot schema.
CREATE TABLE IF NOT EXISTS wl_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  balance numeric(12, 2) NOT NULL,
  transfer_limit numeric(12, 2),
  check_new boolean NOT NULL,
  scam_pause boolean NOT NULL,
  favourite_ids text[] NOT NULL,
  protection_off_at jsonb NOT NULL DEFAULT '{}',
  invite_sent boolean NOT NULL DEFAULT false,
  consent boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS wl_transfers (
  id text PRIMARY KEY,
  recipient jsonb NOT NULL,
  sender jsonb,
  direction text NOT NULL DEFAULT 'outgoing' CHECK (direction IN ('incoming', 'outgoing')),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  status text NOT NULL CHECK (status IN ('sent', 'pending', 'approved', 'declined', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  pressured boolean NOT NULL,
  is_new boolean NOT NULL,
  above_limit boolean NOT NULL,
  limit_at_creation numeric(12, 2),
  expired boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS wl_transfers_created_at_idx ON wl_transfers (created_at DESC);
