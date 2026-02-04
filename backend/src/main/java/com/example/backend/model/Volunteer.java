package com.example.backend.model;

import com.example.backend.model.Enums.VehicleType;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;


@Data
@Entity
@Table(name = "volunteers")
public class Volunteer {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "is_available")
    private Boolean available;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type")
    private VehicleType vehicleType;

    @Column(name = "last_known_latitude")
    private Double lastKnownLatitude;

    @Column(name = "last_known_longitude")
    private Double lastKnownLongitude;

    @OneToMany(mappedBy = "volunteer", fetch = FetchType.LAZY)
    private List<FoodAssignment> assignments;

    @OneToMany(mappedBy = "volunteer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<VolunteerAvailability> availabilitySlots;
}
