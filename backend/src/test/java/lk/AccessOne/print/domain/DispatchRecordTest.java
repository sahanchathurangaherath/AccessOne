package lk.AccessOne.print.domain;

import lk.AccessOne.card.domain.IdCard;
import lk.AccessOne.cardrequest.domain.CardRequest;
import lk.AccessOne.identity.domain.Role;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.organisation.domain.Department;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.enums.DispatchMethod;
import lk.AccessOne.shared.enums.DispatchStatus;
import lk.AccessOne.shared.enums.PrintJobType;
import lk.AccessOne.shared.enums.QcResult;
import lk.AccessOne.shared.enums.RequestType;
import lk.AccessOne.shared.error.BusinessRuleException;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Pure domain tests. recordHandover() is the method chk_dispatch_delivered
 * is really about: the database will not accept DELIVERED without both a
 * receiver and a timestamp, so this pins down that the entity never lets
 * one be set without the other.
 */
class DispatchRecordTest {

    private Employee employee(String empId) {
        Department dept = new Department("FIN", "Finance", null);
        return new Employee(empId, "Nimal", "Perera", "982345678V" + empId,
                empId.toLowerCase() + "@accessone.lk", null, "Software Engineer", dept, LocalDate.now());
    }

    private PrintJob qcPassedJob() {
        Employee employee = employee("EMP001");
        CardRequest request = CardRequest.draft("REQ-2026-9001", employee, RequestType.NEW,
                null, null, null, null);
        IdCard card = IdCard.generate("ACO-2026-000010", request, employee, null, (short) 1, null);
        User operator = new User("printops", "hash", null, new Role("PRINT_SUPERVISOR", null));

        PrintJob job = PrintJob.queue("PJ-2026-0100", card, PrintJobType.INITIAL, operator);
        job.start("Zebra-ZC300-01");
        job.markPrinted();
        job.recordQualityCheck(QcResult.PASS, null);
        return job;
    }

    @Test
    void openRefusesAJobThatHasNotPassedQc() {
        PrintJob job = PrintJob.queue("PJ-2026-0101",
                IdCard.generate("ACO-2026-000011",
                        CardRequest.draft("REQ-2026-9002", employee("EMP002"), RequestType.NEW,
                                null, null, null, null),
                        employee("EMP002"), null, (short) 1, null),
                PrintJobType.INITIAL, new User("printops", "hash", null, new Role("PRINT_SUPERVISOR", null)));

        assertThatThrownBy(() -> DispatchRecord.open(job, DispatchMethod.COLLECTION, null))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void openStartsPendingForAQcPassedJob() {
        DispatchRecord record = DispatchRecord.open(qcPassedJob(), DispatchMethod.COLLECTION, null);

        assertThat(record.getStatus()).isEqualTo(DispatchStatus.PENDING);
    }

    @Test
    void handoverWithoutAReceiverIsRefused() {
        DispatchRecord record = DispatchRecord.open(qcPassedJob(), DispatchMethod.COLLECTION, null);
        record.dispatch();

        assertThatThrownBy(() -> record.recordHandover(null, null))
                .isInstanceOf(BusinessRuleException.class);
        assertThat(record.getStatus()).isEqualTo(DispatchStatus.DISPATCHED);
    }

    @Test
    void handoverRecordsReceiverAndTimestampTogether() {
        DispatchRecord record = DispatchRecord.open(qcPassedJob(), DispatchMethod.COLLECTION, null);
        record.dispatch();
        Employee receiver = employee("EMP099");

        record.recordHandover(receiver, null);

        // chk_dispatch_delivered would reject the row otherwise.
        assertThat(record.getStatus()).isEqualTo(DispatchStatus.DELIVERED);
        assertThat(record.getReceivedBy()).isSameAs(receiver);
        assertThat(record.getHandedOverAt()).isNotNull();
    }

    @Test
    void returnedCanBeReDispatched() {
        DispatchRecord record = DispatchRecord.open(qcPassedJob(), DispatchMethod.COURIER, null);
        record.dispatch();
        record.markReturned("Recipient not available");

        assertThat(record.getStatus()).isEqualTo(DispatchStatus.RETURNED);

        record.dispatch();
        assertThat(record.getStatus()).isEqualTo(DispatchStatus.DISPATCHED);
    }
}
