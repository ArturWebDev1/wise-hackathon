DO $seed$
BEGIN
    IF lower(trim($mode$ ${wiseeasedemoenabled} $mode$)) <> 'true' THEN
        RETURN;
    END IF;

    -- Maria's row marks a complete base seed because all inserts run in one transaction.
    -- This also preserves data created by the previous Java seeder.
    INSERT INTO we_account (id, email, wise_id, display_name, password_hash, balance)
    VALUES ('maria', 'maria@example.com', 'maria', 'Maria',
            'b24d518e834d59346d48fb80007c5c91:209f5137aad8195f82f3fe59c71bc31c8ee284d7ba0c5e9fa78417f0cbd7e470', 4000)
    ON CONFLICT (id) DO NOTHING;

    IF FOUND THEN
        INSERT INTO we_account (id, email, wise_id, display_name, password_hash, balance)
        VALUES ('nikita', 'nikita@example.com', 'nikita', 'Nikita',
                '0afeeb4c957a890e4a7dc35849be8628:3121851d4c8108f25577c4463c0a92a33c20c6d4a17a9a9694ec79a729308439', 5000),
               ('olga', NULL, 'olga', 'Olga', NULL, 25),
               ('anna', NULL, 'anna', 'Anna', NULL, 35);

        INSERT INTO we_protection (owner_id, helper_id, threshold, check_new)
        VALUES ('maria', 'nikita', 250, true);

        INSERT INTO we_request_person (owner_id, account_id)
        VALUES ('maria', 'nikita');
    END IF;

    -- Idempotent part, also applied to schemas seeded by an earlier version of this file.
    -- Maria already knows Anna, Nikita and Olga (history below); Ola, Liisa and Pavel are the
    -- "new people" the demo needs: a transfer to them always waits for Nikita.
    INSERT INTO we_account (id, email, wise_id, display_name, password_hash, balance)
    VALUES ('ola', NULL, 'ola', 'Ola Nordmann', NULL, 0),
           ('liisa', NULL, 'liisa', 'Liisa Tamm', NULL, 0),
           ('pavel', NULL, 'pavel', 'Pavel Ivanov', NULL, 0)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO we_transfer (id, sender_id, recipient_id, amount, status,
                             above_limit, new_recipient, threshold_at_creation, created_at)
    SELECT history.id, 'maria', history.recipient_id, history.amount, 'sent',
           false, false, 250, statement_timestamp() - history.age
    FROM (VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'olga', 25::numeric, interval '2 days'),
                 ('00000000-0000-0000-0000-000000000002'::uuid, 'nikita', 120::numeric, interval '1 day'),
                 ('00000000-0000-0000-0000-000000000003'::uuid, 'anna', 35::numeric, interval '1 hour'))
         AS history (id, recipient_id, amount, age)
    WHERE (SELECT count(*) FROM we_account WHERE id IN ('maria', 'nikita', 'olga', 'anna')) = 4
    ON CONFLICT (id) DO NOTHING;
END;
$seed$;
