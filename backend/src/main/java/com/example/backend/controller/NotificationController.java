package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.NotificationFeedResponse;
import com.example.backend.service.JwtService;
import com.example.backend.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtService jwtService;

    @GetMapping
    public ResponseEntity<ApiResponse<NotificationFeedResponse>> getMyNotifications(HttpServletRequest request) {
        try {
            Long userId = extractUserIdFromToken(request);
            if (userId == null) {
                log.warn("Unauthorized notification feed request");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized"));
            }

            log.info("API get notifications userId={}", userId);

            NotificationFeedResponse feed = notificationService.getNotificationFeed(userId);
            return ResponseEntity.ok(ApiResponse.success(feed));
        } catch (Exception e) {
            log.error("Failed to fetch notifications", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch notifications: " + e.getMessage()));
        }
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long notificationId,
            HttpServletRequest request
    ) {
        try {
            Long userId = extractUserIdFromToken(request);
            if (userId == null) {
                log.warn("Unauthorized mark-as-read request notificationId={}", notificationId);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized"));
            }

            log.info("API mark notification as read userId={} notificationId={}", userId, notificationId);

            notificationService.markAsRead(userId, notificationId);
            return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
        } catch (RuntimeException e) {
            log.warn("Failed to mark notification as read notificationId={} error={}", notificationId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error while marking notification as read notificationId={}", notificationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to mark notification as read: " + e.getMessage()));
        }
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(HttpServletRequest request) {
        try {
            Long userId = extractUserIdFromToken(request);
            if (userId == null) {
                log.warn("Unauthorized mark-all-as-read request");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized"));
            }

            log.info("API mark all notifications as read userId={}", userId);

            notificationService.markAllAsRead(userId);
            return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
        } catch (Exception e) {
            log.error("Unexpected error while marking all notifications as read", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to mark all notifications as read: " + e.getMessage()));
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
