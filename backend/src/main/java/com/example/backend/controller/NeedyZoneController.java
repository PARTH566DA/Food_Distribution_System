package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.CreateNeedyZoneRequest;
import com.example.backend.dto.NeedyZoneDTO;
import com.example.backend.dto.ZoneReportRequest;
import com.example.backend.model.NeedyZones;
import com.example.backend.service.NeedyZoneService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/zones")
@RequiredArgsConstructor
public class NeedyZoneController {

    private final NeedyZoneService needyZoneService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NeedyZoneDTO>>> getAllZones() {
        try {
            return ResponseEntity.ok(ApiResponse.success(needyZoneService.getAllZonesWithReports()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch zones: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<NeedyZoneDTO>> createZone(
            @RequestBody CreateNeedyZoneRequest request,
            Authentication authentication
    ) {
        try {
            String email = authentication.getName();
            NeedyZones created = needyZoneService.createZone(request, email);
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Needy zone submitted for review.", NeedyZoneDTO.fromEntity(created)));
        } catch (NeedyZoneService.DuplicateZoneException e) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(ApiResponse.<NeedyZoneDTO>builder()
                            .success(false)
                            .message(e.getMessage())
                            .data(NeedyZoneDTO.builder().needyZoneId(e.getExistingZoneId()).build())
                            .build());
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create zone: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<ApiResponse<Long>> reportZone(
            @PathVariable Long id,
            @RequestBody(required = false) ZoneReportRequest body,
            Authentication authentication
    ) {
        try {
            String email = authentication.getName();
            String reason = (body != null) ? body.getReason() : null;
            long count = needyZoneService.reportZone(id, email, reason);
            return ResponseEntity.ok(ApiResponse.success("Report submitted.", count));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
