package com.example.backend.model;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "assignment_status")
    private AssignmentStatus status;

}
