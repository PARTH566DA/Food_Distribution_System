package com.example.backend.repository;

import com.example.backend.model.DeliveryProof;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DeliveryProofRepository extends JpaRepository<DeliveryProof, Long> {

    Optional<DeliveryProof> findByAssignmentAssignmentId(Long assignmentId);

    @Query("SELECT dp FROM DeliveryProof dp WHERE dp.assignment.volunteer.userId = :volunteerId")
    List<DeliveryProof> findByVolunteerId(@Param("volunteerId") Long volunteerId);

    @Query("SELECT dp FROM DeliveryProof dp WHERE dp.deliveredAt BETWEEN :startDate AND :endDate")
    List<DeliveryProof> findDeliveriesBetweenDates(@Param("startDate") LocalDateTime startDate,
                                                  @Param("endDate") LocalDateTime endDate);

    @Query("SELECT dp FROM DeliveryProof dp WHERE dp.assignment.foodListing.user.userId = :donorId")
    List<DeliveryProof> findByDonorId(@Param("donorId") Long donorId);

    @Query("SELECT COUNT(dp) FROM DeliveryProof dp WHERE dp.assignment.volunteer.userId = :volunteerId")
    Long countDeliveriesByVolunteer(@Param("volunteerId") Long volunteerId);
}
