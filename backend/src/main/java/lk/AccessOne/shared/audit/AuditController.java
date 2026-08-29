package lk.AccessOne.shared.audit;

import lk.AccessOne.shared.enums.AuditAction;
import lk.AccessOne.shared.web.ApiPaths;
import lk.AccessOne.shared.web.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

/**
 * SYSTEM_ADMIN only (enforced in SecurityConfig, not here) -- an audit
 * trail readable by the people it audits is not much of a control.
 */
@RestController
@RequestMapping(ApiPaths.API_V1 + "/audit")
public class AuditController {

    private final AuditLogRepository auditLogs;

    public AuditController(AuditLogRepository auditLogs) {
        this.auditLogs = auditLogs;
    }

    @GetMapping
    public PageResponse<AuditLogRow> search(
            @RequestParam(required = false) String entityName,
            @RequestParam(required = false) Long entityId,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @PageableDefault(size = 25, sort = "performedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return PageResponse.of(
                auditLogs.search(entityName, entityId, action, username, from, to, pageable),
                AuditLogRow::from);
    }
}
