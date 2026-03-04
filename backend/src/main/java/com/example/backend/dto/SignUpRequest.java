package com.example.backend.dto;

import com.example.backend.model.Enums.Role;
import lombok.Data;

@Data
public class SignUpRequest {
    private String userName;
    private String mobileNumber;
    private String emailId;
    private Role role;
}
