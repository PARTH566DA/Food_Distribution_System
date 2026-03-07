package com.example.backend.dto;

import lombok.Data;

@Data
public class ZoneReportRequest {
    /** Optional reason for the report (free text, max 120 chars). */
    private String reason;
}
