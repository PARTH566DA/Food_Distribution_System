package com.example.backend.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.Map;

@Service
@Slf4j
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    private volatile SecretKey signingKey;


    public String generateToken(Long userId, String email, String role) {
        return Jwts.builder()
                .subject(email)
                .claims(Map.of(
                        "userId", userId,
                        "role",   role
                ))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }


    public boolean isValid(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String extractEmail(String token) {
        return getClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    public Long extractUserId(String token) {
        Object raw = getClaims(token).get("userId");
        if (raw instanceof Long l) return l;
        if (raw instanceof Integer i) return i.longValue();
        return Long.parseLong(raw.toString());
    }


    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        if (signingKey != null) {
            return signingKey;
        }

        synchronized (this) {
            if (signingKey != null) {
                return signingKey;
            }

            byte[] configuredBytes = decodeConfiguredSecret(secret);
            if (configuredBytes.length < 32) {
                log.warn("JWT secret is shorter than 256 bits. Deriving a secure HS256 key from configured secret.");
                configuredBytes = sha256(configuredBytes);
            }

            signingKey = Keys.hmacShaKeyFor(configuredBytes);
            return signingKey;
        }
    }

    private byte[] decodeConfiguredSecret(String configuredSecret) {
        String value = configuredSecret == null ? "" : configuredSecret.trim();
        if (value.isEmpty()) {
            throw new IllegalStateException("JWT secret is not configured. Set JWT_SECRET environment variable.");
        }

        try {
            return Decoders.BASE64.decode(value);
        } catch (IllegalArgumentException ignored) {
            return value.getBytes(StandardCharsets.UTF_8);
        }
    }

    private byte[] sha256(byte[] input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return digest.digest(input);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
