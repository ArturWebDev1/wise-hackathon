package com.team.hackathon.features.wiselite;

import com.team.hackathon.HackathonApplication;
import com.team.hackathon.features.wiselite.application.Households;
import com.team.hackathon.features.wiselite.application.Sessions;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = "wiseease.demo.enabled=true"
)
@ContextConfiguration(initializers = WiseEaseApiTest.DatabaseSchema.class)
@Execution(ExecutionMode.SAME_THREAD)
class WiseEaseApiTest {
    private static final JsonMapper JSON = new JsonMapper();
    private static final String DEMO_PASSWORD = "WiseEaseDemo!";
    private static final List<String> ABOVE_THRESHOLD = List.of("ABOVE_THRESHOLD");
    private static final List<String> NEW_RECIPIENT = List.of("NEW_RECIPIENT");
    private static final List<String> BOTH_REASONS = List.of("ABOVE_THRESHOLD", "NEW_RECIPIENT");
    private static final List<String> DEMO_RECIPIENTS = List.of("anna", "nikita", "olga");
    private static final List<String> DEMO_TRANSFERS = List.of(
        "00000000-0000-0000-0000-000000000001",
        "00000000-0000-0000-0000-000000000002",
        "00000000-0000-0000-0000-000000000003"
    );

    @LocalServerPort
    private int port;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void restoreDemoStateInTestSchema() {
        assertThat(jdbc.queryForObject("SELECT current_schema()", String.class)).isEqualTo(DatabaseSchema.NAME);
        jdbc.update("DELETE FROM we_money_request");
        jdbc.update("DELETE FROM we_session");
        jdbc.update("DELETE FROM we_transfer WHERE id NOT IN (?, ?, ?)",
            DEMO_TRANSFERS.stream().map(UUID::fromString).toArray());
        jdbc.update("DELETE FROM we_request_person");
        jdbc.update("DELETE FROM we_protection WHERE owner_id <> 'maria'");
        jdbc.update("DELETE FROM we_account WHERE id NOT IN ('maria', 'nikita', 'olga', 'anna', 'ola', 'liisa', 'pavel')");
        jdbc.update("""
            UPDATE we_account SET balance = CASE id WHEN 'maria' THEN 4000 WHEN 'nikita' THEN 5000
                WHEN 'olga' THEN 25 WHEN 'anna' THEN 35 ELSE 0 END
            """);
        jdbc.update("""
            UPDATE we_protection SET threshold = 250, check_new = true, threshold_off_at = NULL, check_new_off_at = NULL
            WHERE owner_id = 'maria'
            """);
        jdbc.update("INSERT INTO we_request_person (owner_id, account_id) VALUES ('maria', 'nikita')");
    }

    @AfterAll
    static void dropTestSchema() throws SQLException {
        if (DatabaseSchema.created) {
            DatabaseSchema.execute("DROP SCHEMA " + DatabaseSchema.NAME + " CASCADE");
        }
    }

    @Test
    void appliesFlywayMigrationsInAnEmptySchemaAndSeedsTheDemo() throws Exception {
        assertThat(jdbc.queryForList("SELECT version FROM flyway_schema_history WHERE version IS NOT NULL AND success",
            String.class)).containsExactlyInAnyOrder("1", "2");
        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            JsonNode openingState = state(client, maria);
            assertThat(openingState.path("balance").decimalValue()).isEqualByComparingTo("4000");
            assertThat(openingState.path("limit").decimalValue()).isEqualByComparingTo("250");
            assertThat(personIds(openingState, "recipients")).containsExactlyInAnyOrderElementsOf(DEMO_RECIPIENTS);
            assertThat(transferIds(openingState)).containsExactlyInAnyOrderElementsOf(DEMO_TRANSFERS);
            for (String newRecipient : List.of("ola", "liisa", "pavel")) {
                assertThat(reasons(preview(client, maria, newRecipient, 50), "reasons"))
                    .containsExactlyElementsOf(NEW_RECIPIENT);
            }
            assertThat(openingState.path("protectionOffAt").isEmpty()).isTrue();
        }
    }

    @Test
    void restartsWithoutRepeatingMigrationsOrResettingDemoData() throws Exception {
        String id;
        try (HttpClient client = HttpClient.newHttpClient()) {
            id = create(client, login(client, "maria"), "olga", 40, List.of());
        }

        try (var restarted = new SpringApplicationBuilder(HackathonApplication.class)
            .web(WebApplicationType.NONE)
            .run("--spring.datasource.url=" + DatabaseSchema.testUrl,
                "--spring.datasource.username=" + DatabaseSchema.username,
                "--spring.datasource.password=" + DatabaseSchema.password,
                "--spring.flyway.default-schema=" + DatabaseSchema.NAME,
                "--wiseease.demo.enabled=true")) {
            Households.State persisted = restarted.getBean(Households.class).state("maria");
            assertThat(persisted.balance()).isEqualByComparingTo("3960");
            assertThat(persisted.transfers()).hasSize(DEMO_TRANSFERS.size() + 1)
                .anySatisfy(transfer -> {
                    assertThat(transfer.id().toString()).isEqualTo(id);
                    assertThat(transfer.status()).isEqualTo("sent");
                });
            assertThat(jdbc.queryForList("SELECT version FROM flyway_schema_history WHERE version IS NOT NULL AND success",
                String.class)).containsExactlyInAnyOrder("1", "2");
        }
    }

    @Test
    void requiresServerSideAuthenticationAndReturnsTheAccountRole() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            assertThat(send(client, "GET", "/state", null, null).statusCode()).isEqualTo(401);
            assertThat(send(client, "POST", "/auth/login", null,
                Map.of("email", "maria@example.com", "password", "incorrect")).statusCode())
                .isEqualTo(401);

            String maria = login(client, "maria");
            String nikita = login(client, "nikita");
            assertThat(maria).isNotEqualTo(nikita);
            assertThat(state(client, maria).path("account").path("id").asString()).isEqualTo("maria");
            assertThat(state(client, nikita).path("account").path("id").asString()).isEqualTo("nikita");
            JsonNode olga = ok(send(client, "GET", "/recipients/lookup?wiseId=olga", maria, null));
            assertThat(olga.path("id").asString()).isEqualTo("olga");
            assertThat(ok(send(client, "GET", "/recipients/lookup?wiseId=nikita", nikita, null))
                .path("id").asString()).isEqualTo("nikita");
            assertThat(send(client, "GET", "/recipients/lookup?wiseId=unknown", maria, null).statusCode())
                .isEqualTo(404);
            assertThat(send(client, "PUT", "/settings/limit", maria, Map.of("limit", 400)).statusCode())
                .isEqualTo(403);
        }
    }

    @Test
    void revokesOnlyTheSessionThatLoggedOutAndRejectsAnExpiredSession() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            String first = login(client, "maria");
            String second = login(client, "maria");
            assertThat(send(client, "POST", "/auth/logout", first, null).statusCode()).isEqualTo(204);
            assertThat(send(client, "GET", "/state", first, null).statusCode()).isEqualTo(401);
            assertThat(state(client, second).path("account").path("id").asString()).isEqualTo("maria");

            assertThat(jdbc.update("UPDATE we_session SET expires_at = now() - interval '1 second' WHERE account_id = 'maria'"))
                .isEqualTo(1);
            assertThat(send(client, "GET", "/state", second, null).statusCode()).isEqualTo(401);
        }
    }

    @Test
    void keepsAnotherHouseholdsHistoryAndDecisionsSeparate() throws Exception {
        String credentials = Sessions.hashPassword(DEMO_PASSWORD);
        jdbc.update("""
            INSERT INTO we_account (id, email, wise_id, display_name, password_hash, balance)
            VALUES ('other-owner', 'other-owner@example.com', 'other-owner', 'Other Owner', ?, 1000),
                   ('other-helper', 'other-helper@example.com', 'other-helper', 'Other Helper', ?, 0)
            """, credentials, credentials);
        jdbc.update("""
            INSERT INTO we_protection (owner_id, helper_id, threshold, check_new)
            VALUES ('other-owner', 'other-helper', 100, true)
            """);

        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            String nikita = login(client, "nikita");
            String otherOwner = login(client, "other-owner");
            String otherHelper = login(client, "other-helper");
            String mariaTransfer = create(client, maria, "olga", 300, ABOVE_THRESHOLD);
            String otherTransfer = create(client, otherOwner, "anna", 50, NEW_RECIPIENT);

            JsonNode nikitaState = state(client, nikita);
            assertThat(nikitaState.path("ownerId").asString()).isEqualTo("maria");
            assertThat(nikitaState.path("balance").isNull()).isTrue();
            assertThat(transferIds(nikitaState)).contains(mariaTransfer).doesNotContain(otherTransfer);
            assertThat(transferIds(state(client, otherHelper))).containsExactly(otherTransfer);

            assertThat(send(client, "POST", decisionPath(mariaTransfer), otherHelper, Map.of("approve", true)).statusCode())
                .isEqualTo(404);
            assertThat(send(client, "POST", decisionPath(otherTransfer), nikita, Map.of("approve", true)).statusCode())
                .isEqualTo(404);
            ok(send(client, "PUT", "/settings/limit", otherHelper, Map.of("limit", 80)));
            assertThat(state(client, otherOwner).path("limit").decimalValue()).isEqualByComparingTo("80");
            assertThat(state(client, maria).path("limit").decimalValue()).isEqualByComparingTo("250");
            assertThat(transfer(state(client, maria), mariaTransfer).path("status").asString()).isEqualTo("pending");
        }
    }

    @Test
    void sendsAtTheThresholdAndCreditsTheRecipient() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            assertThat(reasons(preview(client, maria, "olga", 250), "reasons")).isEmpty();
            JsonNode sent = transferResponse(client, maria, "olga", 250, List.of(), UUID.randomUUID().toString());
            String id = sent.path("id").asString();
            assertThat(transfer(sent.path("state"), id).path("status").asString()).isEqualTo("sent");
            assertThat(sent.path("state").path("balance").decimalValue()).isEqualByComparingTo("3750");
            assertThat(balance("olga")).isEqualByComparingTo("275");
        }
    }

    @Test
    void sendsToAKnownRecipientAndUpdatesMariasStateAfterNikitaApprovesANewRecipient() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            String nikita = login(client, "nikita");
            assertThat(reasons(preview(client, maria, "anna", 50), "reasons")).isEmpty();
            String sent = create(client, maria, "anna", 50, List.of());
            JsonNode afterDirectTransfer = state(client, maria);
            assertThat(transfer(afterDirectTransfer, sent).path("status").asString()).isEqualTo("sent");
            assertThat(afterDirectTransfer.path("balance").decimalValue()).isEqualByComparingTo("3950");

            JsonNode ola = ok(send(client, "GET", "/recipients/lookup?wiseId=ola", maria, null));
            String recipient = ola.path("id").asString();
            assertThat(recipient).isEqualTo("ola");
            List<String> approvalReasons = reasons(preview(client, maria, recipient, 50), "reasons");
            assertThat(approvalReasons).containsExactlyElementsOf(NEW_RECIPIENT);
            String waiting = create(client, maria, recipient, 50, approvalReasons);

            JsonNode pending = state(client, maria);
            assertThat(transfer(pending, waiting).path("status").asString()).isEqualTo("pending");
            assertThat(pending.path("balance").decimalValue()).isEqualByComparingTo("3950");
            assertThat(transfer(state(client, nikita), waiting).path("status").asString()).isEqualTo("pending");
            assertThat(balance("ola")).isEqualByComparingTo("0");

            ok(send(client, "POST", decisionPath(waiting), nikita, Map.of("approve", true)));
            JsonNode approved = state(client, maria);
            assertThat(transfer(approved, waiting).path("status").asString()).isEqualTo("approved");
            assertThat(approved.path("balance").decimalValue()).isEqualByComparingTo("3900");
            assertThat(balance("anna")).isEqualByComparingTo("85");
            assertThat(balance("ola")).isEqualByComparingTo("50");
        }
    }

    @Test
    void delaysProtectionChangesAndRejectsAStalePreviewAfterExpiry() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            String nikita = login(client, "nikita");
            assertThat(reasons(preview(client, maria, "ola", 10), "reasons")).containsExactlyElementsOf(NEW_RECIPIENT);
            String waiting = create(client, maria, "ola", 10, NEW_RECIPIENT);
            long beforeScheduling = System.currentTimeMillis();
            JsonNode scheduled = ok(send(client, "PUT", "/settings/rules/checkNew", nikita, Map.of("enabled", false)))
                .path("state");
            long offAt = scheduled.path("protectionOffAt").path("checkNew").asLong();
            long day = Duration.ofHours(24).toMillis();
            assertThat(offAt).isBetween(beforeScheduling + day, System.currentTimeMillis() + day);
            assertThat(state(client, maria).path("checkNew").asBoolean()).isTrue();
            assertThat(reasons(preview(client, maria, "ola", 10), "reasons")).containsExactlyElementsOf(NEW_RECIPIENT);
            assertThat(ok(send(client, "PUT", "/settings/rules/checkNew", nikita, Map.of("enabled", false)))
                .path("state").path("protectionOffAt").path("checkNew").asLong()).isEqualTo(offAt);
            assertThat(ok(send(client, "PUT", "/settings/rules/checkNew", nikita, Map.of("enabled", true)))
                .path("state").path("protectionOffAt").has("checkNew")).isFalse();
            ok(send(client, "PUT", "/settings/rules/checkNew", nikita, Map.of("enabled", false)));
            jdbc.update("UPDATE we_protection SET check_new_off_at = now() - interval '1 second' WHERE owner_id = 'maria'");
            assertThat(state(client, maria).path("checkNew").asBoolean()).isFalse();
            assertThat(reasons(preview(client, maria, "ola", 10), "reasons")).isEmpty();
            assertThat(client.send(transferRequest(maria, "ola", 10, NEW_RECIPIENT, UUID.randomUUID().toString()),
                HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(409);
            JsonNode earlierRequest = transfer(state(client, nikita), waiting);
            assertThat(earlierRequest.path("status").asString()).isEqualTo("pending");
            assertThat(reasons(earlierRequest, "approvalReasons")).containsExactlyElementsOf(NEW_RECIPIENT);
            assertThat(balance("maria")).isEqualByComparingTo("4000");
            assertThat(balance("ola")).isEqualByComparingTo("0");
        }
    }

    @Test
    void letsTheHelperChangeTheThresholdAndRejectsInvalidSettings() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            String nikita = login(client, "nikita");
            ok(send(client, "PUT", "/settings/limit", nikita, Map.of("limit", new BigDecimal("199.99"))));
            assertThat(state(client, maria).path("limit").decimalValue()).isEqualByComparingTo("199.99");
            assertThat(reasons(preview(client, maria, "olga", 200), "reasons")).containsExactlyElementsOf(ABOVE_THRESHOLD);
            assertThat(send(client, "PUT", "/settings/limit", nikita, Map.of("limit", 0)).statusCode()).isEqualTo(400);
            assertThat(send(client, "PUT", "/settings/rules/checkNew", nikita, Map.of()).statusCode()).isEqualTo(400);
            assertThat(state(client, maria).path("limit").decimalValue()).isEqualByComparingTo("199.99");
        }
    }

    @Test
    void keepsTheThresholdActiveUntilItsOwnDeadlineAndRestoresTheSavedValue() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            String nikita = login(client, "nikita");
            String path = "/settings/rules/limit";
            assertThat(send(client, "PUT", path, maria, Map.of("enabled", false)).statusCode()).isEqualTo(403);

            ok(send(client, "PUT", "/settings/limit", nikita, Map.of("limit", 350)));
            ok(send(client, "PUT", path, nikita, Map.of("enabled", false)));
            JsonNode waiting = state(client, maria);
            assertThat(waiting.path("limit").decimalValue()).isEqualByComparingTo("350");
            assertThat(waiting.path("protectionOffAt").hasNonNull("limit")).isTrue();
            assertThat(reasons(preview(client, maria, "olga", 400), "reasons")).containsExactlyElementsOf(ABOVE_THRESHOLD);

            jdbc.update("UPDATE we_protection SET threshold_off_at = now() - interval '1 second' WHERE owner_id = 'maria'");
            JsonNode expired = state(client, maria);
            assertThat(expired.path("limit").isNull()).isTrue();
            assertThat(expired.path("protectionOffAt").has("limit")).isFalse();
            assertThat(reasons(preview(client, maria, "ola", 400), "reasons")).containsExactlyElementsOf(NEW_RECIPIENT);
            String direct = create(client, maria, "olga", 400, List.of());
            assertThat(transfer(state(client, maria), direct).path("status").asString()).isEqualTo("sent");

            ok(send(client, "PUT", path, nikita, Map.of("enabled", true)));
            assertThat(state(client, maria).path("limit").decimalValue()).isEqualByComparingTo("350");
            assertThat(reasons(preview(client, maria, "olga", 400), "reasons")).containsExactlyElementsOf(ABOVE_THRESHOLD);
        }
    }

    @Test
    void requiresBothReasonsAndSettlesOneTimeWhenTheSameApprovalRaces() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            String nikita = login(client, "nikita");
            List<String> actualReasons = reasons(preview(client, maria, "ola", 600), "reasons");
            assertThat(actualReasons).containsExactlyInAnyOrderElementsOf(BOTH_REASONS);
            String id = create(client, maria, "ola", 600, actualReasons);
            JsonNode pending = transfer(state(client, nikita), id);
            assertThat(pending.path("status").asString()).isEqualTo("pending");
            assertThat(reasons(pending, "approvalReasons")).containsExactlyInAnyOrderElementsOf(BOTH_REASONS);
            assertThat(pending.path("expiresAt").asLong() - pending.path("createdAt").asLong())
                .isEqualTo(Duration.ofHours(12).toMillis());
            assertThat(balance("maria")).isEqualByComparingTo("4000");
            assertThat(balance("ola")).isEqualByComparingTo("0");

            assertThat(send(client, "POST", decisionPath(id), maria, Map.of("approve", true)).statusCode()).isEqualTo(404);
            HttpRequest approve = request("POST", decisionPath(id), nikita, Map.of("approve", true)).build();
            assertThat(concurrentResponses(client, approve, approve).stream().map(HttpResponse::statusCode).toList())
                .containsExactlyInAnyOrder(200, 409);

            JsonNode approved = state(client, maria);
            assertThat(transfer(approved, id).path("status").asString()).isEqualTo("approved");
            assertThat(approved.path("balance").decimalValue()).isEqualByComparingTo("3400");
            assertThat(balance("ola")).isEqualByComparingTo("600");
            assertThat(personIds(approved, "recipients")).contains("ola");
            assertThat(reasons(preview(client, maria, "ola", 10), "reasons")).isEmpty();
        }
    }

    @Test
    void letsOnlyOneOfTwoPendingTransfersSpendTheSameFunds() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            String nikita = login(client, "nikita");
            String toOlga = create(client, maria, "olga", 3000, ABOVE_THRESHOLD);
            String toOla = create(client, maria, "ola", 3000, BOTH_REASONS);
            HttpRequest approveOlga = request("POST", decisionPath(toOlga), nikita, Map.of("approve", true)).build();
            HttpRequest approveOla = request("POST", decisionPath(toOla), nikita, Map.of("approve", true)).build();
            assertThat(concurrentResponses(client, approveOlga, approveOla).stream().map(HttpResponse::statusCode).toList())
                .containsExactlyInAnyOrder(200, 400);

            JsonNode after = state(client, maria);
            assertThat(List.of(transfer(after, toOlga).path("status").asString(),
                transfer(after, toOla).path("status").asString())).containsExactlyInAnyOrder("approved", "pending");
            assertThat(after.path("balance").decimalValue()).isEqualByComparingTo("1000");
            assertThat(balance("olga").add(balance("ola"))).isEqualByComparingTo("3025");
        }
    }

    @Test
    void replaysConcurrentCreatesAndRejectsReusingTheKeyWithDifferentPaymentDetails() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            String key = UUID.randomUUID().toString();
            HttpRequest create = transferRequest(maria, "olga", 125, List.of(), key);
            List<JsonNode> responses = concurrentResponses(client, create, create).stream().map(WiseEaseApiTest::ok).toList();
            String id = responses.getFirst().path("id").asString();
            assertThat(responses.getLast().path("id").asString()).isEqualTo(id);
            assertThat(client.send(transferRequest(maria, "olga", 130, List.of(), key),
                HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(409);
            assertThat(client.send(transferRequest(maria, "ola", 125, NEW_RECIPIENT, key),
                HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(409);
            assertThat(transferIds(state(client, maria))).hasSize(DEMO_TRANSFERS.size() + 1).contains(id);
            assertThat(balance("maria")).isEqualByComparingTo("3875");
            assertThat(balance("olga")).isEqualByComparingTo("150");
            assertThat(balance("ola")).isEqualByComparingTo("0");
        }
    }

    @ParameterizedTest(name = "{0} EUR is invalid")
    @ValueSource(strings = {"0", "-1.00", "1.001", "1000000.01"})
    void rejectsInvalidAmountsWithoutCreatingATransfer(String amount) throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            assertThat(client.send(transferRequest(maria, "olga", new BigDecimal(amount), List.of(), UUID.randomUUID().toString()),
                HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(400);
            assertThat(transferIds(state(client, maria))).containsExactlyInAnyOrderElementsOf(DEMO_TRANSFERS);
            assertThat(balance("maria")).isEqualByComparingTo("4000");
        }
    }

    @Test
    void declinesARequestWithoutMovingMoney() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            String nikita = login(client, "nikita");
            String id = create(client, maria, "olga", 300, ABOVE_THRESHOLD);
            ok(send(client, "POST", decisionPath(id), nikita, Map.of("approve", false)));
            JsonNode declined = transfer(state(client, maria), id);
            assertThat(declined.path("status").asString()).isEqualTo("declined");
            assertThat(declined.path("expired").asBoolean()).isFalse();
            assertThat(balance("maria")).isEqualByComparingTo("4000");
            assertThat(balance("olga")).isEqualByComparingTo("25");
        }
    }

    @Test
    void rejectsLateDecisionsAndReportsTheExpiredStateWithoutMovingMoney() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            String nikita = login(client, "nikita");
            String id = create(client, maria, "olga", 300, ABOVE_THRESHOLD);
            jdbc.update("""
                UPDATE we_transfer
                SET created_at = now() - interval '12 hours', expires_at = now()
                WHERE id = ?
                """, UUID.fromString(id));
            assertThat(send(client, "POST", decisionPath(id), nikita, Map.of("approve", true)).statusCode()).isEqualTo(409);
            assertThat(send(client, "POST", decisionPath(id), nikita, Map.of("approve", false)).statusCode()).isEqualTo(409);
            JsonNode expired = transfer(state(client, maria), id);
            assertThat(expired.path("status").asString()).isEqualTo("declined");
            assertThat(expired.path("expired").asBoolean()).isTrue();
            assertThat(balance("maria")).isEqualByComparingTo("4000");
            assertThat(balance("olga")).isEqualByComparingTo("25");
        }
    }

    @Test
    void rollsBackTheApprovalAndSenderDebitIfTheRecipientCreditFails() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            String nikita = login(client, "nikita");
            String id = create(client, maria, "olga", 300, ABOVE_THRESHOLD);
            jdbc.update("UPDATE we_account SET balance = 9999999999.99 WHERE id = 'olga'");
            assertThat(send(client, "POST", decisionPath(id), nikita, Map.of("approve", true)).statusCode()).isEqualTo(500);
            assertThat(transfer(state(client, maria), id).path("status").asString()).isEqualTo("pending");
            assertThat(balance("maria")).isEqualByComparingTo("4000");
            assertThat(balance("olga")).isEqualByComparingTo("9999999999.99");
        }
    }

    @Test
    void createsMoneyRequestsOnlyForPeopleConfiguredByTheHelper() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            String nikita = login(client, "nikita");
            BigDecimal balance = state(client, maria).path("balance").decimalValue();
            Map<String, Object> request = Map.of("recipientId", "anna", "amount", 25);
            Map<String, Object> updatedPeople = Map.of("accountIds", List.of("nikita", "anna"));

            assertThat(send(client, "PUT", "/settings/request-people", maria, updatedPeople).statusCode())
                .isEqualTo(403);
            assertThat(send(client, "POST", "/money-requests", maria, request).statusCode()).isEqualTo(400);
            ok(send(client, "PUT", "/settings/request-people", nikita, updatedPeople));
            assertThat(personIds(state(client, maria), "requestPeople")).containsExactlyInAnyOrder("nikita", "anna");
            assertThat(send(client, "PUT", "/settings/request-people", nikita,
                Map.of("accountIds", List.of("anna", "anna"))).statusCode()).isEqualTo(400);
            assertThat(send(client, "POST", "/money-requests", maria,
                Map.of("recipientId", "anna", "amount", 0)).statusCode()).isEqualTo(400);
            JsonNode submitted = ok(send(client, "POST", "/money-requests", maria, request));
            assertThat(submitted.path("id").asString()).isNotBlank();
            assertThat(submitted.path("state").path("balance").decimalValue()).isEqualByComparingTo(balance);
            assertThat(jdbc.queryForObject("SELECT recipient_id FROM we_money_request WHERE id = ?", String.class,
                UUID.fromString(submitted.path("id").asString()))).isEqualTo("anna");

            ok(send(client, "PUT", "/settings/request-people", nikita, Map.of("accountIds", List.of("nikita"))));
            JsonNode afterRemoval = state(client, maria);
            assertThat(personIds(afterRemoval, "requestPeople")).containsExactly("nikita");
            assertThat(personIds(afterRemoval, "recipients")).containsExactlyInAnyOrderElementsOf(DEMO_RECIPIENTS);
            assertThat(send(client, "POST", "/money-requests", maria, request).statusCode()).isEqualTo(400);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM we_money_request", Long.class)).isEqualTo(1L);
        }
    }

    @Test
    void connectsExistingAccountsImmediatelyAndDoesNotAllowOverlappingHouseholds() throws Exception {
        String credentials = Sessions.hashPassword(DEMO_PASSWORD);
        jdbc.update("""
            INSERT INTO we_account (id, email, wise_id, display_name, password_hash, balance)
            VALUES ('new-owner', 'new-owner@example.com', 'new-owner', 'New Owner', ?, 100),
                   ('new-helper', 'new-helper@example.com', 'new-helper', 'New Helper', ?, 0),
                   ('another-owner', 'another-owner@example.com', 'another-owner', 'Another Owner', ?, 0)
            """, credentials, credentials, credentials);

        try (HttpClient client = HttpClient.newHttpClient()) {
            String owner = login(client, "new-owner", "owner");
            String helper = login(client, "new-helper", "owner");
            String another = login(client, "another-owner", "owner");
            var link = Map.of("helperWiseId", "new-helper");
            assertThat(send(client, "GET", "/state", helper, null).statusCode()).isEqualTo(403);
            assertThat(send(client, "POST", "/household/connect", owner, Map.of("helperWiseId", "new-owner"))
                .statusCode()).isEqualTo(400);
            assertThat(send(client, "POST", "/household/connect", owner, Map.of("helperWiseId", "olga"))
                .statusCode()).isEqualTo(404);
            JsonNode household = ok(send(client, "POST", "/household/connect", owner, link)).path("state");
            assertThat(household.path("ownerId").asString()).isEqualTo("new-owner");
            assertThat(personIds(household, "requestPeople")).containsExactly("new-helper");
            JsonNode helperState = state(client, helper);
            assertThat(helperState.path("account").path("role").asString()).isEqualTo("helper");
            assertThat(helperState.path("ownerId").asString()).isEqualTo("new-owner");
            assertThat(helperState.path("balance").isNull()).isTrue();

            ok(send(client, "PUT", "/settings/limit", helper, Map.of("limit", 90)));
            assertThat(ok(send(client, "POST", "/household/connect", owner, link))
                .path("state").path("limit").decimalValue()).isEqualByComparingTo("90");
            assertThat(send(client, "POST", "/household/connect", another, link).statusCode()).isEqualTo(409);
            assertThat(send(client, "POST", "/household/connect", another, Map.of("helperWiseId", "new-owner"))
                .statusCode()).isEqualTo(409);
        }
    }

    @Test
    void sendsTheHelpersOwnMoneyToTheirProtectedAccountAndDeduplicatesRetries() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            String nikita = login(client, "nikita");
            String key = UUID.randomUUID().toString();
            assertThat(sendToProtectedAccount(client, maria, 500, key).statusCode()).isEqualTo(403);

            HttpRequest payment = protectedAccountPayment(nikita, 500, key);
            var responses = concurrentResponses(client, payment, payment);
            JsonNode first = ok(responses.getFirst());
            String id = first.path("id").asString();
            assertThat(ok(responses.getLast()).path("id").asString()).isEqualTo(id);
            assertThat(first.path("state").path("accountBalance").decimalValue()).isEqualByComparingTo("4500");
            assertThat(balance("nikita")).isEqualByComparingTo("4500");

            JsonNode owner = state(client, maria);
            JsonNode received = transfer(owner, id);
            assertThat(owner.path("balance").decimalValue()).isEqualByComparingTo("4500");
            assertThat(received.path("sender").path("id").asString()).isEqualTo("nikita");
            assertThat(received.path("direction").asString()).isEqualTo("incoming");
            assertThat(received.path("status").asString()).isEqualTo("sent");
            assertThat(reasons(received, "approvalReasons")).isEmpty();
            assertThat(transferIds(owner)).hasSize(DEMO_TRANSFERS.size() + 1);

            assertThat(sendToProtectedAccount(client, nikita, 501, key).statusCode()).isEqualTo(409);
            assertThat(sendToProtectedAccount(client, nikita, 4501, UUID.randomUUID().toString()).statusCode())
                .isEqualTo(400);
            assertThat(balance("nikita")).isEqualByComparingTo("4500");
            assertThat(balance("maria")).isEqualByComparingTo("4500");
        }
    }

    @Test
    void resetsDemoBalancesAndRulesWithoutInvalidatingActiveSessions() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            String nikita = login(client, "nikita");
            ok(sendToProtectedAccount(client, nikita, 50, UUID.randomUUID().toString()));
            create(client, maria, "olga", 300, ABOVE_THRESHOLD);
            ok(send(client, "PUT", "/settings/limit", nikita, Map.of("limit", 350)));
            ok(send(client, "PUT", "/settings/rules/limit", nikita, Map.of("enabled", false)));
            ok(send(client, "PUT", "/settings/rules/checkNew", nikita, Map.of("enabled", false)));
            ok(send(client, "PUT", "/settings/request-people", nikita, Map.of("accountIds", List.of("anna"))));
            ok(send(client, "POST", "/money-requests", maria, Map.of("recipientId", "anna", "amount", 15)));

            assertThat(send(client, "POST", "/demo/reset", null, null).statusCode()).isEqualTo(401);
            JsonNode reset = ok(send(client, "POST", "/demo/reset", nikita, null)).path("state");
            assertThat(reset.path("accountBalance").decimalValue()).isEqualByComparingTo("5000");
            JsonNode owner = state(client, maria);
            assertThat(owner.path("balance").decimalValue()).isEqualByComparingTo("4000");
            assertThat(owner.path("limit").decimalValue()).isEqualByComparingTo("250");
            assertThat(owner.path("checkNew").asBoolean()).isTrue();
            assertThat(owner.path("protectionOffAt").isEmpty()).isTrue();
            assertThat(personIds(owner, "requestPeople")).containsExactly("nikita");
            assertThat(personIds(owner, "recipients")).containsExactlyInAnyOrderElementsOf(DEMO_RECIPIENTS);
            assertThat(transferIds(owner)).containsExactlyInAnyOrderElementsOf(DEMO_TRANSFERS);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM we_money_request", Long.class)).isZero();
            assertThat(transferIds(ok(send(client, "POST", "/demo/reset", maria, null)).path("state")))
                .containsExactlyElementsOf(transferIds(owner));
        }
    }

    @Test
    void refusesDemoResetWhenItWouldAffectAnOutsideAccount() throws Exception {
        jdbc.update("INSERT INTO we_account (id, wise_id, display_name) VALUES ('outside', 'outside', 'Outside')");
        try (HttpClient client = HttpClient.newHttpClient()) {
            String maria = login(client, "maria");
            String nikita = login(client, "nikita");
            ok(send(client, "PUT", "/settings/rules/checkNew", nikita, Map.of("enabled", false)));
            jdbc.update("UPDATE we_protection SET check_new_off_at = now() - interval '1 second' WHERE owner_id = 'maria'");
            String id = create(client, maria, "outside", 25, List.of());
            assertThat(send(client, "POST", "/demo/reset", nikita, null).statusCode()).isEqualTo(409);
            assertThat(transfer(state(client, maria), id).path("status").asString()).isEqualTo("sent");
            assertThat(balance("outside")).isEqualByComparingTo("25");
            assertThat(balance("maria")).isEqualByComparingTo("3975");
        }
    }

    private HttpResponse<String> sendToProtectedAccount(HttpClient client, String token, int amount, String key)
        throws Exception {
        return client.send(protectedAccountPayment(token, amount, key), HttpResponse.BodyHandlers.ofString());
    }

    private HttpRequest protectedAccountPayment(String token, int amount, String key) {
        return request("POST", "/transfers/to-protected-account", token, Map.of("amount", amount))
            .header("Idempotency-Key", key)
            .build();
    }

    private String login(HttpClient client, String account) throws Exception {
        return login(client, account, account.equals("maria") || account.equals("other-owner") ? "owner" : "helper");
    }

    private String login(HttpClient client, String account, String expectedRole) throws Exception {
        JsonNode response = ok(send(client, "POST", "/auth/login", null,
            Map.of("email", account + "@example.com", "password", DEMO_PASSWORD)));
        assertThat(response.path("account").path("role").asString()).isEqualTo(expectedRole);
        String token = response.path("token").asString();
        assertThat(token).isNotBlank();
        return token;
    }

    private JsonNode state(HttpClient client, String token) throws Exception {
        return ok(send(client, "GET", "/state", token, null));
    }

    private JsonNode preview(HttpClient client, String token, String recipient, int amount) throws Exception {
        return ok(send(client, "POST", "/transfers/preview", token, Map.of("recipientId", recipient, "amount", amount)));
    }

    private JsonNode transferResponse(HttpClient client, String token, String recipient, int amount,
        List<String> reasons, String key) throws Exception {
        return ok(client.send(transferRequest(token, recipient, amount, reasons, key), HttpResponse.BodyHandlers.ofString()));
    }

    private String create(HttpClient client, String token, String recipient, int amount, List<String> reasons)
        throws Exception {
        return transferResponse(client, token, recipient, amount, reasons, UUID.randomUUID().toString())
            .path("id").asString();
    }

    private HttpRequest transferRequest(String token, String recipient, int amount, List<String> reasons, String key) {
        return transferRequest(token, recipient, BigDecimal.valueOf(amount), reasons, key);
    }

    private HttpRequest transferRequest(String token, String recipient, BigDecimal amount, List<String> reasons,
        String key) {
        return request("POST", "/transfers", token,
            Map.of("recipientId", recipient, "amount", amount, "expectedReasons", reasons))
            .header("Idempotency-Key", key)
            .build();
    }

    private BigDecimal balance(String account) {
        return jdbc.queryForObject("SELECT balance FROM we_account WHERE id = ?", BigDecimal.class, account);
    }

    private static String decisionPath(String id) {
        return "/transfers/" + id + "/decision";
    }

    private static List<HttpResponse<String>> concurrentResponses(HttpClient client, HttpRequest first,
        HttpRequest second) throws Exception {
        var firstResponse = client.sendAsync(first, HttpResponse.BodyHandlers.ofString());
        var secondResponse = client.sendAsync(second, HttpResponse.BodyHandlers.ofString());
        return List.of(firstResponse.get(10, TimeUnit.SECONDS), secondResponse.get(10, TimeUnit.SECONDS));
    }

    private static List<String> personIds(JsonNode state, String field) {
        assertThat(state.path(field).isArray()).isTrue();
        return state.path(field).valueStream().map(person -> person.path("id").asString()).toList();
    }

    private static List<String> transferIds(JsonNode state) {
        assertThat(state.path("transfers").isArray()).isTrue();
        return state.path("transfers").valueStream().map(transfer -> transfer.path("id").asString()).toList();
    }

    private static List<String> reasons(JsonNode node, String field) {
        assertThat(node.path(field).isArray()).isTrue();
        return node.path(field).valueStream().map(JsonNode::asString).toList();
    }

    private static JsonNode transfer(JsonNode state, String id) {
        assertThat(id).isNotBlank();
        return state.path("transfers").valueStream()
            .filter(item -> item.path("id").asString().equals(id))
            .findFirst()
            .orElseThrow(() -> new AssertionError("Missing transfer " + id));
    }

    private HttpResponse<String> send(HttpClient client, String method, String path, String token, Object body)
        throws Exception {
        return client.send(request(method, path, token, body).build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpRequest.Builder request(String method, String path, String token, Object body) {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
            .uri(URI.create("http://localhost:" + port + path))
            .timeout(Duration.ofSeconds(10));
        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }
        if (body == null) {
            return builder.method(method, HttpRequest.BodyPublishers.noBody());
        }
        return builder.header("Content-Type", "application/json")
            .method(method, HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)));
    }

    private static JsonNode ok(HttpResponse<String> response) {
        assertThat(response.statusCode()).as(response.body()).isBetween(200, 299);
        return JSON.readTree(response.body());
    }

    static final class DatabaseSchema implements ApplicationContextInitializer<ConfigurableApplicationContext> {
        private static final String NAME = "wiseease_api_test_" + UUID.randomUUID().toString().replace("-", "");
        private static String url;
        private static String testUrl;
        private static String username;
        private static String password;
        private static boolean created;

        @Override
        public void initialize(ConfigurableApplicationContext context) {
            var environment = context.getEnvironment();
            url = environment.getRequiredProperty("spring.datasource.url");
            username = environment.getRequiredProperty("spring.datasource.username");
            password = environment.getRequiredProperty("spring.datasource.password");
            try {
                execute("CREATE SCHEMA " + NAME);
                created = true;
            } catch (SQLException error) {
                throw new IllegalStateException("Could not create isolated PostgreSQL schema for Wise Care tests", error);
            }
            testUrl = url.matches(".*[?&]currentSchema=[^&]*.*")
                ? url.replaceFirst("([?&]currentSchema=)[^&]*", "$1" + NAME)
                : url + (url.contains("?") ? "&" : "?") + "currentSchema=" + NAME;
            TestPropertyValues.of("spring.datasource.url=" + testUrl, "spring.flyway.default-schema=" + NAME)
                .applyTo(context);
        }

        private static void execute(String sql) throws SQLException {
            try (var connection = DriverManager.getConnection(url, username, password);
                var statement = connection.createStatement()) {
                statement.execute(sql);
            }
        }
    }
}
