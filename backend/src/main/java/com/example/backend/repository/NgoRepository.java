package com.example.backend.repository;

import com.example.backend.model.Ngo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NgoRepository extends JpaRepository<Ngo, Long> {

    Optional<Ngo> findByUserUserId(Long userId);

    List<Ngo> findByNgoNameContainingIgnoreCase(String ngoName);

    List<Ngo> findByContactPersonContainingIgnoreCase(String contactPerson);

    List<Ngo> findByAddressContainingIgnoreCase(String address);

    @Query("SELECT n FROM Ngo n WHERE n.serviceRadius >= :requiredRadius")
    List<Ngo> findByMinimumServiceRadius(@Param("requiredRadius") Integer requiredRadius);
}
