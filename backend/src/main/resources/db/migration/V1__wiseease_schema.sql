CREATE TABLE we_account (
    id text PRIMARY KEY,
    email text UNIQUE,
    wise_id text NOT NULL UNIQUE,
    display_name text NOT NULL,
    password_hash text,
    balance numeric(12, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0)
);

CREATE TABLE we_protection (
    owner_id text PRIMARY KEY REFERENCES we_account (id),
    helper_id text NOT NULL UNIQUE REFERENCES we_account (id),
    threshold numeric(12, 2) NOT NULL CHECK (threshold > 0),
    check_new boolean NOT NULL,
    CHECK (owner_id <> helper_id)
);

CREATE TABLE we_session (
    token_hash text PRIMARY KEY,
    account_id text NOT NULL REFERENCES we_account (id),
    expires_at timestamptz NOT NULL
);

CREATE TABLE we_transfer (
    id uuid PRIMARY KEY,
    sender_id text NOT NULL REFERENCES we_account (id),
    recipient_id text NOT NULL REFERENCES we_account (id),
    amount numeric(12, 2) NOT NULL CHECK (amount > 0),
    status text NOT NULL CHECK (status IN ('sent', 'pending', 'approved', 'declined')),
    above_limit boolean NOT NULL,
    new_recipient boolean NOT NULL,
    threshold_at_creation numeric(12, 2) NOT NULL,
    created_at timestamptz NOT NULL,
    expires_at timestamptz,
    idempotency_key text,
    UNIQUE (sender_id, idempotency_key),
    CHECK (sender_id <> recipient_id),
    CHECK (status <> 'pending' OR expires_at IS NOT NULL)
);

CREATE INDEX we_transfer_sender_idx ON we_transfer (sender_id, created_at DESC);
CREATE INDEX we_transfer_recipient_idx ON we_transfer (recipient_id, created_at DESC);

CREATE TABLE we_request_person (
    owner_id text NOT NULL REFERENCES we_protection (owner_id),
    account_id text NOT NULL REFERENCES we_account (id),
    PRIMARY KEY (owner_id, account_id),
    CHECK (owner_id <> account_id)
);

CREATE TABLE we_money_request (
    id uuid PRIMARY KEY,
    owner_id text NOT NULL REFERENCES we_protection (owner_id),
    recipient_id text NOT NULL REFERENCES we_account (id),
    amount numeric(12, 2) NOT NULL CHECK (amount > 0),
    created_at timestamptz NOT NULL DEFAULT now()
);
