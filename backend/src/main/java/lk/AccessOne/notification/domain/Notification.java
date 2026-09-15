package lk.AccessOne.notification.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.shared.domain.BaseEntity;
import lk.AccessOne.shared.enums.NotificationType;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Transient. Read, and eventually pruned -- the permanent record of what
 * happened is audit_logs, which is why this table can cascade on the
 * user being deleted while audit_logs never does: a notification has no
 * meaning without its recipient.
 */
@Entity
@Table(name = "notifications")
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 40)
    private NotificationType type;

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "message", nullable = false, length = 500)
    private String message;

    @Column(name = "entity_name", length = 60)
    private String entityName;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "action_path", length = 255)
    private String actionPath;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    protected Notification() { }

    public Notification(User user, NotificationType type, String title, String message,
                         String entityName, Long entityId, String actionPath) {
        this.user = user;
        this.type = type;
        this.title = title;
        this.message = message;
        this.entityName = entityName;
        this.entityId = entityId;
        this.actionPath = actionPath;
    }

    /** chk_notifications_read: is_read = 0 OR read_at IS NOT NULL. */
    public void markRead() {
        if (read) return;
        this.read = true;
        this.readAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public User getUser()               { return user; }
    public NotificationType getType()   { return type; }
    public String getTitle()            { return title; }
    public String getMessage()          { return message; }
    public String getEntityName()       { return entityName; }
    public Long getEntityId()           { return entityId; }
    public String getActionPath()       { return actionPath; }
    public boolean isRead()             { return read; }
    public LocalDateTime getReadAt()    { return readAt; }
}
