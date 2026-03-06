package com.example.backend.repository;

import com.example.backend.model.FoodListing;
import com.example.backend.model.Enums.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FoodListingRepository extends JpaRepository<FoodListing, Long> {

    List<FoodListing> findByStatus(Status status);

    Page<FoodListing> findByStatus(Status status, Pageable pageable);

    List<FoodListing> findByUserUserId(Long userId);

    List<FoodListing> findByTargetZoneNeedyZoneId(Long zoneId);

    @Query(value = "SELECT f FROM FoodListing f LEFT JOIN FETCH f.user WHERE f.status = :status ORDER BY f.createdAt ASC",
           countQuery = "SELECT COUNT(f) FROM FoodListing f WHERE f.status = :status")
    Page<FoodListing> findByStatusWithUser(@Param("status") Status status, Pageable pageable);

    @Modifying
    @Query(value = "UPDATE food_listings SET status = 'EXPIRED' WHERE status = 'OPEN' AND DATE_ADD(created_at, INTERVAL fresh_hours HOUR) <= NOW()", nativeQuery = true)
    int markExpiredListings();
}