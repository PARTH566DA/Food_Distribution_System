package com.example.backend.model;

import com.example.backend.model.Enums.AssignmentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class FoodAssignment {

    @Id
    @Column(name = "assignment_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long assignmentId;

    @Column(name = "assigned_time")
    private LocalDateTime assignedAt;

    @Column(name = "accepted_time")
    private LocalDateTime acceptedAt;

    @Column(name = "picked_up_time")
    private LocalDateTime pickedUpAt;

    @Column(name = "delivered_time")
    private LocalDateTime deliveredAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "assignment_status")
    private AssignmentStatus status;

    @OneToOne
    @JoinColumn(name = "food_id", nullable = false, unique = true)
    private FoodListing foodListing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "volunteer_user_id")
    private Volunteer volunteer;
}
