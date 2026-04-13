package com.example.backend.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String userName;
    private String mobileNumber;
}
