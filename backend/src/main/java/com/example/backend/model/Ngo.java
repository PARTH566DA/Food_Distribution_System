package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "ngos")
public class Ngo {

    @Id
    @Column(name = "user_id")
    private Long userId;

    // Map the NGO PK to the user's PK and create a foreign key to users(user_id)
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;


    @Column(name = "ngo_name", nullable = false)
    private String ngoName;

    @Column(name = "contact_person", nullable = false)
    private String contactPerson;

    @Column(name = "address", nullable = false)
    private String address;

    @Column(name = "service_radius")
    private Integer serviceRadius;
}
