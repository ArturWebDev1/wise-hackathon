package com.team.hackathon.features.wiselite.api;

import com.team.hackathon.features.wiselite.application.Households;
import com.team.hackathon.features.wiselite.application.Sessions;
import com.team.hackathon.features.wiselite.application.Transfers;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@RestController
@CrossOrigin(originPatterns = "${wiseease.cors.origin-pattern:http://*:8081}")
class WiseEaseController {
    private final Sessions sessions;
    private final Households households;
    private final Transfers transfers;

    WiseEaseController(Sessions sessions, Households households, Transfers transfers) {
        this.sessions = sessions;
        this.households = households;
        this.transfers = transfers;
    }

    @PostMapping("/auth/login")
    ResponseEntity<LoginResult> login(@RequestBody LoginRequest request) {
        var login = sessions.login(request.email(), request.password());
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(new LoginResult(login.token(), households.account(login.accountId())));
    }

    @PostMapping("/auth/logout")
    ResponseEntity<Void> logout(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        sessions.logout(authorization);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/state")
    ResponseEntity<Households.State> state(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(households.state(sessions.authenticate(authorization)));
    }

    @GetMapping("/recipients/lookup")
    Households.Person lookup(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestParam(required = false) String wiseId) {
        return households.lookup(sessions.authenticate(authorization), wiseId);
    }

    @PostMapping("/transfers/preview")
    Map<String, List<String>> preview(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody Payment payment) {
        return Map.of("reasons", transfers.preview(sessions.authenticate(authorization),
                payment.recipientId(), payment.amount()));
    }

    @PostMapping("/transfers")
    Map<String, Object> send(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestHeader(value = "Idempotency-Key", required = false) String key, @RequestBody Payment payment) {
        String actor = sessions.authenticate(authorization);
        UUID id = transfers.create(actor, payment.recipientId(), payment.amount(), key, payment.expectedReasons());
        return Map.of("id", id, "state", households.state(actor));
    }

    @PostMapping("/transfers/{id}/decision")
    Map<String, Households.State> decide(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable UUID id, @RequestBody Decision decision) {
        String actor = sessions.authenticate(authorization);
        transfers.decide(actor, id, decision.approve());
        return updatedState(actor);
    }

    @PutMapping("/settings/limit")
    Map<String, Households.State> threshold(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody Threshold threshold) {
        String actor = sessions.authenticate(authorization);
        households.threshold(actor, threshold.limit());
        return updatedState(actor);
    }

    @PutMapping("/settings/rules/checkNew")
    Map<String, Households.State> checkNew(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody Rule rule) {
        String actor = sessions.authenticate(authorization);
        households.checkNew(actor, rule.enabled());
        return updatedState(actor);
    }

    @PutMapping("/settings/request-people")
    Map<String, Households.State> requestPeople(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody RequestPeople people) {
        String actor = sessions.authenticate(authorization);
        households.requestPeople(actor, people.accountIds());
        return updatedState(actor);
    }

    @PostMapping("/money-requests")
    Map<String, Object> requestMoney(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody Payment payment) {
        String actor = sessions.authenticate(authorization);
        UUID id = households.requestMoney(actor, payment.recipientId(), payment.amount());
        return Map.of("id", id, "state", households.state(actor));
    }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<Map<String, String>> error(ResponseStatusException failure) {
        return ResponseEntity.status(failure.getStatusCode()).body(Map.of("error", failure.getReason()));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<Map<String, String>> badRequest() {
        return ResponseEntity.badRequest().body(Map.of("error", "Check the request and try again."));
    }

    private Map<String, Households.State> updatedState(String actor) {
        return Map.of("state", households.state(actor));
    }

    record LoginRequest(String email, String password) {}

    record LoginResult(String token, Households.Account account) {}

    record Payment(String recipientId, BigDecimal amount, List<String> expectedReasons) {}

    record Decision(Boolean approve) {}

    record Threshold(BigDecimal limit) {}

    record Rule(Boolean enabled) {}

    record RequestPeople(List<String> accountIds) {}
}
