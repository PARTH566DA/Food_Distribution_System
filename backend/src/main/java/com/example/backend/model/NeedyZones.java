package com.example.backend.model;

import com.example.backend.model.Enums.NeedyZoneStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @OneToMany(mappedBy = "needyZone", fetch = FetchType.LAZY)
    private List<ZoneTag> zoneTags;

    @OneToMany(mappedBy = "targetZone", fetch = FetchType.LAZY)
    private List<FoodListing> targetedListings;

    @OneToMany(mappedBy = "zone", fetch = FetchType.LAZY)
    private List<ZoneReport> reports;
}
