package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.service.AuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Slf4j
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }


    @PostMapping("/signup/send-otp")
    public ResponseEntity<ApiResponse<String>> signUpSendOtp(@RequestBody SignUpRequest request) {
        log.info("API sign-up send OTP email={} role={}", maskEmail(request.getEmailId()), request.getRole());
        authService.initiateSignUp(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "OTP sent to " + request.getEmailId(), null));
    }

    @PostMapping("/signup/verify")
    public ResponseEntity<ApiResponse<AuthResponse>> signUpVerify(@RequestBody VerifyOtpRequest request) {
        log.info("API sign-up verify requested email={}", maskEmail(request.getEmailId()));
        AuthResponse user = authService.verifySignUp(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Account created successfully.", user));
    }


    @PostMapping("/login/send-otp")
    public ResponseEntity<ApiResponse<String>> loginSendOtp(@RequestBody LoginRequest request) {
        log.info("API login send OTP email={}", maskEmail(request.getEmailId()));
        authService.initiateLogin(request.getEmailId());
        return ResponseEntity.ok(new ApiResponse<>(true, "OTP sent to " + request.getEmailId(), null));
    }

    @PostMapping("/login/verify")
    public ResponseEntity<ApiResponse<AuthResponse>> loginVerify(@RequestBody VerifyOtpRequest request) {
        log.info("API login verify requested email={}", maskEmail(request.getEmailId()));
        AuthResponse user = authService.verifyLogin(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful.", user));
    }

    @PatchMapping("/profile")
    public ResponseEntity<ApiResponse<AuthResponse>> updateProfile(
            @RequestBody UpdateProfileRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        log.info("API profile update requested email={}", maskEmail(email));
        AuthResponse updated = authService.updateProfile(email, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile updated successfully.", updated));
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
}
