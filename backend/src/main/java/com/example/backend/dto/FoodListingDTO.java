package com.example.backend.dto;

import com.example.backend.model.FoodListing;
import com.example.backend.model.Enums.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodListingDTO {

    private Long id;
    private String foodId;
    private String description;
    private String quantity;
    private Boolean packed;
    private Boolean vegetarian;
    private String imageUrl;
    private String createdAt;
    private String address;
    private String expiryTime;
    private String status;
    private Double pickupLatitude;
    private Double pickupLongitude;

    /**
     * Convert FoodListing entity to DTO
     */
    public static FoodListingDTO fromEntity(FoodListing foodListing) {
        return FoodListingDTO.builder()
                .id(foodListing.getFoodId())
                .foodId("FOOD" + String.format("%03d", foodListing.getFoodId()))
                .description(foodListing.getDescription())
                .quantity(String.valueOf(foodListing.getQuantity()))
                .packed(foodListing.getIsPackaged())
                .vegetarian(foodListing.getVegetarian())
                .imageUrl(foodListing.getImageUrl())
                .createdAt(formatDateTime(foodListing.getCreatedAt()))
                .address(foodListing.getAddress())
                .expiryTime(String.valueOf(foodListing.getExpiry()))
                .status(mapStatus(foodListing.getStatus()))
                .pickupLatitude(foodListing.getPickupLatitude())
                .pickupLongitude(foodListing.getPickupLongitude())
                .build();
    }

    /**
     * Format LocalDateTime to ISO 8601 string
     */
    private static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.format(DateTimeFormatter.ISO_DATE_TIME);
    }

    /**
     * Map backend Status enum to frontend status strings
     */
    private static String mapStatus(Status status) {
        if (status == null) return "unknown";

        switch (status) {
            case OPEN:
                return "available";
            case ASSIGNED:
            case PICKED_UP:
                return "claimed";
            case DELIVERED:
                return "delivered";
            case EXPIRED:
                return "expired";
            default:
                return "unknown";
        }
    }
}

