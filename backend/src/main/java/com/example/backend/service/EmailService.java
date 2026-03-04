package com.example.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtp(String toEmail, String otp, String purpose) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Your OTP for Food Distribution System – " + purpose);
        message.setText(
            "Hello,\n\n" +
            "Your one-time password (OTP) for " + purpose + " is:\n\n" +
            "  " + otp + "\n\n" +
            "This OTP is valid for 10 minutes. Do not share it with anyone.\n\n" +
            "If you did not request this, please ignore this email.\n\n" +
            "– Food Distribution System"
        );
        mailSender.send(message);
    }
}
