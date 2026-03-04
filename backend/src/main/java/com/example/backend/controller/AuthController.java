package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ── SIGN UP ──────────────────────────────────────────────────────────────

    /**
     * Step 1 – validate details and send OTP to email.
     * Body: { userName, mobileNumber, emailId, role }
     */
    @PostMapping("/signup/send-otp")
    public ResponseEntity<ApiResponse<String>> signUpSendOtp(@RequestBody SignUpRequest request) {
        authService.initiateSignUp(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "OTP sent to " + request.getEmailId(), null));
    }

    /**
     * Step 2 – verify OTP and create the account.
     * Body: { emailId, otp }
     */
    @PostMapping("/signup/verify")
    public ResponseEntity<ApiResponse<AuthResponse>> signUpVerify(@RequestBody VerifyOtpRequest request) {
        AuthResponse user = authService.verifySignUp(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Account created successfully.", user));
    }

    // ── LOGIN ────────────────────────────────────────────────────────────────

    /**
     * Step 1 – check email exists and send OTP.
     * Body: { emailId }
     */
    @PostMapping("/login/send-otp")
    public ResponseEntity<ApiResponse<String>> loginSendOtp(@RequestBody LoginRequest request) {
        authService.initiateLogin(request.getEmailId());
        return ResponseEntity.ok(new ApiResponse<>(true, "OTP sent to " + request.getEmailId(), null));
    }

    /**
     * Step 2 – verify OTP and return user details.
     * Body: { emailId, otp }
     */
    @PostMapping("/login/verify")
    public ResponseEntity<ApiResponse<AuthResponse>> loginVerify(@RequestBody VerifyOtpRequest request) {
        AuthResponse user = authService.verifyLogin(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful.", user));
    }
}
