package com.example.backend.dto;

import com.example.backend.model.AssignmentChatMessage;
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
public class AssignmentChatMessageDTO {

    private Long messageId;
    private Long assignmentId;
    private Long senderUserId;
    private String senderName;
    private String message;
    private String createdAt;

    public static AssignmentChatMessageDTO fromEntity(AssignmentChatMessage entity) {
        return AssignmentChatMessageDTO.builder()
                .messageId(entity.getMessageId())
                .assignmentId(entity.getAssignment() != null ? entity.getAssignment().getAssignmentId() : null)
                .senderUserId(entity.getSender() != null ? entity.getSender().getUserId() : null)
                .senderName(entity.getSender() != null ? entity.getSender().getUserName() : null)
                .message(entity.getMessageText())
                .createdAt(formatDateTime(entity.getCreatedAt()))
                .build();
    }

    private static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.format(DateTimeFormatter.ISO_DATE_TIME);
    }
}
