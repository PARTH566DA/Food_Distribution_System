package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.AssignmentChatMessageDTO;
import com.example.backend.dto.SendAssignmentChatMessageRequest;
import com.example.backend.service.AssignmentChatService;
import com.example.backend.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AssignmentChatController {

    private final AssignmentChatService assignmentChatService;
    private final JwtService jwtService;

    @GetMapping("/{assignmentId}/chat")
    public ResponseEntity<ApiResponse<List<AssignmentChatMessageDTO>>> getAssignmentChat(
            @PathVariable Long assignmentId,
            HttpServletRequest request
    ) {
        try {
            Long userId = extractUserIdFromToken(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized"));
            }

            List<AssignmentChatMessageDTO> messages = assignmentChatService.getMessages(assignmentId, userId);
            return ResponseEntity.ok(ApiResponse.success(messages));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to load assignment chat: " + e.getMessage()));
        }
    }

    @PostMapping("/{assignmentId}/chat")
    public ResponseEntity<ApiResponse<AssignmentChatMessageDTO>> sendAssignmentMessage(
            @PathVariable Long assignmentId,
            @RequestBody SendAssignmentChatMessageRequest body,
            HttpServletRequest request
    ) {
        try {
            Long userId = extractUserIdFromToken(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized"));
            }

            AssignmentChatMessageDTO message = assignmentChatService.sendMessage(
                    assignmentId,
                    userId,
                    body != null ? body.getMessage() : null
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Message sent", message));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to send message: " + e.getMessage()));
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
