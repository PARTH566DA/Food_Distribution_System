package com.example.backend.repository;

import com.example.backend.model.VolunteerAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface VolunteerAvailabilityRepository extends JpaRepository<VolunteerAvailability, Long> {

    List<VolunteerAvailability> findByVolunteerUserId(Long volunteerId);

    List<VolunteerAvailability> findByIsActive(Boolean isActive);
}
