package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Records a single user's flag/report against a needy zone.
 * Unique per (zone, reportedBy) so a user can only report a given zone once.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
    name = "zone_report",
    uniqueConstraints = @UniqueConstraint(columnNames = {"zone_id", "reported_by_user_id"})
)
public class ZoneReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long reportId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", nullable = false)
    private NeedyZones zone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by_user_id", nullable = false)
    private User reportedBy;

    /** Free-text reason supplied by the user (optional). */
    @Column(name = "reason", length = 120)
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
