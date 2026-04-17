package com.example.backend.service;

import com.example.backend.dto.AssignmentChatMessageDTO;
import com.example.backend.model.AssignmentChatMessage;
import com.example.backend.model.FoodAssignment;
import com.example.backend.model.User;
import com.example.backend.repository.AssignmentChatMessageRepository;
import com.example.backend.repository.FoodAssignmentRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AssignmentChatService {

    private final FoodAssignmentRepository foodAssignmentRepository;
    private final UserRepository userRepository;
    private final AssignmentChatMessageRepository assignmentChatMessageRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<AssignmentChatMessageDTO> getMessages(Long assignmentId, Long requesterUserId) {
        FoodAssignment assignment = getAuthorizedAssignment(assignmentId, requesterUserId);
        return assignmentChatMessageRepository
                .findTop200ByAssignmentAssignmentIdOrderByCreatedAtAsc(assignment.getAssignmentId())
                .stream()
                .map(AssignmentChatMessageDTO::fromEntity)
                .toList();
    }

    @Transactional
    public AssignmentChatMessageDTO sendMessage(Long assignmentId, Long senderUserId, String message) {
        FoodAssignment assignment = getAuthorizedAssignment(assignmentId, senderUserId);

        String trimmed = message == null ? "" : message.trim();
        if (trimmed.isBlank()) {
            throw new RuntimeException("Message cannot be empty");
        }
        if (trimmed.length() > 1000) {
            throw new RuntimeException("Message cannot exceed 1000 characters");
        }

        User sender = userRepository.findById(senderUserId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        AssignmentChatMessage chatMessage = new AssignmentChatMessage();
        chatMessage.setAssignment(assignment);
        chatMessage.setSender(sender);
        chatMessage.setMessageText(trimmed);

        AssignmentChatMessage saved = assignmentChatMessageRepository.save(chatMessage);

        Long donorId = assignment.getFoodListing() != null && assignment.getFoodListing().getUser() != null
                ? assignment.getFoodListing().getUser().getUserId()
                : null;
        Long volunteerId = assignment.getVolunteer() != null ? assignment.getVolunteer().getUserId() : null;

        Long recipientId = senderUserId.equals(donorId) ? volunteerId : donorId;
        if (recipientId != null) {
            try {
                notificationService.createNotification(
                        recipientId,
                        "info",
                        "New assignment message",
                        sender.getUserName() + " sent a message about " + listingRef(assignment)
                );
            } catch (Exception ignored) {
                // Chat should still work even if notifications fail.
            }
        }

        return AssignmentChatMessageDTO.fromEntity(saved);
    }

    private FoodAssignment getAuthorizedAssignment(Long assignmentId, Long requesterUserId) {
        FoodAssignment assignment = foodAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        Long donorId = assignment.getFoodListing() != null && assignment.getFoodListing().getUser() != null
                ? assignment.getFoodListing().getUser().getUserId()
                : null;
        Long volunteerId = assignment.getVolunteer() != null ? assignment.getVolunteer().getUserId() : null;

        boolean isParticipant = requesterUserId != null
                && (requesterUserId.equals(donorId) || requesterUserId.equals(volunteerId));

        if (!isParticipant) {
            throw new RuntimeException("Unauthorized assignment chat access");
        }

        return assignment;
    }

    private String listingRef(FoodAssignment assignment) {
        if (assignment == null || assignment.getFoodListing() == null || assignment.getFoodListing().getFoodId() == null) {
            return "your assignment";
        }
        return "#" + assignment.getFoodListing().getFoodId();
    }
}
