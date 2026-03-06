package com.example.backend.service;

import com.example.backend.dto.AuthResponse;
import com.example.backend.dto.SignUpRequest;
import com.example.backend.dto.VerifyOtpRequest;
import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final EmailService emailService;
    private final JwtService jwtService;

    // Temporarily stores signup data awaiting OTP verification
    private final ConcurrentHashMap<String, SignUpRequest> pendingSignups = new ConcurrentHashMap<>();

    public AuthService(UserRepository userRepository, OtpService otpService, EmailService emailService, JwtService jwtService) {
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.emailService = emailService;
        this.jwtService = jwtService;
    }

    // ── SIGN UP ──────────────────────────────────────────────────────────────

    public void initiateSignUp(SignUpRequest request) {
        String email = request.getEmailId().toLowerCase().trim();

        if (userRepository.findByEmailId(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered.");
        }
        if (userRepository.findByMobileNumber(request.getMobileNumber()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mobile number is already registered.");
        }

        request.setEmailId(email);
        pendingSignups.put(email, request);

        String otp = otpService.generateAndStore(email);
        emailService.sendOtp(email, otp, "Sign Up");
    }

    public AuthResponse verifySignUp(VerifyOtpRequest request) {
        String email = request.getEmailId().toLowerCase().trim();

        if (!otpService.verify(email, request.getOtp())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP.");
        }

        SignUpRequest pending = pendingSignups.remove(email);
        if (pending == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No pending sign-up found for this email.");
        }

        User user = new User();
        user.setUserName(pending.getUserName());
        user.setMobileNumber(pending.getMobileNumber());
        user.setEmailId(email);
        user.setRole(pending.getRole());
        user.setActive(true);

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    // ── LOGIN ────────────────────────────────────────────────────────────────

    public void initiateLogin(String email) {
        String normalised = email.toLowerCase().trim();
        userRepository.findByEmailId(normalised)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account found with this email."));

        String otp = otpService.generateAndStore(normalised);
        emailService.sendOtp(normalised, otp, "Login");
    }

    public AuthResponse verifyLogin(VerifyOtpRequest request) {
        String email = request.getEmailId().toLowerCase().trim();

        if (!otpService.verify(email, request.getOtp())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP.");
        }

        User user = userRepository.findByEmailId(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        return toResponse(user);
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private AuthResponse toResponse(User user) {
        String token = jwtService.generateToken(
            user.getUserId(),
            user.getEmailId(),
            user.getRole().name()
        );
        return new AuthResponse(
            user.getUserId(),
            user.getUserName(),
            user.getEmailId(),
            user.getMobileNumber(),
            user.getRole(),
            token
        );
    }
}
