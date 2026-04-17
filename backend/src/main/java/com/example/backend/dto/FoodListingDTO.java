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
    private Long assignmentId;
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
    private String workflowStatus;
    private Double pickupLatitude;
    private Double pickupLongitude;
    private String donorName;
    private String donorContact;
    private Long donorId;
    private Long pickedByUserId;
    private String pickedByName;
    private String pickedByContact;
    private String acceptedAt;
    private String pickedUpAt;
    private String deliveredAt;
    private String targetZoneName;
    private Double targetZoneLatitude;
    private Double targetZoneLongitude;

    /**
     * Convert FoodListing entity to DTO
     */
    public static FoodListingDTO fromEntity(FoodListing foodListing) {
        return FoodListingDTO.builder()
                .id(foodListing.getFoodId())
            .assignmentId(foodListing.getFoodAssignment() != null ? foodListing.getFoodAssignment().getAssignmentId() : null)
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
                .workflowStatus(foodListing.getStatus() != null
                    ? foodListing.getStatus().name().toLowerCase()
                    : "unknown")
                .pickupLatitude(foodListing.getPickupLatitude())
                .pickupLongitude(foodListing.getPickupLongitude())
                .donorName(foodListing.getUser() != null ? foodListing.getUser().getUserName() : null)
                .donorContact(foodListing.getUser() != null ? foodListing.getUser().getMobileNumber() : null)
                .donorId(foodListing.getUser() != null ? foodListing.getUser().getUserId() : null)
                .pickedByUserId(foodListing.getFoodAssignment() != null
                    && foodListing.getFoodAssignment().getVolunteer() != null
                    ? foodListing.getFoodAssignment().getVolunteer().getUserId()
                    : null)
                .pickedByName(foodListing.getFoodAssignment() != null
                    && foodListing.getFoodAssignment().getVolunteer() != null
                    && foodListing.getFoodAssignment().getVolunteer().getUser() != null
                    ? foodListing.getFoodAssignment().getVolunteer().getUser().getUserName()
                    : null)
                .pickedByContact(foodListing.getFoodAssignment() != null
                    && foodListing.getFoodAssignment().getVolunteer() != null
                    && foodListing.getFoodAssignment().getVolunteer().getUser() != null
                    ? foodListing.getFoodAssignment().getVolunteer().getUser().getMobileNumber()
                    : null)
                .acceptedAt(foodListing.getFoodAssignment() != null
                    ? formatDateTime(foodListing.getFoodAssignment().getAcceptedAt())
                    : null)
                .pickedUpAt(foodListing.getFoodAssignment() != null
                    ? formatDateTime(foodListing.getFoodAssignment().getPickedUpAt())
                    : null)
                .deliveredAt(foodListing.getFoodAssignment() != null
                    ? formatDateTime(foodListing.getFoodAssignment().getDeliveredAt())
                    : null)
                .targetZoneName(foodListing.getTargetZone() != null ? foodListing.getTargetZone().getName() : null)
                .targetZoneLatitude(foodListing.getTargetZone() != null ? foodListing.getTargetZone().getLatitude() : null)
                .targetZoneLongitude(foodListing.getTargetZone() != null ? foodListing.getTargetZone().getLongitude() : null)
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
            case CANCELLED:
                return "cancelled";
            default:
                return "unknown";
        }
    }
}

