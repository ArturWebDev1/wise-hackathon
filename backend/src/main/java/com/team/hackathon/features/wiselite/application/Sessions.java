package com.team.hackathon.features.wiselite.application;

import com.team.hackathon.features.wiselite.infrastructure.entity.AccountEntity;
import com.team.hackathon.features.wiselite.infrastructure.entity.SessionEntity;
import com.team.hackathon.features.wiselite.infrastructure.repository.AccountRepository;
import com.team.hackathon.features.wiselite.infrastructure.repository.SessionRepository;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class Sessions {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int ITERATIONS = 600_000;
    private static final HexFormat HEX = HexFormat.of();
    private static final Duration SESSION_LIFETIME = Duration.ofHours(12);
    private final AccountRepository accounts;
    private final SessionRepository sessions;

    public Sessions(AccountRepository accounts, SessionRepository sessions) {
        this.accounts = accounts;
        this.sessions = sessions;
    }

    @Transactional
    public Login login(String email, String password) {
        if (email == null || email.isBlank() || email.length() > 254 || password == null
                || password.isEmpty() || password.length() > 128) {
            throw invalidLogin();
        }
        AccountEntity account = accounts.findByEmailAndPasswordHashIsNotNull(
                email.strip().toLowerCase(Locale.ROOT)).orElse(null);
        String passwordHash = account == null ? null : account.passwordHash();
        // Apply the same password derivation work for unknown email addresses.
        byte[] salt = passwordHash == null ? new byte[16] : HEX.parseHex(passwordHash.substring(0, 32));
        byte[] derived = derive(password, salt);
        if (passwordHash == null || !MessageDigest.isEqual(derived, HEX.parseHex(passwordHash.substring(33)))) {
            throw invalidLogin();
        }

        byte[] random = new byte[32];
        RANDOM.nextBytes(random);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(random);
        Instant now = Instant.now();
        sessions.deleteExpired(now);
        sessions.save(new SessionEntity(tokenHash(token), account.id(), now.plus(SESSION_LIFETIME)));
        return new Login(token, account.id());
    }

    public String authenticate(String authorization) {
        return sessions.findByTokenHashAndExpiresAtAfter(tokenHash(bearer(authorization)), Instant.now())
                .map(SessionEntity::accountId).orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Sign in to continue."));
    }

    public void logout(String authorization) {
        sessions.deleteById(tokenHash(bearer(authorization)));
    }

    public static String hashPassword(String password) {
        byte[] salt = new byte[16];
        RANDOM.nextBytes(salt);
        return HEX.formatHex(salt) + ":" + HEX.formatHex(derive(password, salt));
    }

    private static String bearer(String authorization) {
        if (authorization == null || !authorization.matches("(?i)Bearer [A-Za-z0-9_-]{43}")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to continue.");
        }
        return authorization.substring(7);
    }

    private static byte[] derive(String password, byte[] salt) {
        var spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, 256);
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Could not derive the password hash", e);
        } finally {
            spec.clearPassword();
        }
    }

    private static String tokenHash(String token) {
        try {
            return HEX.formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Could not hash the session token", e);
        }
    }

    private static ResponseStatusException invalidLogin() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Check your email and password.");
    }

    public record Login(String token, String accountId) {}
}
