package com.example.backend.repository;

import com.example.backend.model.AssignmentChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssignmentChatMessageRepository extends JpaRepository<AssignmentChatMessage, Long> {

    List<AssignmentChatMessage> findTop200ByAssignmentAssignmentIdOrderByCreatedAtAsc(Long assignmentId);
}
