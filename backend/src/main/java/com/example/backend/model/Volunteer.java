package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "volunteers")
public class Volunteer {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "is_available")
    private Boolean available;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type")
    private VehicleType vehicleType;

    @Column(name = "last_known_latitude")
    private Double lastKnownLatitude;
    @Column(name = "last_known_longitude")
    private Double lastKnownLongitude;
}
