package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateNeedyZoneRequest {

    private String name;
    private Double latitude;
    private Double longitude;
    // Optional: initial tag reason (SLUM, LABOUR_CAMP, NIGHT_SHELTER)
    private String tagReason;
}
