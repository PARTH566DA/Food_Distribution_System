package com.example.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class OtpService {

    @Value("${app.otp.expiry-minutes:10}")
    private int expiryMinutes;

    private final SecureRandom random = new SecureRandom();

    private final ConcurrentHashMap<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    public String generateAndStore(String email) {
        String otp = String.format("%06d", random.nextInt(1_000_000));
        String normalizedEmail = email.toLowerCase();
        otpStore.put(normalizedEmail, new OtpEntry(otp, LocalDateTime.now().plusMinutes(expiryMinutes)));
        log.info("OTP generated for email={} expiresInMinutes={}", maskEmail(normalizedEmail), expiryMinutes);
        return otp;
    }

    public boolean verify(String email, String otp) {
        String normalizedEmail = email.toLowerCase();
        OtpEntry entry = otpStore.get(normalizedEmail);
        if (entry == null) {
            log.warn("OTP verification failed: no pending OTP for email={}", maskEmail(normalizedEmail));
            return false;
        }
        if (LocalDateTime.now().isAfter(entry.expiry())) {
            otpStore.remove(normalizedEmail);
            log.warn("OTP verification failed: OTP expired for email={}", maskEmail(normalizedEmail));
            return false;
        }
        if (!entry.otp().equals(otp)) {
            log.warn("OTP verification failed: OTP mismatch for email={}", maskEmail(normalizedEmail));
            return false;
        }
        otpStore.remove(normalizedEmail);
        log.info("OTP verification successful for email={}", maskEmail(normalizedEmail));
        return true;
    }

    public boolean hasPendingOtp(String email) {
        OtpEntry entry = otpStore.get(email.toLowerCase());
        return entry != null && LocalDateTime.now().isBefore(entry.expiry());
    }

    private String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return "unknown";
        }
        int atIndex = email.indexOf('@');
        if (atIndex <= 1) {
            return "***";
        }
        return email.charAt(0) + "***" + email.substring(atIndex);
    }

    private record OtpEntry(String otp, LocalDateTime expiry) {}
}
