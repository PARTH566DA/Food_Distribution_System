package com.example.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    @Value("${app.otp.expiry-minutes:10}")
    private int expiryMinutes;

    private final SecureRandom random = new SecureRandom();

    // Map keyed by email, value holds the OTP + expiry
    private final ConcurrentHashMap<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    public String generateAndStore(String email) {
        String otp = String.format("%06d", random.nextInt(1_000_000));
        otpStore.put(email.toLowerCase(), new OtpEntry(otp, LocalDateTime.now().plusMinutes(expiryMinutes)));
        return otp;
    }

    public boolean verify(String email, String otp) {
        OtpEntry entry = otpStore.get(email.toLowerCase());
        if (entry == null) return false;
        if (LocalDateTime.now().isAfter(entry.expiry())) {
            otpStore.remove(email.toLowerCase());
            return false;
        }
        if (!entry.otp().equals(otp)) return false;
        otpStore.remove(email.toLowerCase());
        return true;
    }

    public boolean hasPendingOtp(String email) {
        OtpEntry entry = otpStore.get(email.toLowerCase());
        return entry != null && LocalDateTime.now().isBefore(entry.expiry());
    }

    private record OtpEntry(String otp, LocalDateTime expiry) {}
}
