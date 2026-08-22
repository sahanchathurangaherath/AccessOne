package lk.AccessOne.entry.service;

import lk.AccessOne.entry.domain.AccessLog;
import lk.AccessOne.entry.domain.BlacklistEntry;
import lk.AccessOne.entry.domain.SecurityAlert;
import lk.AccessOne.entry.web.dto.AccessLogRow;
import lk.AccessOne.entry.web.dto.AlertDetail;
import lk.AccessOne.entry.web.dto.AlertRow;
import lk.AccessOne.entry.web.dto.BlacklistDto;
import lk.AccessOne.entry.web.dto.BlacklistRow;
import org.springframework.stereotype.Component;

/** Manual mapping only -- same reasoning as every other module's mapper: not worth a library at this size. */
@Component
public class EntryMapper {

    public AccessLogRow toRow(AccessLog l) {
        return new AccessLogRow(l.getId(), l.getCredentialType().name(), l.getCredentialRef(),
                l.getHolderName(), l.getAreaName(), l.getDirection().name(),
                l.getDecision().name(), l.getDenialReason(), l.getAccessTime());
    }

    public AlertRow toRow(SecurityAlert a, String areaName) {
        return new AlertRow(a.getId(), a.getAlertType().name(), a.getSeverity().name(),
                a.getMessage(), areaName, a.getStatus().name(), a.getCreatedAt());
    }

    public AlertDetail toDetail(SecurityAlert a, String areaName) {
        return new AlertDetail(a.getId(), a.getAlertType().name(), a.getSeverity().name(),
                a.getMessage(), a.getRelatedAccessLogId(), a.getAreaId(), areaName,
                a.getStatus().name(),
                a.getAcknowledgedBy() == null ? null : a.getAcknowledgedBy().getUsername(),
                a.getAcknowledgedAt(), a.getCreatedAt());
    }

    public BlacklistRow toRow(BlacklistEntry b, String targetType, String targetRef) {
        return new BlacklistRow(b.getId(), targetType, targetRef, b.getReason(),
                b.getBlacklistedBy().getUsername(), b.getBlacklistedAt(), b.isActive());
    }

    public BlacklistDto toDto(BlacklistEntry b, String targetType, String targetRef, String targetName) {
        return new BlacklistDto(b.getId(), targetType, targetRef, targetName, b.getReason(),
                b.getBlacklistedBy().getUsername(), b.getBlacklistedAt(),
                b.getReleasedAt(),
                b.getReleasedBy() == null ? null : b.getReleasedBy().getUsername(),
                b.isActive());
    }
}
