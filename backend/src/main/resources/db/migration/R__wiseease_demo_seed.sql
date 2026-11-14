DO $seed$
BEGIN
    IF lower(trim($mode$ ${wiseeasedemoenabled} $mode$)) <> 'true' THEN
        RETURN;
    END IF;

    -- Maria's row marks a complete seed because all inserts run in one transaction.
    -- This also preserves data created by the previous Java seeder.
    INSERT INTO we_account (id, email, wise_id, display_name, password_hash, balance)
    VALUES ('maria', 'maria@example.com', 'maria', 'Maria',
            'b24d518e834d59346d48fb80007c5c91:209f5137aad8195f82f3fe59c71bc31c8ee284d7ba0c5e9fa78417f0cbd7e470', 4000)
    ON CONFLICT (id) DO NOTHING;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    INSERT INTO we_account (id, email, wise_id, display_name, password_hash, balance)
    VALUES ('nikita', 'nikita@example.com', 'nikita', 'Nikita',
            '0afeeb4c957a890e4a7dc35849be8628:3121851d4c8108f25577c4463c0a92a33c20c6d4a17a9a9694ec79a729308439', 5000),
           ('olga', NULL, 'olga', 'Olga', NULL, 25),
           ('anna', NULL, 'anna', 'Anna', NULL, 0);

    INSERT INTO we_protection (owner_id, helper_id, threshold, check_new)
    VALUES ('maria', 'nikita', 250, true);

    INSERT INTO we_request_person (owner_id, account_id)
    VALUES ('maria', 'nikita');

    INSERT INTO we_transfer (id, sender_id, recipient_id, amount, status,
                             above_limit, new_recipient, threshold_at_creation, created_at)
    VALUES ('00000000-0000-0000-0000-000000000001', 'maria', 'olga', 25, 'sent',
            false, false, 250, statement_timestamp() - interval '1 day');
END;
$seed$;
