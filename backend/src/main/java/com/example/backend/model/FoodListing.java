package com.example.backend.model;

import com.example.backend.model.Enums.Status;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "food_listings")
public class FoodListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "food_id")
    private Long foodId;

    @Column(name = "is_vegetarian" , nullable = false)
    private Boolean vegetarian;

    @Column(name = "is_packed_in_box" , nullable = false)
    private Boolean isPackaged;

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

    @Column(name = "pickup_address" , nullable = false)
    private String address;

    @Column(name = "image_url")
    private String imageUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;


    @OneToOne(mappedBy = "foodListing")
    private FoodAssignment foodAssignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_zone_id")
    private NeedyZones targetZone;


}
