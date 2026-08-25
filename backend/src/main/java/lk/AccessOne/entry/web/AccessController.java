package lk.AccessOne.entry.web;

import jakarta.validation.Valid;
import lk.AccessOne.entry.decision.AccessRequest;
import lk.AccessOne.entry.service.AccessDecisionService;
import lk.AccessOne.entry.web.dto.AccessLogRow;
import lk.AccessOne.entry.web.dto.AccessResult;
import lk.AccessOne.entry.web.dto.DenialSummary;
import lk.AccessOne.entry.web.dto.EvaluateRequest;
import lk.AccessOne.shared.enums.AccessDecision;
import lk.AccessOne.shared.web.ApiPaths;
import lk.AccessOne.shared.web.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** Thin. DTOs in, DTOs out -- every rule lives in the strategies and the service. */
@RestController
@RequestMapping(ApiPaths.API_V1 + "/access")
public class AccessController {

    private final AccessDecisionService service;

    public AccessController(AccessDecisionService service) {
        this.service = service;
    }

    /** The entry point. One call, both credential types. */
    @PostMapping("/evaluate")
    public AccessResult evaluate(@RequestBody @Valid EvaluateRequest body) {
        return service.evaluate(AccessRequest.now(
                body.credentialRef().trim(), body.areaCode().trim(), body.direction()));
    }

    @GetMapping("/logs")
    public PageResponse<AccessLogRow> logs(
            @RequestParam(required = false) String credentialRef,
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) AccessDecision decision,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20, sort = "accessTime", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.logs(credentialRef, areaId, decision, from, to, pageable);
    }

    @GetMapping("/logs/denials-by-reason")
    public List<DenialSummary> denialsByReason(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from) {
        return service.denialsByReason(from);
    }
}
