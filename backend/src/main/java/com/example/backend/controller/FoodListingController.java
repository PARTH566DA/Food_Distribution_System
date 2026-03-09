package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.ClaimRequest;
import com.example.backend.dto.FoodListingDTO;
import com.example.backend.dto.FoodPageResponse;
import com.example.backend.model.FoodListing;
import com.example.backend.service.FoodListingService;
import com.example.backend.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/food")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Configure this properly in production
public class FoodListingController {

    private final FoodListingService foodListingService;
    private final JwtService jwtService;

    /**
     * Get paginated food listings
     * GET /api/food/feed?page=0&size=5
     */
    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<FoodPageResponse>> getFoodFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        try {
            Page<FoodListing> foodPage = foodListingService.getAvailableFoodListings(page, size);

            List<FoodListingDTO> items = foodPage.getContent()
                    .stream()
                    .map(FoodListingDTO::fromEntity)
                    .collect(Collectors.toList());

            FoodPageResponse response = FoodPageResponse.builder()
                    .items(items)
                    .currentPage(foodPage.getNumber())
                    .totalPages(foodPage.getTotalPages())
                    .totalItems(foodPage.getTotalElements())
                    .hasMore(foodPage.hasNext())
                    .build();

            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch food listings: " + e.getMessage()));
        }
    }

    /**
     * Get specific food listing by ID
     * GET /api/food/{foodId}
     */
    @GetMapping("/{foodId}")
    public ResponseEntity<ApiResponse<FoodListingDTO>> getFoodById(@PathVariable Long foodId) {
        try {
            FoodListing foodListing = foodListingService.getFoodListingById(foodId);
            FoodListingDTO dto = FoodListingDTO.fromEntity(foodListing);
            return ResponseEntity.ok(ApiResponse.success(dto));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch food listing: " + e.getMessage()));
        }
    }

    /**
     * Claim a food listing
     * POST /api/food/{foodId}/claim
     */
    @PostMapping("/{foodId}/claim")
    public ResponseEntity<ApiResponse<FoodListingDTO>> claimFood(
            @PathVariable Long foodId,
            @RequestBody ClaimRequest request
    ) {
        try {
            // For now, we'll use volunteerId from request body
            // In production, this should come from the authenticated user's session
            Long volunteerId = request.getVolunteerId() != null ? request.getVolunteerId() : 1L;

            FoodListing claimedFood = foodListingService.claimFoodListing(foodId, volunteerId);
            FoodListingDTO dto = FoodListingDTO.fromEntity(claimedFood);

            return ResponseEntity.ok(
                    ApiResponse.success("Food claimed successfully", dto)
            );
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to claim food: " + e.getMessage()));
        }
    }

    /**
     * Cancel (delete) a food listing — only by the owner
     * DELETE /api/food/{foodId}
     */
    @DeleteMapping("/{foodId}")
    public ResponseEntity<ApiResponse<Void>> deleteFoodListing(
            @PathVariable Long foodId,
            HttpServletRequest request
    ) {
        try {
            Long userId = null;
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                userId = jwtService.extractUserId(authHeader.substring(7));
            }
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized"));
            }
            foodListingService.deleteFoodListing(foodId, userId);
            return ResponseEntity.ok(ApiResponse.success("Food listing cancelled successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to cancel food listing: " + e.getMessage()));
        }
    }

    /**
     * Add a new food listing
     * POST /api/food
     */
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<FoodListingDTO>> addFoodListing(
            @RequestParam("vegetarian") Boolean vegetarian,
            @RequestParam("packed") Boolean packed,
            @RequestParam("description") String description,
            @RequestParam("quantity") Integer quantity,
            @RequestParam("expiryTime") Double expiryTime,
            @RequestParam("location") String location,
            @RequestParam("latitude") Double latitude,
            @RequestParam("longitude") Double longitude,
            @RequestParam(value = "image", required = false) MultipartFile image,
            HttpServletRequest request
    ) {
        try {
            // Extract userId from the JWT token — more reliable than a client-supplied param
            Long userId = null;
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                userId = jwtService.extractUserId(authHeader.substring(7));
            }

            FoodListing foodListing = foodListingService.addFoodListing(
                    vegetarian, packed, description, quantity, expiryTime,
                    location, latitude, longitude, image, userId
            );
            FoodListingDTO dto = FoodListingDTO.fromEntity(foodListing);
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Food listing created successfully", dto));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create food listing: " + e.getMessage()));
        }
    }
}

