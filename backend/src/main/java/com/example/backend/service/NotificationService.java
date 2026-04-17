package com.example.backend.service;

import com.example.backend.dto.NotificationDTO;
import com.example.backend.dto.NotificationFeedResponse;
import com.example.backend.model.Notification;
import com.example.backend.model.User;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createNotification(Long recipientUserId, String type, String title, String message) {
        if (recipientUserId == null) {
            log.warn("Skipping notification creation because recipientUserId is null title={}", title);
            return;
        }

        User recipient = userRepository.findById(recipientUserId)
                .orElseThrow(() -> new RuntimeException("Notification recipient not found"));

        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setType(type == null ? "info" : type.trim().toLowerCase());
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setIsRead(false);

        notificationRepository.save(notification);
        log.info("Notification created recipientUserId={} type={} title={}", recipientUserId, notification.getType(), title);
    }

    @Transactional(readOnly = true)
    public NotificationFeedResponse getNotificationFeed(Long userId) {
        List<NotificationDTO> items = notificationRepository
            .findTop50ByRecipientUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationDTO::fromEntity)
                .toList();

        long unreadCount = notificationRepository.countByRecipientUserIdAndIsReadFalse(userId);

        log.info("Fetched notification feed userId={} itemCount={} unreadCount={}", userId, items.size(), unreadCount);

        return NotificationFeedResponse.builder()
                .items(items)
                .unreadCount(unreadCount)
                .build();
    }

    @Transactional
    public void markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getRecipient().getUserId().equals(userId)) {
            log.warn("Unauthorized notification access userId={} notificationId={}", userId, notificationId);
            throw new RuntimeException("Unauthorized notification access");
        }

        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
            log.info("Notification marked as read userId={} notificationId={}", userId, notificationId);
        } else {
            log.info("Notification already read userId={} notificationId={}", userId, notificationId);
        }
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository
            .findTop50ByRecipientUserIdOrderByCreatedAtDesc(userId);

        LocalDateTime now = LocalDateTime.now();
        int changed = 0;
        for (Notification notification : notifications) {
            if (!Boolean.TRUE.equals(notification.getIsRead())) {
                notification.setIsRead(true);
                notification.setReadAt(now);
                changed++;
            }
        }

        notificationRepository.saveAll(notifications);
        log.info("Marked notifications as read userId={} updatedCount={} scannedCount={}", userId, changed, notifications.size());
    }
}
