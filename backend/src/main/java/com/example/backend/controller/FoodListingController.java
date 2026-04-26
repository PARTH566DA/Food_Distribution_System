package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.ClaimRequest;
import com.example.backend.dto.FoodListingDTO;
import com.example.backend.dto.FoodPageResponse;
import com.example.backend.dto.UpdateFoodProgressRequest;
import com.example.backend.model.FoodListing;
import com.example.backend.service.FoodListingService;
import com.example.backend.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/food")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class FoodListingController {

    private final FoodListingService foodListingService;
    private final JwtService jwtService;

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<FoodPageResponse>> getFoodFeed(
            @PageableDefault(page = 0, size = 5) org.springframework.data.domain.Pageable pageable
    ) {
        try {
            log.info("API get food feed page={} size={}", pageable.getPageNumber(), pageable.getPageSize());
            Page<FoodListing> foodPage = foodListingService.getAvailableFoodListings(pageable.getPageNumber(), pageable.getPageSize());

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
            log.error("Failed to fetch food feed page={} size={}", pageable.getPageNumber(), pageable.getPageSize(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch food listings: " + e.getMessage()));
        }
    }

    @GetMapping("/{foodId}")
    public ResponseEntity<ApiResponse<FoodListingDTO>> getFoodById(@PathVariable Long foodId) {
        try {
            log.info("API get food by id foodId={}", foodId);
            FoodListing foodListing = foodListingService.getFoodListingById(foodId);
            FoodListingDTO dto = FoodListingDTO.fromEntity(foodListing);
            return ResponseEntity.ok(ApiResponse.success(dto));
        } catch (RuntimeException e) {
            log.warn("Food listing not found or invalid foodId={} error={}", foodId, e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to fetch food listing foodId={}", foodId, e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch food listing: " + e.getMessage()));
        }
    }

    @GetMapping("/history/posted")
    public ResponseEntity<ApiResponse<List<FoodListingDTO>>> getPostedHistory(HttpServletRequest request) {
        try {
            Long userId = extractUserIdFromToken(request);
            if (userId == null) {
                log.warn("Unauthorized posted history request");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized"));
            }

            log.info("API get posted history userId={}", userId);

            List<FoodListingDTO> items = foodListingService.getFoodListingsPostedByUser(userId)
                    .stream()
                    .map(FoodListingDTO::fromEntity)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponse.success(items));
        } catch (Exception e) {
            log.error("Failed to fetch posted history", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch posted history: " + e.getMessage()));
        }
    }

    @GetMapping("/history/accepted")
    public ResponseEntity<ApiResponse<List<FoodListingDTO>>> getAcceptedHistory(HttpServletRequest request) {
        try {
            Long userId = extractUserIdFromToken(request);
            if (userId == null) {
                log.warn("Unauthorized accepted history request");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized"));
            }

            log.info("API get accepted history userId={}", userId);

            List<FoodListingDTO> items = foodListingService.getFoodListingsAcceptedByVolunteer(userId)
                    .stream()
                    .map(FoodListingDTO::fromEntity)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponse.success(items));
        } catch (Exception e) {
            log.error("Failed to fetch accepted history", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch accepted history: " + e.getMessage()));
        }
    }

    @PatchMapping("/{foodId}/progress")
    public ResponseEntity<ApiResponse<FoodListingDTO>> updateAcceptedOrderProgress(
            @PathVariable Long foodId,
            @RequestBody UpdateFoodProgressRequest request,
            HttpServletRequest httpRequest
    ) {
        try {
            Long volunteerUserId = extractUserIdFromToken(httpRequest);
            if (volunteerUserId == null) {
                log.warn("Unauthorized progress update request foodId={}", foodId);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized"));
            }

            log.info("API update food progress foodId={} volunteerUserId={} action={}",
                    foodId,
                    volunteerUserId,
                    request != null ? request.getAction() : null);

            FoodListing updated = foodListingService.updateAcceptedOrderProgress(
                    foodId,
                    volunteerUserId,
                    request != null ? request.getAction() : null
            );

            return ResponseEntity.ok(ApiResponse.success(
                    "Order progress updated successfully",
                    FoodListingDTO.fromEntity(updated)
            ));
        } catch (RuntimeException e) {
                log.warn("Failed to update order progress foodId={} error={}", foodId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
                log.error("Unexpected error while updating order progress foodId={}", foodId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update order progress: " + e.getMessage()));
        }
    }

    @PostMapping("/{foodId}/claim")
    public ResponseEntity<ApiResponse<FoodListingDTO>> claimFood(
            @PathVariable Long foodId,
            @RequestBody(required = false) ClaimRequest request,
            HttpServletRequest httpRequest
    ) {
        try {
            Long volunteerId = null;
            Long needyZoneId = null;

            if (request != null) {
                volunteerId = request.getUserId() != null ? request.getUserId() : request.getVolunteerId();
                needyZoneId = request.getNeedyZoneId();
            }

            String authHeader = httpRequest.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                volunteerId = jwtService.extractUserId(authHeader.substring(7));
            }

            if (volunteerId == null) {
                log.warn("Unauthorized food claim request foodId={}", foodId);
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Volunteer identity is required"));
            }

            log.info("API claim food request foodId={} volunteerId={} needyZoneId={}", foodId, volunteerId, needyZoneId);

            FoodListing claimedFood = foodListingService.claimFoodListing(foodId, volunteerId, needyZoneId);
            FoodListingDTO dto = FoodListingDTO.fromEntity(claimedFood);

            return ResponseEntity.ok(
                    ApiResponse.success("Food claimed successfully", dto)
            );
        } catch (RuntimeException e) {
                    log.warn("Failed to claim food foodId={} error={}", foodId, e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
                    log.error("Unexpected error while claiming food foodId={}", foodId, e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to claim food: " + e.getMessage()));
        }
    }

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
                log.warn("Unauthorized delete food request foodId={}", foodId);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized"));
            }
            log.info("API delete food request foodId={} userId={}", foodId, userId);
            foodListingService.deleteFoodListing(foodId, userId);
            return ResponseEntity.ok(ApiResponse.success("Food listing cancelled successfully", null));
        } catch (RuntimeException e) {
            log.warn("Failed to delete food listing foodId={} error={}", foodId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error while deleting food listing foodId={}", foodId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to cancel food listing: " + e.getMessage()));
        }
    }

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
            Long userId = null;
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                userId = jwtService.extractUserId(authHeader.substring(7));
            }

            if (userId == null) {
                log.warn("Unauthorized add food listing request");
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized"));
            }

            log.info("API add food listing request userId={} quantity={} location={}", userId, quantity, location);

            FoodListing foodListing = foodListingService.addFoodListing(
                    vegetarian, packed, description, quantity, expiryTime,
                    location, latitude, longitude, image, userId
            );
            FoodListingDTO dto = FoodListingDTO.fromEntity(foodListing);
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Food listing created successfully", dto));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid add food listing request error={}", e.getMessage());
                return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
                    log.error("Unexpected error while creating food listing", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create food listing: " + e.getMessage()));
        }
    }

    private Long extractUserIdFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtService.extractUserId(authHeader.substring(7));
        }
        return null;
    }
}

