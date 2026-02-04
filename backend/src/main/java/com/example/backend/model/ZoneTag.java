package com.example.backend.model;

import com.example.backend.model.Enums.TagReason;
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
public class ZoneTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "zone_tag_id")
    private Long tagId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tag_reason", nullable = false)
    private TagReason reason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "needy_zone_id", nullable = false)
    private NeedyZones needyZone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tagged_by_user_id", nullable = false)
    private User taggedBy;
}
