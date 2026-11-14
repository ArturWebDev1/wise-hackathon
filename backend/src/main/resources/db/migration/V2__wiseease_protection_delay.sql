ALTER TABLE we_protection
    ADD COLUMN threshold_off_at timestamptz,
    ADD COLUMN check_new_off_at timestamptz;
