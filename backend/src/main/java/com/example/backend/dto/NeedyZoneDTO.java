package com.example.backend.dto;

import com.example.backend.model.NeedyZones;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NeedyZoneDTO {

    private Long needyZoneId;
    private String name;
    private Double latitude;
    private Double longitude;
    private String status;
    private LocalDateTime createdAt;
    private String createdByName;
    private long reportCount;

    public static NeedyZoneDTO fromEntity(NeedyZones zone) {
        return fromEntity(zone, 0L);
    }

    public static NeedyZoneDTO fromEntity(NeedyZones zone, long reportCount) {
        return NeedyZoneDTO.builder()
                .needyZoneId(zone.getNeedyZoneId())
                .name(zone.getName())
                .latitude(zone.getLatitude())
                .longitude(zone.getLongitude())
                .status(zone.getStatus() != null ? zone.getStatus().name() : null)
                .createdAt(zone.getCreatedAt())
                .createdByName(zone.getCreatedBy() != null ? zone.getCreatedBy().getUserName() : "Unknown")
                .reportCount(reportCount)
                .build();
    }
}
