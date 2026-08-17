package lk.AccessOne.print.web;

import jakarta.validation.Valid;
import lk.AccessOne.print.service.DispatchService;
import lk.AccessOne.print.web.dto.DispatchDetail;
import lk.AccessOne.print.web.dto.DispatchRow;
import lk.AccessOne.print.web.dto.OpenDispatchRequest;
import lk.AccessOne.print.web.dto.ReasonRequest;
import lk.AccessOne.shared.web.ApiPaths;
import lk.AccessOne.shared.web.PageResponse;
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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Thin. DTOs in, DTOs out, no business logic -- every rule lives in the service. */
@RestController
@RequestMapping(ApiPaths.API_V1 + "/dispatch")
public class DispatchController {

    private final DispatchService service;

    public DispatchController(DispatchService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<DispatchRow> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.list(pageable);
    }

    @GetMapping("/{id}")
    public DispatchDetail get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DispatchDetail open(@RequestBody @Valid OpenDispatchRequest body) {
        return service.open(body.printJobId(), body.dispatchMethod(), body.remarks());
    }

    @PostMapping("/{id}/dispatch")
    public DispatchDetail dispatch(@PathVariable Long id) {
        return service.dispatch(id);
    }

    /**
     * The moment the card becomes active. receiverId must match the
     * card's own employee -- DispatchService enforces that, not this
     * controller, so a direct API call gets the same guarantee as the UI.
     */
    @PostMapping(value = "/{id}/handover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DispatchDetail handover(@PathVariable Long id,
                                   @RequestParam Long receiverId,
                                   @RequestPart(required = false) MultipartFile signature) {
        return service.recordHandover(id, receiverId, signature);
    }

    @PostMapping("/{id}/return")
    public DispatchDetail markReturned(@PathVariable Long id, @RequestBody @Valid ReasonRequest body) {
        return service.markReturned(id, body.reason());
    }
}
