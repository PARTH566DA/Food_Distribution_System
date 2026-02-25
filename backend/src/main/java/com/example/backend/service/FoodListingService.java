package com.example.backend.service;

import com.example.backend.model.FoodListing;
import com.example.backend.model.User;
import com.example.backend.model.Enums.Status;
import com.example.backend.repository.FoodListingRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FoodListingService {

    private final FoodListingRepository foodListingRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * Get paginated food listings with OPEN status sorted by remaining expiry time (soonest first)
     */
    @Transactional()
    public Page<FoodListing> getAvailableFoodListings(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        // Mark expired listings before fetching (runs in its own committed transaction)
        markExpiredListings();
        return foodListingRepository.findByStatusOrderByExpiryAsc(Status.OPEN.name(), pageable);
    }

    /**
     * Get a specific food listing by ID
     */
    @Transactional(readOnly = true)
    public FoodListing getFoodListingById(Long foodId) {
        return foodListingRepository.findById(foodId)
                .orElseThrow(() -> new RuntimeException("Food listing not found with id: " + foodId));
    }

    /**
     * Claim a food listing (update status to ASSIGNED)
     */
    @Transactional
    public FoodListing claimFoodListing(Long foodId, Long volunteerId) {
        FoodListing foodListing = getFoodListingById(foodId);

        // Check if food is still available
        if (foodListing.getStatus() != Status.OPEN) {
            throw new RuntimeException("Food listing is no longer available");
        }

        // Update status to ASSIGNED
        foodListing.setStatus(Status.ASSIGNED);

        return foodListingRepository.save(foodListing);
    }

    /**
     * Add a new food listing (with optional image upload)
     */
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

        // Attach user if provided
        if (userId != null) {
            userRepository.findById(userId).ifPresent(foodListing::setUser);
        }

        // Handle image upload
        if (image != null && !image.isEmpty()) {
            String imageUrl = saveImage(image);
            foodListing.setImageUrl(imageUrl);
        }

        return foodListingRepository.save(foodListing);
    }

    /**
     * Save uploaded image to local filesystem and return relative URL
     */
    private String saveImage(MultipartFile image) {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = image.getOriginalFilename();
            String extension = (originalFilename != null && originalFilename.contains("."))
                    ? originalFilename.substring(originalFilename.lastIndexOf('.'))
                    : ".jpg";
            String filename = UUID.randomUUID() + extension;

            Path filePath = uploadPath.resolve(filename);
            Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save image: " + e.getMessage());
        }
    }

    /**
     * Check and mark expired food listings.
     * Runs every 60 seconds via scheduler, and also before each feed fetch.
     * Uses REQUIRES_NEW so the UPDATE commits before the caller's SELECT runs.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void markExpiredListings() {
        int count = foodListingRepository.markExpiredListings();
        if (count > 0) {
            log.info("Marked {} food listing(s) as EXPIRED", count);
        }
    }
}
