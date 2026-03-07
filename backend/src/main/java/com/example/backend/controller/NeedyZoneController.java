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
@CrossOrigin(origins = "*")
public class NeedyZoneController {

    private final NeedyZoneService needyZoneService;

    /**
     * GET /api/zones
     * Returns all needy zones (with report counts) for the map.
     */
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

    /**
     * POST /api/zones
     * Create a new needy zone. Requires authentication.
     * Returns 409 CONFLICT (with existingZoneId in data) if a nearby zone exists.
     * Body: { name, latitude, longitude, tagReason? }
     */
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
            // Return 409 so the frontend can surface the nearby zone
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(ApiResponse.<NeedyZoneDTO>builder()
                            .success(false)
                            .message(e.getMessage())
                            // Pass existingZoneId via a wrapper DTO with only the id set
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

    /**
     * POST /api/zones/{id}/report
     * Submit a report/flag for the given zone. Requires authentication.
     * A user can only report a zone once.
     * Body: { reason? }
     * Returns the updated report count.
     */
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
