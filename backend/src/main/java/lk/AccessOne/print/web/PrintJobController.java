package lk.AccessOne.print.web;

import jakarta.validation.Valid;
import lk.AccessOne.card.service.CardPdf;
import lk.AccessOne.print.service.PrintJobService;
import lk.AccessOne.print.web.dto.PrintJobDetail;
import lk.AccessOne.print.web.dto.PrintJobRow;
import lk.AccessOne.print.web.dto.QcRequest;
import lk.AccessOne.print.web.dto.QueueJobRequest;
import lk.AccessOne.print.web.dto.ReasonRequest;
import lk.AccessOne.print.web.dto.ReprintRateDto;
import lk.AccessOne.print.web.dto.ReprintRequest;
import lk.AccessOne.print.web.dto.StartJobRequest;
import lk.AccessOne.print.web.dto.ThroughputDto;
import lk.AccessOne.shared.enums.PrintStatus;
import lk.AccessOne.shared.web.ApiPaths;
import lk.AccessOne.shared.web.PageResponse;
import lk.AccessOne.shared.web.ReportCsv;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

/** Thin. DTOs in, DTOs out, no business logic -- every rule lives in the service. */
@RestController
@RequestMapping(ApiPaths.API_V1 + "/print")
public class PrintJobController {

    private final PrintJobService service;

    public PrintJobController(PrintJobService service) {
        this.service = service;
    }

    @GetMapping("/jobs")
    public PageResponse<PrintJobRow> queue(
            @RequestParam(required = false) PrintStatus status,
            @PageableDefault(size = 20, sort = "queuedAt", direction = Sort.Direction.ASC) Pageable pageable) {
        return service.queue(status, pageable);
    }

    @GetMapping("/jobs/{id}")
    public PrintJobDetail get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping("/jobs")
    @ResponseStatus(HttpStatus.CREATED)
    public PrintJobDetail queueJob(@RequestBody @Valid QueueJobRequest body) {
        return service.queueJob(body.cardId());
    }

    @PostMapping("/jobs/{id}/start")
    public PrintJobDetail start(@PathVariable Long id, @RequestBody @Valid StartJobRequest body) {
        return service.start(id, body.printerName());
    }

    @PostMapping("/jobs/{id}/complete")
    public PrintJobDetail complete(@PathVariable Long id) {
        return service.markPrinted(id);
    }

    @PostMapping("/jobs/{id}/qc")
    public PrintJobDetail qc(@PathVariable Long id, @RequestBody @Valid QcRequest body) {
        return service.recordQualityCheck(id, body.result(), body.notes());
    }

    @PostMapping("/jobs/{id}/reprint")
    @ResponseStatus(HttpStatus.CREATED)
    public PrintJobDetail reprint(@PathVariable Long id, @RequestBody(required = false) ReprintRequest body) {
        return service.reprint(id, body == null ? null : body.reason());
    }

    @PostMapping("/jobs/{id}/cancel")
    public PrintJobDetail cancel(@PathVariable Long id, @RequestBody @Valid ReasonRequest body) {
        return service.cancel(id, body.reason());
    }

    @GetMapping(value = "/jobs/{id}/card-file", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> cardFile(@PathVariable Long id) {
        CardPdf pdf = service.printFile(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"%s.pdf\"".formatted(pdf.serial()))
                .body(pdf.bytes());
    }

    @GetMapping("/reports/reprint-rate")
    public List<ReprintRateDto> reprintRate(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate) {
        return service.reprintRate(fromDate);
    }

    @GetMapping("/reports/throughput")
    public List<ThroughputDto> throughput() {
        return service.throughput();
    }

    @GetMapping("/reports/reprint-rate/export")
    public ResponseEntity<byte[]> exportReprintRate(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate) {
        List<List<String>> rows = service.reprintRate(fromDate).stream()
                .map(r -> List.of(r.deptName(), String.valueOf(r.totalJobs()), String.valueOf(r.initialJobs()),
                        String.valueOf(r.reprintJobs()), r.reprintRatePct().toString(), String.valueOf(r.qcFailures())))
                .toList();
        return ReportCsv.of("reprint-rate",
                List.of("Department", "Total jobs", "Initial jobs", "Reprint jobs", "Reprint rate %", "QC failures"),
                rows);
    }

    @GetMapping("/reports/throughput/export")
    public ResponseEntity<byte[]> exportThroughput() {
        List<List<String>> rows = service.throughput().stream()
                .map(t -> List.of(t.printDate().toString(), String.valueOf(t.cardsPrinted()),
                        String.valueOf(t.passed()), String.valueOf(t.failed()), t.avgHoursInQueue().toString()))
                .toList();
        return ReportCsv.of("print-throughput",
                List.of("Date", "Printed", "Passed", "Failed", "Avg hours in queue"),
                rows);
    }
}
