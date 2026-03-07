package com.example.backend.service;

import com.example.backend.dto.CreateNeedyZoneRequest;
import com.example.backend.dto.NeedyZoneDTO;
import com.example.backend.model.NeedyZones;
import com.example.backend.model.User;
import com.example.backend.model.ZoneReport;
import com.example.backend.model.ZoneTag;
import com.example.backend.model.Enums.NeedyZoneStatus;
import com.example.backend.model.Enums.TagReason;
import com.example.backend.repository.NeedyZonesRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.ZoneReportRepository;
import com.example.backend.repository.ZoneTagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NeedyZoneService {

    /** Zones within this many metres are considered duplicate submissions. */
    private static final double DUPLICATE_RADIUS_METRES = 50.0;

    private final NeedyZonesRepository needyZonesRepository;
    private final UserRepository userRepository;
    private final ZoneTagRepository zoneTagRepository;
    private final ZoneReportRepository zoneReportRepository;

    // ── Queries ───────────────────────────────────────────────────────────────

    /**
     * Returns all zones enriched with their current report counts.
     */
    @Transactional(readOnly = true)
    public List<NeedyZoneDTO> getAllZonesWithReports() {
        return needyZonesRepository.findAll().stream()
                .map(z -> NeedyZoneDTO.fromEntity(z, zoneReportRepository.countByZone(z)))
                .collect(Collectors.toList());
    }

    /**
     * Get raw entity list (used internally / admin).
     */
    @Transactional(readOnly = true)
    public List<NeedyZones> getAllZones() {
        return needyZonesRepository.findAll();
    }

    /**
     * Get only ACTIVE needy zones.
     */
    @Transactional(readOnly = true)
    public List<NeedyZones> getActiveZones() {
        return needyZonesRepository.findByStatus(NeedyZoneStatus.ACTIVE);
    }

    // ── Mutations ─────────────────────────────────────────────────────────────

    /**
     * Create a new needy zone.  Rejects the request if a non-INACTIVE zone
     * already exists within {@value #DUPLICATE_RADIUS_METRES} metres.
     * Zone starts with PENDING status.
     */
    @Transactional
    public NeedyZones createZone(CreateNeedyZoneRequest request, String creatorEmail) {
        User creator = userRepository.findByEmailId(creatorEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + creatorEmail));

        // ── Proximity / duplicate check ──────────────────────────────────────
        List<NeedyZones> existing = needyZonesRepository.findAll();
        for (NeedyZones z : existing) {
            if (z.getStatus() == NeedyZoneStatus.INACTIVE) continue;
            double dist = haversineMetres(
                    request.getLatitude(), request.getLongitude(),
                    z.getLatitude(), z.getLongitude());
            if (dist <= DUPLICATE_RADIUS_METRES) {
                throw new DuplicateZoneException(
                        "A needy zone already exists nearby: \"" + z.getName() + "\" ("
                        + String.format("%.0f", dist) + " m away). "
                        + "Please report that zone instead.", z.getNeedyZoneId());
            }
        }

        NeedyZones zone = new NeedyZones();
        zone.setName(request.getName());
        zone.setLatitude(request.getLatitude());
        zone.setLongitude(request.getLongitude());
        zone.setStatus(NeedyZoneStatus.PENDING);
        zone.setCreatedBy(creator);

        NeedyZones savedZone = needyZonesRepository.save(zone);

        // Optionally create a tag entry if tagReason is provided
        if (request.getTagReason() != null && !request.getTagReason().isBlank()) {
            try {
                TagReason reason = TagReason.valueOf(request.getTagReason().toUpperCase());
                ZoneTag tag = new ZoneTag();
                tag.setNeedyZone(savedZone);
                tag.setTaggedBy(creator);
                tag.setReason(reason);
                zoneTagRepository.save(tag);
            } catch (IllegalArgumentException e) {
                log.warn("Unknown TagReason '{}' — skipping tag creation.", request.getTagReason());
            }
        }

        return savedZone;
    }

    /**
     * Update the status of a needy zone (admin action: ACTIVE, INACTIVE, PENDING).
     */
    @Transactional
    public NeedyZones updateZoneStatus(Long zoneId, String newStatus) {
        NeedyZones zone = needyZonesRepository.findById(zoneId)
                .orElseThrow(() -> new RuntimeException("Zone not found: " + zoneId));
        NeedyZoneStatus status = NeedyZoneStatus.valueOf(newStatus.toUpperCase());
        zone.setStatus(status);
        return needyZonesRepository.save(zone);
    }

    /**
     * Record a user's report against a zone.
     * Throws if the user has already reported this zone.
     * Returns the updated report count.
     */
    @Transactional
    public long reportZone(Long zoneId, String userEmail, String reason) {
        NeedyZones zone = needyZonesRepository.findById(zoneId)
                .orElseThrow(() -> new RuntimeException("Zone not found: " + zoneId));
        User reporter = userRepository.findByEmailId(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        if (zoneReportRepository.existsByZoneAndReportedBy(zone, reporter)) {
            throw new RuntimeException("You have already reported this zone.");
        }

        ZoneReport report = new ZoneReport();
        report.setZone(zone);
        report.setReportedBy(reporter);
        report.setReason(reason);
        zoneReportRepository.save(report);

        return zoneReportRepository.countByZone(zone);
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /**
     * Haversine formula: returns the great-circle distance in metres
     * between two WGS-84 coordinates.
     */
    private static double haversineMetres(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6_371_000.0; // earth radius in metres
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // ── Custom exception (carries nearby zone ID for the client) ──────────────

    public static class DuplicateZoneException extends RuntimeException {
        private final Long existingZoneId;
        public DuplicateZoneException(String message, Long existingZoneId) {
            super(message);
            this.existingZoneId = existingZoneId;
        }
        public Long getExistingZoneId() { return existingZoneId; }
    }
}
