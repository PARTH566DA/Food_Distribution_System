package com.example.backend.dto;

import com.example.backend.model.Enums.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private Long userId;
    private String userName;
    private String emailId;
    private String mobileNumber;
    private Role role;
}
