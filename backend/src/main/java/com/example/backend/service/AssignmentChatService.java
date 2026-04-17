package com.example.backend.service;

import com.example.backend.dto.AssignmentChatMessageDTO;
import com.example.backend.model.AssignmentChatMessage;
import com.example.backend.model.FoodAssignment;
import com.example.backend.model.User;
import com.example.backend.repository.AssignmentChatMessageRepository;
import com.example.backend.repository.FoodAssignmentRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssignmentChatService {

    private final FoodAssignmentRepository foodAssignmentRepository;
    private final UserRepository userRepository;
    private final AssignmentChatMessageRepository assignmentChatMessageRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<AssignmentChatMessageDTO> getMessages(Long assignmentId, Long requesterUserId) {
        log.info("Fetching assignment chat assignmentId={} requesterUserId={}", assignmentId, requesterUserId);
        FoodAssignment assignment = getAuthorizedAssignment(assignmentId, requesterUserId);
        List<AssignmentChatMessageDTO> messages = assignmentChatMessageRepository
                .findTop200ByAssignmentAssignmentIdOrderByCreatedAtAsc(assignment.getAssignmentId())
                .stream()
                .map(AssignmentChatMessageDTO::fromEntity)
                .toList();
        log.info("Fetched assignment chat messages assignmentId={} count={}", assignmentId, messages.size());
        return messages;
    }

    @Transactional
    public AssignmentChatMessageDTO sendMessage(Long assignmentId, Long senderUserId, String message) {
        log.info("Sending assignment chat message assignmentId={} senderUserId={}", assignmentId, senderUserId);
        FoodAssignment assignment = getAuthorizedAssignment(assignmentId, senderUserId);

        String trimmed = message == null ? "" : message.trim();
        if (trimmed.isBlank()) {
            log.warn("Rejected empty assignment chat message assignmentId={} senderUserId={}", assignmentId, senderUserId);
            throw new RuntimeException("Message cannot be empty");
        }
        if (trimmed.length() > 1000) {
            log.warn("Rejected oversized assignment chat message assignmentId={} senderUserId={} length={}", assignmentId, senderUserId, trimmed.length());
            throw new RuntimeException("Message cannot exceed 1000 characters");
        }

        User sender = userRepository.findById(senderUserId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        AssignmentChatMessage chatMessage = new AssignmentChatMessage();
        chatMessage.setAssignment(assignment);
        chatMessage.setSender(sender);
        chatMessage.setMessageText(trimmed);

        AssignmentChatMessage saved = assignmentChatMessageRepository.save(chatMessage);
        log.info("Assignment chat message saved assignmentId={} messageId={} senderUserId={}",
            assignmentId,
            saved.getMessageId(),
            senderUserId);

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
            } catch (Exception e) {
                log.warn("Failed to create chat notification assignmentId={} recipientUserId={} error={}",
                        assignmentId,
                        recipientId,
                        e.getMessage());
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
            log.warn("Unauthorized assignment chat access assignmentId={} requesterUserId={}", assignmentId, requesterUserId);
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
