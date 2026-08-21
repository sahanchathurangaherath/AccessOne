package lk.AccessOne.visitor.web.dto;

import java.time.LocalDateTime;

public record OnSiteDto(
        Long visitLogId, Long passId, String visitorCode, String visitorName, String company,
        String visitorType, String passNo, String passStatus, LocalDateTime validUntil,
        String hostName, String hostEmpId, String entryArea,
        LocalDateTime checkInAt, Integer minutesOnSite, boolean passOverdue) { }
