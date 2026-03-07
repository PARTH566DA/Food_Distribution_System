package com.example.backend.repository;

import com.example.backend.model.NeedyZones;
import com.example.backend.model.User;
import com.example.backend.model.ZoneReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ZoneReportRepository extends JpaRepository<ZoneReport, Long> {

    /** Count how many users have reported this zone. */
    long countByZone(NeedyZones zone);

    /** Check if a specific user already reported this zone. */
    boolean existsByZoneAndReportedBy(NeedyZones zone, User reportedBy);
}
