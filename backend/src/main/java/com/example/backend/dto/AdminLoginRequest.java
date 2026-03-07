package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminLoginRequest {

    /** The admin ID configured in application.properties (admin.id) */
    private String adminId;

    /** The admin password configured in application.properties (admin.password) */
    private String password;
}
