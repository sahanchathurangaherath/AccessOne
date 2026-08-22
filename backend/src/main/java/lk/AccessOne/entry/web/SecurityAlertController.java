package lk.AccessOne.entry.web;

import lk.AccessOne.entry.service.SecurityAlertService;
import lk.AccessOne.entry.web.dto.AlertDetail;
import lk.AccessOne.entry.web.dto.AlertRow;
import lk.AccessOne.shared.enums.AlertStatus;
import lk.AccessOne.shared.web.ApiPaths;
import lk.AccessOne.shared.web.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.API_V1 + "/alerts")
public class SecurityAlertController {

    private final SecurityAlertService service;

    public SecurityAlertController(SecurityAlertService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<AlertRow> list(
            @RequestParam(required = false) AlertStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.list(status, pageable);
    }

    @GetMapping("/{id}")
    public AlertDetail get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping("/{id}/acknowledge")
    public AlertDetail acknowledge(@PathVariable Long id) {
        return service.acknowledge(id);
    }

    @PostMapping("/{id}/resolve")
    public AlertDetail resolve(@PathVariable Long id) {
        return service.resolve(id);
    }

    @PostMapping("/{id}/dismiss")
    public AlertDetail dismiss(@PathVariable Long id) {
        return service.dismiss(id);
    }
}
