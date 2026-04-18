package com.example.backend.service;

import com.example.backend.model.FoodListing;
import com.example.backend.model.FoodAssignment;
import com.example.backend.model.NeedyZones;
import com.example.backend.model.User;
import com.example.backend.model.Volunteer;
import com.example.backend.model.Enums.Status;
import com.example.backend.model.Enums.AssignmentStatus;
import com.example.backend.model.Enums.NeedyZoneStatus;
import com.example.backend.repository.FoodListingRepository;
import com.example.backend.repository.FoodAssignmentRepository;
import com.example.backend.repository.NeedyZonesRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.VolunteerRepository;
import com.example.backend.service.storage.ImageStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FoodListingService {

    private final FoodListingRepository foodListingRepository;
    private final UserRepository userRepository;
    private final VolunteerRepository volunteerRepository;
    private final FoodAssignmentRepository foodAssignmentRepository;
    private final NeedyZonesRepository needyZonesRepository;
    private final NotificationService notificationService;
    private final ImageStorageService imageStorageService;


    @Transactional()
    public Page<FoodListing> getAvailableFoodListings(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        markExpiredListings();
        return foodListingRepository.findByStatusOrderByExpiryAsc(Status.OPEN.name(), pageable);
    }

    
    @Transactional(readOnly = true)
    public FoodListing getFoodListingById(Long foodId) {
        return foodListingRepository.findById(foodId)
                .orElseThrow(() -> new RuntimeException("Food listing not found with id: " + foodId));
    }

    @Transactional(readOnly = true)
    public List<FoodListing> getFoodListingsPostedByUser(Long userId) {
        return foodListingRepository.findByUserUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<FoodListing> getFoodListingsAcceptedByVolunteer(Long volunteerUserId) {
        return foodAssignmentRepository.findByVolunteerUserId(volunteerUserId)
                .stream()
                .sorted(Comparator.comparing(FoodAssignment::getAssignedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(FoodAssignment::getFoodListing)
                .filter(foodListing -> foodListing != null)
                .collect(Collectors.toList());
    }

    @Transactional
    public FoodListing updateAcceptedOrderProgress(Long foodId, Long volunteerUserId, String action) {
        FoodListing foodListing = getFoodListingById(foodId);
        FoodAssignment assignment = foodListing.getFoodAssignment();

        if (assignment == null || assignment.getVolunteer() == null) {
            throw new RuntimeException("This food order is not assigned to any volunteer");
        }

        if (!assignment.getVolunteer().getUserId().equals(volunteerUserId)) {
            throw new RuntimeException("Unauthorized: This order belongs to another volunteer");
        }

        if (action == null) {
            throw new RuntimeException("Action is required");
        }

        String normalizedAction = action.trim().toUpperCase();
        String ownerNotificationTitle;
        String ownerNotificationMessage;

        if ("PICKED_UP".equals(normalizedAction)) {
            if (foodListing.getStatus() != Status.ASSIGNED) {
                throw new RuntimeException("Only assigned orders can be marked as picked up");
            }
            foodListing.setStatus(Status.PICKED_UP);
            assignment.setStatus(AssignmentStatus.ACCEPTED);
            if (assignment.getAcceptedAt() == null) {
                assignment.setAcceptedAt(LocalDateTime.now());
            }
            if (assignment.getPickedUpAt() == null) {
                assignment.setPickedUpAt(LocalDateTime.now());
            }
            assignment.setDeliveredAt(null);
            ownerNotificationTitle = "Food picked up";
            ownerNotificationMessage = "Your listing " + listingRef(foodListing) + " has been picked up by " + volunteerName(assignment) + ".";
        } else if ("DELIVERED".equals(normalizedAction)) {
            if (foodListing.getStatus() != Status.PICKED_UP) {
                throw new RuntimeException("Only picked up orders can be marked as delivered");
            }
            foodListing.setStatus(Status.DELIVERED);
            assignment.setStatus(AssignmentStatus.ACCEPTED);
            if (assignment.getAcceptedAt() == null) {
                assignment.setAcceptedAt(LocalDateTime.now());
            }
            if (assignment.getPickedUpAt() == null) {
                assignment.setPickedUpAt(LocalDateTime.now());
            }
            assignment.setDeliveredAt(LocalDateTime.now());
            ownerNotificationTitle = "Food delivered";
            ownerNotificationMessage = "Your listing " + listingRef(foodListing) + " has been delivered to the target zone.";
        } else {
            throw new RuntimeException("Unsupported action: " + action);
        }

        foodAssignmentRepository.save(assignment);
        FoodListing saved = foodListingRepository.save(foodListing);

        notifyUser(
                saved.getUser() != null ? saved.getUser().getUserId() : null,
                "success",
                ownerNotificationTitle,
                ownerNotificationMessage
        );

        return saved;
    }

    @Transactional
    public FoodListing claimFoodListing(Long foodId, Long volunteerId, Long needyZoneId) {
        FoodListing foodListing = getFoodListingById(foodId);

        if (foodListing.getStatus() != Status.OPEN) {
            throw new RuntimeException("Food listing is no longer available");
        }

        NeedyZones targetZone = null;
        if (needyZoneId != null) {
            targetZone = needyZonesRepository.findById(needyZoneId)
                    .orElseThrow(() -> new RuntimeException("Needy zone not found with id: " + needyZoneId));
            if (targetZone.getStatus() != NeedyZoneStatus.ACTIVE) {
                throw new RuntimeException("Selected needy zone is not active");
            }
        }

        foodListing.setStatus(Status.ASSIGNED);
        foodListing.setTargetZone(targetZone);

        FoodAssignment assignment = foodListing.getFoodAssignment();
        if (assignment == null) {
            assignment = new FoodAssignment();
            assignment.setFoodListing(foodListing);
            assignment.setAssignedAt(LocalDateTime.now());
            assignment.setAcceptedAt(LocalDateTime.now());
            assignment.setStatus(AssignmentStatus.ASSIGNED);
            assignment.setPickedUpAt(null);
            assignment.setDeliveredAt(null);
        } else {
            assignment.setStatus(AssignmentStatus.ASSIGNED);
            if (assignment.getAssignedAt() == null) {
                assignment.setAssignedAt(LocalDateTime.now());
            }
            assignment.setAcceptedAt(LocalDateTime.now());
            assignment.setPickedUpAt(null);
            assignment.setDeliveredAt(null);
        }

        assignment.setVolunteer(volunteerRepository.findById(volunteerId)
            .orElseGet(() -> {
                User user = userRepository.findById(volunteerId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + volunteerId));
                Volunteer volunteer = new Volunteer();
                volunteer.setUser(user);
                volunteer.setAvailable(true);
                return volunteerRepository.save(volunteer);
            }));

        foodAssignmentRepository.save(assignment);
        FoodListing saved = foodListingRepository.save(foodListing);

        notifyUser(
            saved.getUser() != null ? saved.getUser().getUserId() : null,
            "success",
            "Food accepted",
            "Your listing " + listingRef(saved) + " was accepted by " + volunteerName(assignment) + "."
        );

        notifyUser(
            assignment.getVolunteer() != null ? assignment.getVolunteer().getUserId() : null,
            "location",
            "Pickup assigned",
            "You accepted " + listingRef(saved) + ". Please pick it up and update progress in History."
        );

        return saved;
    }

    @Transactional
    public void deleteFoodListing(Long foodId, Long userId) {
        FoodListing foodListing = getFoodListingById(foodId);

        if (foodListing.getUser() == null || !foodListing.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized: You can only cancel your own food listings");
        }

        if (foodListing.getStatus() != Status.OPEN) {
            throw new RuntimeException("Cannot cancel a food listing that is no longer available");
        }

        foodListing.setStatus(Status.CANCELLED);
        foodListingRepository.save(foodListing);
    }

    @Transactional
    public FoodListing addFoodListing(
            Boolean vegetarian,
            Boolean packed,
            String description,
            Integer quantity,
            Double expiryTime,
            String address,
            Double latitude,
            Double longitude,
            MultipartFile image,
            Long userId
    ) {
        FoodListing foodListing = new FoodListing();
        foodListing.setVegetarian(vegetarian);
        foodListing.setIsPackaged(packed);
        foodListing.setDescription(description);
        foodListing.setQuantity(quantity);
        foodListing.setExpiry(expiryTime.intValue());
        foodListing.setAddress(address);
        foodListing.setPickupLatitude(latitude);
        foodListing.setPickupLongitude(longitude);
        foodListing.setStatus(Status.OPEN);

        if (userId != null) {
            userRepository.findById(userId).ifPresent(foodListing::setUser);
        }

        if (image != null && !image.isEmpty()) {
            String imageUrl = imageStorageService.storeFoodImage(image);
            foodListing.setImageUrl(imageUrl);
        }

        return foodListingRepository.save(foodListing);
    }

    @Scheduled(fixedRate = 60000)
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void markExpiredListings() {
        int count = foodListingRepository.markExpiredListings();
        if (count > 0) {
            log.info("Marked {} food listing(s) as EXPIRED", count);
        }
    }

    private void notifyUser(Long userId, String type, String title, String message) {
        if (userId == null) return;
        try {
            notificationService.createNotification(userId, type, title, message);
        } catch (Exception e) {
            log.warn("Failed to create notification for user {}: {}", userId, e.getMessage());
        }
    }

    private String listingRef(FoodListing foodListing) {
        if (foodListing == null) return "food listing";
        if (foodListing.getFoodId() != null) return "#" + foodListing.getFoodId();
        return "food listing";
    }

    private String volunteerName(FoodAssignment assignment) {
        if (assignment == null || assignment.getVolunteer() == null || assignment.getVolunteer().getUser() == null) {
            return "a volunteer";
        }
        String name = assignment.getVolunteer().getUser().getUserName();
        return (name == null || name.isBlank()) ? "a volunteer" : name;
    }
}
