package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "food_listings")
public class FoodListing {

    @Id
    @Column(name = "food_id")
    private Long foodId;

    @Column(name = "quantity" , nullable = false)
    private Integer quantity;

    @Column(name = "fresh_hours" , nullable = false)
    private Integer expiry;

    @Column(name = "pickup_latitude" , nullable = false)
    private Double pickupLatitude;
    @Column(name = "pickup_longitude" , nullable = false)
    private Double pickupLongitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "status" , nullable = false)
    private Status status;

    @Column(name = "description" , nullable = false)
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

}
