package lk.AccessOne.notification.service;

import lk.AccessOne.identity.domain.User;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.notification.domain.Notification;
import lk.AccessOne.notification.repository.NotificationRepository;
import lk.AccessOne.notification.web.dto.NotificationDto;
import lk.AccessOne.notification.web.dto.UnreadSummary;
import lk.AccessOne.shared.audit.CurrentUserProvider;
import lk.AccessOne.shared.enums.NotificationType;
import lk.AccessOne.shared.error.ResourceNotFoundException;
import lk.AccessOne.shared.web.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notifications;
    private final UserRepository users;
    private final CurrentUserProvider currentUser;

    public NotificationService(NotificationRepository notifications, UserRepository users,
                                CurrentUserProvider currentUser) {
        this.notifications = notifications;
        this.users = users;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationDto> list(Pageable pageable) {
        return PageResponse.of(
                notifications.findByUserIdOrderByCreatedAtDesc(currentUser.currentUserId(), pageable),
                NotificationService::toDto);
    }

    @Transactional(readOnly = true)
    public UnreadSummary unreadCount() {
        return new UnreadSummary(notifications.countByUserIdAndReadFalse(currentUser.currentUserId()));
    }

    /**
     * Scoped to the caller's own id, both in the lookup and in the 404 --
     * a notification addressed to someone else does not exist as far as
     * this caller is concerned.
     */
    @Transactional
    public NotificationDto markRead(Long id) {
        Notification notification = notifications.findByIdAndUserId(id, currentUser.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification", id));
        notification.markRead();
        return toDto(notification);
    }

    @Transactional
    public void markAllRead() {
        notifications.findUnreadByUserId(currentUser.currentUserId()).forEach(Notification::markRead);
    }

    /** Raised by NotificationListener; kept here so the write path has one owner. */
    @Transactional
    public void create(Long userId, NotificationType type, String title, String message,
                        String entityName, Long entityId, String actionPath) {
        User user = users.getReferenceById(userId);
        notifications.save(new Notification(user, type, title, message, entityName, entityId, actionPath));
    }

    private static NotificationDto toDto(Notification n) {
        return new NotificationDto(
                n.getId(), n.getType().name(), n.getTitle(), n.getMessage(),
                n.getEntityName(), n.getEntityId(), n.getActionPath(),
                n.isRead(), n.getCreatedAt());
    }
}
