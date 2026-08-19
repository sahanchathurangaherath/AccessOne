package lk.AccessOne.visitor.service;

import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.visitor.domain.VisitLog;
import lk.AccessOne.visitor.domain.Visitor;
import lk.AccessOne.visitor.domain.VisitorPass;
import lk.AccessOne.visitor.repository.OnSiteRepository;
import lk.AccessOne.visitor.repository.VisitorReportRepository;
import lk.AccessOne.visitor.web.dto.DailyReportDto;
import lk.AccessOne.visitor.web.dto.OnSiteDto;
import lk.AccessOne.visitor.web.dto.PassDetail;
import lk.AccessOne.visitor.web.dto.PassRow;
import lk.AccessOne.visitor.web.dto.PassVerification;
import lk.AccessOne.visitor.web.dto.VisitLogDto;
import lk.AccessOne.visitor.web.dto.VisitorDto;
import org.springframework.stereotype.Component;

/** Manual mapping only -- same reasoning as every other module's mapper: not worth a library at this size. */
@Component
public class VisitorMapper {

    public VisitorDto toDto(Visitor v) {
        Employee host = v.getHostEmployee();
        return new VisitorDto(
                v.getId(), v.getVisitorCode(), v.getFullName(),
                v.getIdDocumentNo(), v.getIdDocumentType().name(),
                v.getCompany(), v.getPhone(), v.getEmail(), v.getVisitorType().name(),
                host.getId(), host.getFullName(), host.getEmpId(),
                v.getPhotoPath() != null, v.isDeleted(), v.getCreatedAt());
    }

    public PassRow toRow(VisitorPass p) {
        return new PassRow(
                p.getId(), p.getPassNo(), p.getVisitor().getFullName(), p.getVisitor().getVisitorCode(),
                p.getHostEmployee().getFullName(), p.getStatus().name(),
                p.getValidFrom(), p.getValidUntil());
    }

    public PassDetail toDetail(VisitorPass p) {
        Employee host = p.getHostEmployee();
        return new PassDetail(
                p.getId(), p.getPassNo(),
                p.getVisitor().getId(), p.getVisitor().getFullName(), p.getVisitor().getVisitorCode(),
                host.getId(), host.getFullName(), host.getEmpId(),
                p.getAccessLevel().getId(), p.getAccessLevel().getLevelName(),
                p.getPurpose(), p.getValidFrom(), p.getValidUntil(),
                p.getStatus().name(), p.getCancelledReason(),
                p.getIssuedAt(), p.getIssuedBy().getUsername(), p.getCreatedAt());
    }

    public PassVerification toVerification(VisitorPass p, java.time.LocalDateTime moment) {
        return new PassVerification(
                true, p.getId(), p.getPassNo(), p.getStatus().name(), p.isUsableAt(moment),
                p.denialReasonAt(moment), p.getVisitor().getFullName(),
                p.getHostEmployee().getFullName(), p.getAccessLevel().getLevelName());
    }

    public VisitLogDto toDto(VisitLog l) {
        return new VisitLogDto(
                l.getId(), l.getPass().getId(), l.getPass().getPassNo(), l.getPass().getVisitor().getFullName(),
                l.getEntryArea() == null ? null : l.getEntryArea().getAreaName(),
                l.getCheckInAt(), l.getCheckOutAt(), l.getRemarks());
    }

    public OnSiteDto toOnSite(OnSiteRepository.OnSiteRow row) {
        return new OnSiteDto(
                row.getVisitLogId(), row.getPassId(), row.getVisitorCode(), row.getVisitorName(), row.getCompany(),
                row.getVisitorType(), row.getPassNo(), row.getPassStatus(), row.getValidUntil(),
                row.getHostName(), row.getHostEmpId(), row.getEntryArea(),
                row.getCheckInAt(), row.getMinutesOnSite(), Boolean.TRUE.equals(row.getPassOverdue()));
    }

    public DailyReportDto toDto(VisitorReportRepository.DailyRow row) {
        return new DailyReportDto(row.getVisitDate(), row.getTotalVisits(), row.getStillOnSite(),
                row.getDistinctVisitors(), row.getContractorVisits(), row.getAvgMinutesOnSite());
    }
}
