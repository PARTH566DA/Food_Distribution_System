package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class NeedyZones {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "needy_zone_id")
    private Long needyZoneId;

    @Column(name = "needy_zone_name", nullable = false)
    private String name;

    @Column(name = "needy_zone_latitude", nullable = false)
    private Double latitude;
    @Column(name = "needy_zone_longitude", nullable = false)
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "needy_zone_status", nullable = false)
    private NeedyZoneStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
