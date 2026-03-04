package com.example.backend.dto;

import lombok.Data;

@Data
public class VerifyOtpRequest {
    private String emailId;
    private String otp;
}
