package lk.AccessOne.print.service;

import lk.AccessOne.card.domain.IdCard;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.print.domain.DispatchRecord;
import lk.AccessOne.print.domain.PrintJob;
import lk.AccessOne.print.repository.ProductionReportRepository;
import lk.AccessOne.print.web.dto.DispatchDetail;
import lk.AccessOne.print.web.dto.DispatchRow;
import lk.AccessOne.print.web.dto.PrintJobDetail;
import lk.AccessOne.print.web.dto.PrintJobRow;
import lk.AccessOne.print.web.dto.ReprintRateDto;
import lk.AccessOne.print.web.dto.ThroughputDto;
import org.springframework.stereotype.Component;

/** Manual mapping only -- same reasoning as every other module's mapper: not worth a library at this size. */
@Component
public class PrintMapper {

    public PrintJobRow toRow(PrintJob j) {
        Employee e = j.getCard().getEmployee();
        return new PrintJobRow(
                j.getId(), j.getJobNo(), j.getCard().getCardSerial(),
                e.getFullName(), e.getEmpId(), e.getDepartment().getDeptName(),
                j.getJobType().name(), j.getStatus().name(), j.getPrinterName(),
                j.getQueuedAt(), j.getPrintedAt());
    }

    public PrintJobDetail toDetail(PrintJob j) {
        Employee e = j.getCard().getEmployee();
        return new PrintJobDetail(
                j.getId(), j.getJobNo(), j.getCard().getId(), j.getCard().getCardSerial(),
                e.getFullName(), e.getEmpId(), e.getDepartment().getDeptName(),
                j.getJobType().name(), j.getStatus().name(), j.getPrinterName(),
                j.getQueuedAt(), j.getPrintedAt(),
                j.getQcResult().name(), j.getQcNotes(), j.getCancelledReason(),
                j.isDispatchable(), j.getCreatedAt());
    }

    public DispatchRow toRow(DispatchRecord d) {
        IdCard card = d.getPrintJob().getCard();
        return new DispatchRow(
                d.getId(), d.getPrintJob().getId(), d.getPrintJob().getJobNo(), card.getCardSerial(),
                card.getEmployee().getFullName(), d.getDispatchMethod().name(), d.getStatus().name(),
                d.getDispatchedAt(), d.getHandedOverAt());
    }

    public DispatchDetail toDetail(DispatchRecord d) {
        IdCard card = d.getPrintJob().getCard();
        Employee employee = card.getEmployee();
        return new DispatchDetail(
                d.getId(), d.getPrintJob().getId(), d.getPrintJob().getJobNo(),
                card.getId(), card.getCardSerial(),
                employee.getId(), employee.getFullName(), employee.getEmpId(),
                d.getDispatchMethod().name(), d.getStatus().name(), d.getDispatchedAt(),
                d.getReceivedBy() == null ? null : d.getReceivedBy().getFullName(),
                d.getHandedOverAt(), d.getHandoverSignaturePath(), d.getRemarks(),
                d.getCreatedAt());
    }

    public ReprintRateDto toDto(ProductionReportRepository.ReprintRateRow row) {
        return new ReprintRateDto(row.getDeptName(), row.getTotalJobs(), row.getInitialJobs(),
                row.getReprintJobs(), row.getReprintRatePct(), row.getQcFailures());
    }

    public ThroughputDto toDto(ProductionReportRepository.ThroughputRow row) {
        return new ThroughputDto(row.getPrintDate(), row.getCardsPrinted(),
                row.getPassed(), row.getFailed(), row.getAvgHoursInQueue());
    }
}
