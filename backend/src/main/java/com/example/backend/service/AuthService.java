package com.example.backend.service;

import com.example.backend.dto.AuthResponse;
import com.example.backend.dto.SignUpRequest;
import com.example.backend.dto.UpdateProfileRequest;
import com.example.backend.dto.VerifyOtpRequest;
import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final EmailService emailService;
    private final JwtService jwtService;

    private final ConcurrentHashMap<String, SignUpRequest> pendingSignups = new ConcurrentHashMap<>();

    public AuthService(UserRepository userRepository, OtpService otpService, EmailService emailService, JwtService jwtService) {
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.emailService = emailService;
        this.jwtService = jwtService;
    }


    public void initiateSignUp(SignUpRequest request) {
        String email = request.getEmailId().toLowerCase().trim();
        log.info("Sign-up OTP requested for email={} role={}", maskEmail(email), request.getRole());

        if (userRepository.findByEmailId(email).isPresent()) {
            log.warn("Sign-up blocked: email already registered email={}", maskEmail(email));
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered.");
        }
        if (userRepository.findByMobileNumber(request.getMobileNumber()).isPresent()) {
            log.warn("Sign-up blocked: mobile already registered email={}", maskEmail(email));
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mobile number is already registered.");
        }

        request.setEmailId(email);
        pendingSignups.put(email, request);

        String otp = otpService.generateAndStore(email);
        emailService.sendOtp(email, otp, "Sign Up");
        log.info("Sign-up OTP sent for email={} pendingSignups={}", maskEmail(email), pendingSignups.size());
    }

    public AuthResponse verifySignUp(VerifyOtpRequest request) {
        String email = request.getEmailId().toLowerCase().trim();
        log.info("Sign-up OTP verification requested for email={}", maskEmail(email));

        if (!otpService.verify(email, request.getOtp())) {
            log.warn("Sign-up OTP verification failed for email={}", maskEmail(email));
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP.");
        }

        SignUpRequest pending = pendingSignups.remove(email);
        if (pending == null) {
            log.warn("Sign-up verification failed: no pending signup email={}", maskEmail(email));
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No pending sign-up found for this email.");
        }

        User user = new User();
        user.setUserName(pending.getUserName());
        user.setMobileNumber(pending.getMobileNumber());
        user.setEmailId(email);
        user.setRole(pending.getRole());
        user.setActive(true);

        User saved = userRepository.save(user);
        log.info("Sign-up completed userId={} email={} role={}", saved.getUserId(), maskEmail(saved.getEmailId()), saved.getRole());
        return toResponse(saved);
    }


    public void initiateLogin(String email) {
        String normalised = email.toLowerCase().trim();
        log.info("Login OTP requested for email={}", maskEmail(normalised));
        userRepository.findByEmailId(normalised)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account found with this email."));

        String otp = otpService.generateAndStore(normalised);
        emailService.sendOtp(normalised, otp, "Login");
        log.info("Login OTP sent for email={}", maskEmail(normalised));
    }

    public AuthResponse verifyLogin(VerifyOtpRequest request) {
        String email = request.getEmailId().toLowerCase().trim();
        log.info("Login OTP verification requested for email={}", maskEmail(email));

        if (!otpService.verify(email, request.getOtp())) {
            log.warn("Login OTP verification failed for email={}", maskEmail(email));
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP.");
        }

        User user = userRepository.findByEmailId(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        log.info("Login successful userId={} email={} role={}", user.getUserId(), maskEmail(user.getEmailId()), user.getRole());
        return toResponse(user);
    }

    public AuthResponse updateProfile(String email, UpdateProfileRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile payload is required.");
        }

        String normalizedEmail = email.toLowerCase().trim();
        log.info("Profile update requested for email={}", maskEmail(normalizedEmail));
        User user = userRepository.findByEmailId(normalizedEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        String nextName = request.getUserName() == null ? "" : request.getUserName().trim();
        if (nextName.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name must be at least 2 characters.");
        }

        String rawMobile = request.getMobileNumber() == null ? "" : request.getMobileNumber();
        String nextMobile = rawMobile.replaceAll("\\D", "");
        if (nextMobile.length() < 10 || nextMobile.length() > 15) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mobile number should be between 10 and 15 digits.");
        }

        if (!nextMobile.equals(user.getMobileNumber())) {
            userRepository.findByMobileNumber(nextMobile).ifPresent(existing -> {
                if (!existing.getUserId().equals(user.getUserId())) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Mobile number is already registered.");
                }
            });
        }

        user.setUserName(nextName);
        user.setMobileNumber(nextMobile);

        User saved = userRepository.save(user);
        log.info("Profile updated userId={} email={}", saved.getUserId(), maskEmail(saved.getEmailId()));
        return toResponse(saved);
    }


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
