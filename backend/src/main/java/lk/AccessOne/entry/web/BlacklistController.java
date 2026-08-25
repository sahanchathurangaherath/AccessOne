package lk.AccessOne.entry.web;

import jakarta.validation.Valid;
import lk.AccessOne.entry.service.BlacklistService;
import lk.AccessOne.entry.web.dto.BlacklistCardRequest;
import lk.AccessOne.entry.web.dto.BlacklistDto;
import lk.AccessOne.entry.web.dto.BlacklistRow;
import lk.AccessOne.entry.web.dto.BlacklistVisitorRequest;
import lk.AccessOne.shared.web.ApiPaths;
import lk.AccessOne.shared.web.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.API_V1 + "/blacklist")
public class BlacklistController {

    private final BlacklistService service;

    public BlacklistController(BlacklistService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<BlacklistRow> list(@PageableDefault(size = 20) Pageable pageable) {
        return service.list(pageable);
    }

    @PostMapping("/cards")
    @ResponseStatus(HttpStatus.CREATED)
    public BlacklistDto blacklistCard(@RequestBody @Valid BlacklistCardRequest body) {
        return service.blacklistCard(body.cardId(), body.reason());
    }

    @PostMapping("/visitors")
    @ResponseStatus(HttpStatus.CREATED)
    public BlacklistDto blacklistVisitor(@RequestBody @Valid BlacklistVisitorRequest body) {
        return service.blacklistVisitor(body.visitorId(), body.reason());
    }

    @PostMapping("/{id}/release")
    public BlacklistDto release(@PathVariable Long id) {
        return service.release(id);
    }
}
