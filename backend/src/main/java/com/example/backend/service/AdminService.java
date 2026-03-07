package com.example.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    @Value("${admin.id}")
    private String configuredAdminId;

    @Value("${admin.password}")
    private String configuredAdminPassword;

    private final JwtService jwtService;

    /**
     * Validates the supplied admin credentials against values in application.properties.
     * Returns a signed JWT with role ADMIN on success, or throws on failure.
     */
    public String login(String adminId, String password) {
        if (!configuredAdminId.equals(adminId) || !configuredAdminPassword.equals(password)) {
            throw new RuntimeException("Invalid admin credentials.");
        }
        // Use a synthetic userId of -1 to distinguish admin from regular users
        return jwtService.generateToken(-1L, "admin@system", "ADMIN");
    }
}
