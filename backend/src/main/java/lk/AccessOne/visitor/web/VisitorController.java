package lk.AccessOne.visitor.web;

import jakarta.validation.Valid;
import lk.AccessOne.shared.web.ApiPaths;
import lk.AccessOne.shared.web.PageResponse;
import lk.AccessOne.shared.web.ReportCsv;
import lk.AccessOne.visitor.service.VisitLogService;
import lk.AccessOne.visitor.service.VisitorService;
import lk.AccessOne.visitor.web.dto.DailyReportDto;
import lk.AccessOne.visitor.web.dto.OnSiteDto;
import lk.AccessOne.visitor.web.dto.RegisterVisitorInput;
import lk.AccessOne.visitor.web.dto.UpdateVisitorInput;
import lk.AccessOne.visitor.web.dto.VisitorDto;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/** Thin. DTOs in, DTOs out, no business logic -- every rule lives in the service. */
@RestController
@RequestMapping(ApiPaths.API_V1 + "/visitors")
public class VisitorController {

    private final VisitorService service;
    private final VisitLogService visitLogService;

    public VisitorController(VisitorService service, VisitLogService visitLogService) {
        this.service = service;
        this.visitLogService = visitLogService;
    }

    @GetMapping
    public PageResponse<VisitorDto> list(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.search(search, pageable);
    }

    @GetMapping("/{id}")
    public VisitorDto get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VisitorDto register(@RequestBody @Valid RegisterVisitorInput body) {
        return service.register(body);
    }

    @PutMapping("/{id}")
    public VisitorDto update(@PathVariable Long id, @RequestBody @Valid UpdateVisitorInput body) {
        return service.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PostMapping(value = "/{id}/photo", consumes = "multipart/form-data")
    public VisitorDto photo(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        return service.uploadPhoto(id, file);
    }

    @GetMapping("/on-site")
    public List<OnSiteDto> onSite() {
        return visitLogService.onSite();
    }

    @GetMapping("/reports/daily")
    public List<DailyReportDto> daily(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate) {
        return visitLogService.dailySummary(fromDate == null ? LocalDateTime.now().minusDays(30) : fromDate);
    }

    @GetMapping("/reports/daily/export")
    public org.springframework.http.ResponseEntity<byte[]> exportDaily(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate) {
        List<List<String>> rows = daily(fromDate).stream()
                .map(r -> List.of(r.visitDate().toString(), String.valueOf(r.totalVisits()),
                        String.valueOf(r.stillOnSite()), String.valueOf(r.distinctVisitors()),
                        String.valueOf(r.contractorVisits()), r.avgMinutesOnSite().toString()))
                .toList();
        return ReportCsv.of("daily-visitors",
                List.of("Date", "Total visits", "Still on site", "Distinct visitors", "Contractor visits", "Avg minutes on site"),
                rows);
    }
}
