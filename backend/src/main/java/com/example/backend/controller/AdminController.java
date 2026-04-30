package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.model.NeedyZones;
import com.example.backend.service.AdminService;
import com.example.backend.service.NeedyZoneService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final NeedyZoneService needyZoneService;


    @PostMapping("/login")
    public ResponseEntity<ApiResponse<String>> adminLogin(@RequestBody AdminLoginRequest request) {
        try {
            String token = adminService.login(request.getAdminId(), request.getPassword());
            return ResponseEntity.ok(ApiResponse.success("Admin login successful.", token));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }


    @GetMapping("/zones")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<NeedyZoneDTO>>> getAllZones() {
        try {
            return ResponseEntity.ok(ApiResponse.success(needyZoneService.getAllZonesWithReports()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch zones: " + e.getMessage()));
        }
    }

    @PatchMapping("/zones/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<NeedyZoneDTO>> updateZoneStatus(
            @PathVariable Long id,
            @RequestBody UpdateZoneStatusRequest request
    ) {
        try {
            NeedyZones updated = needyZoneService.updateZoneStatus(id, request.getStatus());
            return ResponseEntity.ok(ApiResponse.success("Zone status updated.", NeedyZoneDTO.fromEntity(updated)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Invalid status value: " + request.getStatus()));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
