package lk.AccessOne.print.domain;

import lk.AccessOne.card.domain.IdCard;
import lk.AccessOne.cardrequest.domain.CardRequest;
import lk.AccessOne.identity.domain.Role;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.organisation.domain.Department;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.enums.PrintJobType;
import lk.AccessOne.shared.enums.PrintStatus;
import lk.AccessOne.shared.enums.QcResult;
import lk.AccessOne.shared.enums.RequestType;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.InvalidStateTransitionException;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Pure domain tests -- no Spring context, no database. PrintJob.move() is
 * the one place status changes, so the constraints it upholds
 * (chk_printjobs_printed, chk_printjobs_cancel) are worth pinning down
 * here rather than trusting them by inspection.
 */
class PrintJobTest {

    private User operator() {
        return new User("printops", "hash", null, new Role("PRINT_SUPERVISOR", null));
    }

    private IdCard card() {
        Department dept = new Department("FIN", "Finance", null);
        Employee employee = new Employee("EMP001", "Nimal", "Perera", "982345678V",
                "nimal@accessone.lk", null, "Software Engineer", dept, LocalDate.now());
        CardRequest request = CardRequest.draft("REQ-2026-9001", employee, RequestType.NEW,
                null, null, null, null);
        return IdCard.generate("ACO-2026-000010", request, employee, null, (short) 1, null);
    }

    private PrintJob queuedJob() {
        return PrintJob.queue("PJ-2026-0100", card(), PrintJobType.INITIAL, operator());
    }

    private PrintJob printedJob() {
        PrintJob job = queuedJob();
        job.start("Zebra-ZC300-01");
        job.markPrinted();
        return job;
    }

    @Test
    void queueStartsInQueuedWithNoPrinterYet() {
        PrintJob job = queuedJob();

        assertThat(job.getStatus()).isEqualTo(PrintStatus.QUEUED);
        assertThat(job.getQcResult()).isEqualTo(QcResult.PENDING);
        assertThat(job.getPrinterName()).isNull();
    }

    @Test
    void markPrintedSetsStatusAndTimestampTogether() {
        PrintJob job = queuedJob();
        job.start("Zebra-ZC300-01");

        job.markPrinted();

        // chk_printjobs_printed would reject the row if only one were set.
        assertThat(job.getStatus()).isEqualTo(PrintStatus.PRINTED);
        assertThat(job.getPrintedAt()).isNotNull();
    }

    @Test
    void aPrintedJobCannotBeCancelled() {
        PrintJob job = printedJob();

        assertThatThrownBy(() -> job.cancel("changed my mind"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("physical card exists");
        assertThat(job.getStatus()).isEqualTo(PrintStatus.PRINTED);
    }

    @Test
    void cancellingAQueuedJobRequiresAReason() {
        PrintJob job = queuedJob();

        assertThatThrownBy(() -> job.cancel(" "))
                .isInstanceOf(BusinessRuleException.class);
        assertThat(job.getStatus()).isEqualTo(PrintStatus.QUEUED);
    }

    @Test
    void cancellingAQueuedJobSucceedsWithAReason() {
        PrintJob job = queuedJob();

        job.cancel("Duplicate job raised in error");

        assertThat(job.getStatus()).isEqualTo(PrintStatus.CANCELLED);
        assertThat(job.getCancelledReason()).isEqualTo("Duplicate job raised in error");
    }

    @Test
    void qualityFailureRequiresNotes() {
        PrintJob job = printedJob();

        assertThatThrownBy(() -> job.recordQualityCheck(QcResult.FAIL, "  "))
                .isInstanceOf(BusinessRuleException.class);
        assertThat(job.getStatus()).isEqualTo(PrintStatus.PRINTED);   // unchanged
    }

    @Test
    void qualityFailureWithNotesIsTerminalForThisJob() {
        PrintJob job = printedJob();

        job.recordQualityCheck(QcResult.FAIL, "Photograph printed with visible banding");

        assertThat(job.getStatus()).isEqualTo(PrintStatus.QC_FAILED);
        assertThat(job.getQcNotes()).isEqualTo("Photograph printed with visible banding");
        // A reprint is a new PrintJob (service-level), never a reopening of this one.
        assertThatThrownBy(() -> job.recordQualityCheck(QcResult.PASS, null))
                .isInstanceOf(InvalidStateTransitionException.class);
    }

    @Test
    void qualityPassMakesTheJobDispatchable() {
        PrintJob job = printedJob();

        job.recordQualityCheck(QcResult.PASS, null);

        assertThat(job.getStatus()).isEqualTo(PrintStatus.QC_PASSED);
        assertThat(job.isDispatchable()).isTrue();
    }

    @Test
    void aFreshlyQueuedJobIsNotDispatchable() {
        assertThat(queuedJob().isDispatchable()).isFalse();
    }
}
