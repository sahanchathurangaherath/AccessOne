package lk.AccessOne.visitor.web;

import jakarta.validation.Valid;
import lk.AccessOne.shared.enums.PassStatus;
import lk.AccessOne.shared.web.ApiPaths;
import lk.AccessOne.shared.web.PageResponse;
import lk.AccessOne.visitor.service.PassExpiryScheduler;
import lk.AccessOne.visitor.service.VisitLogService;
import lk.AccessOne.visitor.service.VisitorPassService;
import lk.AccessOne.visitor.web.dto.CheckInRequest;
import lk.AccessOne.visitor.web.dto.ExtendPassRequest;
import lk.AccessOne.visitor.web.dto.IssuePassInput;
import lk.AccessOne.visitor.web.dto.PassDetail;
import lk.AccessOne.visitor.web.dto.PassRow;
import lk.AccessOne.visitor.web.dto.PassVerification;
import lk.AccessOne.visitor.web.dto.ReasonRequest;
import lk.AccessOne.visitor.web.dto.VisitLogDto;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Thin. DTOs in, DTOs out, no business logic -- every rule lives in the service. */
@RestController
@RequestMapping(ApiPaths.API_V1 + "/passes")
public class VisitorPassController {

    private final VisitorPassService service;
    private final VisitLogService visitLogService;
    private final PassExpiryScheduler scheduler;

    public VisitorPassController(VisitorPassService service, VisitLogService visitLogService,
                                  PassExpiryScheduler scheduler) {
        this.service = service;
        this.visitLogService = visitLogService;
        this.scheduler = scheduler;
    }

    @GetMapping
    public PageResponse<PassRow> list(
            @RequestParam(required = false) PassStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.search(status, pageable);
    }

    @GetMapping("/{id}")
    public PassDetail get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PassDetail issue(@RequestBody @Valid IssuePassInput body) {
        return service.issue(body);
    }

    @PostMapping("/{id}/extend")
    public PassDetail extend(@PathVariable Long id, @RequestBody @Valid ExtendPassRequest body) {
        return service.extend(id, body.newUntil(), body.reason());
    }

    @PostMapping("/{id}/suspend")
    public PassDetail suspend(@PathVariable Long id) { return service.suspend(id); }

    @PostMapping("/{id}/reinstate")
    public PassDetail reinstate(@PathVariable Long id) { return service.reinstate(id); }

    @PostMapping("/{id}/cancel")
    public PassDetail cancel(@PathVariable Long id, @RequestBody @Valid ReasonRequest body) {
        return service.cancel(id, body.reason());
    }

    @PostMapping("/{id}/check-in")
    public VisitLogDto checkIn(@PathVariable Long id, @RequestBody(required = false) CheckInRequest body) {
        return visitLogService.checkIn(id, body == null ? null : body.areaId());
    }

    @PostMapping("/{id}/check-out")
    public VisitLogDto checkOut(@PathVariable Long id, @RequestBody(required = false) ReasonRequest body) {
        return visitLogService.checkOut(id, body == null ? null : body.reason());
    }

    @PostMapping("/{id}/return")
    public PassDetail markReturned(@PathVariable Long id) { return service.markReturned(id); }

    @GetMapping(value = "/{id}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    public byte[] qr(@PathVariable Long id, @RequestParam(defaultValue = "300") int size) {
        return service.qrImage(id, size);
    }

    /** Phase 12's lookup. Returns found=false rather than throwing. */
    @GetMapping("/by-pass-no/{passNo}")
    public PassVerification verify(@PathVariable String passNo) {
        return service.verifyByPassNo(passNo);
    }

    /** Demonstrates the Phase 1 stored procedure alongside the Java sweep. */
    @PostMapping("/expire-sweep")
    public ExpireSweepResult expireSweep() {
        return new ExpireSweepResult(scheduler.runStoredProcedureSweep());
    }

    public record ExpireSweepResult(int expiredCount) { }
}
