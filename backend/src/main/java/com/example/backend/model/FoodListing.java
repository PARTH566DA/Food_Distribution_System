package com.example.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "food_listings")
public class FoodListing {

    @Id
    @Column(name = "food_id")
    private Long foodId;



}
