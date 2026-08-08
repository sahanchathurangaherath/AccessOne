package lk.AccessOne.shared.audit;

import lk.AccessOne.shared.enums.AuditAction;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Four modules want a status history, and all four read the same table the
 * same way. Callers must have already checked the caller may see the
 * record -- this service reads the trail; it does not decide who may read
 * it. A shared service that tried to decide access would need to know six
 * different ownership rules and would get one of them wrong.
 */
@Service
public class TimelineService {

    private static final Pattern STATUS_FIELD = Pattern.compile("\"status\"\\s*:\\s*\"([A-Z_]+)\"");

    private final AuditLogRepository auditLogs;

    public TimelineService(AuditLogRepository auditLogs) {
        this.auditLogs = auditLogs;
    }

    @Transactional(readOnly = true)
    public List<TimelineEntry> forEntity(String entityName, Long entityId) {
        return auditLogs.findByEntityNameAndEntityIdOrderByPerformedAtAsc(entityName, entityId)
                .stream()
                .map(log -> new TimelineEntry(
                        log.getAction().name(),
                        extractStatus(log.getNewValue()),
                        log.getPerformedByUsername(),
                        log.getPerformedAt(),
                        describe(log.getAction())))
                .toList();
    }

    /**
     * AuditLog.newValue is a small hand-built JSON string (see AuditEvent),
     * never a user-controlled document, so a regex extraction is enough --
     * pulling in a JSON library for one field is not worth the dependency.
     */
    private String extractStatus(String json) {
        if (json == null) return null;
        Matcher matcher = STATUS_FIELD.matcher(json);
        return matcher.find() ? matcher.group(1) : null;
    }

    private String describe(AuditAction action) {
        return switch (action) {
            case CREATE -> "Created";
            case UPDATE -> "Details updated";
            case STATUS_CHANGE -> "Status changed";
            case DELETE -> "Deleted";
            case APPROVE -> "Approved";
            case REJECT -> "Rejected";
            case REVOKE -> "Revoked";
            default -> action.name();
        };
    }
}
